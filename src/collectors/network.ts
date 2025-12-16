/**
 * Network telemetry collector
 */

import type {
  NetworkTelemetry,
  NetworkInterfaceTelemetry,
  NetworkInterfaceStats,
  OperationalState,
} from "../types";
import { readSysfs, readSysfsInt, readSysfsBool, parseNetDev, listSysfsDir } from "../utils/sysfs";
import { PATHS } from "./paths";

function getInterfaceType(name: string): NetworkInterfaceTelemetry["type"] {
  if (name.startsWith("wlan")) return "wifi";
  if (name.startsWith("wwan")) return "cellular";
  if (name.startsWith("usb")) return "usb";
  if (name === "lo") return "loopback";
  return "other";
}

async function collectInterfaceStats(iface: string): Promise<NetworkInterfaceStats> {
  const statsPath = PATHS.network.ifaceStats(iface);
  const [
    rxBytes,
    txBytes,
    rxPackets,
    txPackets,
    rxErrors,
    txErrors,
    rxDropped,
    txDropped,
    rxFifo,
    txFifo,
    rxFrame,
    txCarrier,
    collisions,
  ] = await Promise.all([
    readSysfsInt(`${statsPath}/rx_bytes`),
    readSysfsInt(`${statsPath}/tx_bytes`),
    readSysfsInt(`${statsPath}/rx_packets`),
    readSysfsInt(`${statsPath}/tx_packets`),
    readSysfsInt(`${statsPath}/rx_errors`),
    readSysfsInt(`${statsPath}/tx_errors`),
    readSysfsInt(`${statsPath}/rx_dropped`),
    readSysfsInt(`${statsPath}/tx_dropped`),
    readSysfsInt(`${statsPath}/rx_fifo_errors`),
    readSysfsInt(`${statsPath}/tx_fifo_errors`),
    readSysfsInt(`${statsPath}/rx_frame_errors`),
    readSysfsInt(`${statsPath}/tx_carrier_errors`),
    readSysfsInt(`${statsPath}/collisions`),
  ]);

  return {
    rxBytes: rxBytes ?? 0,
    txBytes: txBytes ?? 0,
    rxPackets: rxPackets ?? 0,
    txPackets: txPackets ?? 0,
    rxErrors: rxErrors ?? 0,
    txErrors: txErrors ?? 0,
    rxDropped: rxDropped ?? 0,
    txDropped: txDropped ?? 0,
    rxFifo: rxFifo ?? 0,
    txFifo: txFifo ?? 0,
    rxFrame: rxFrame ?? 0,
    txCarrier: txCarrier ?? 0,
    collisions: collisions ?? 0,
  };
}

async function collectInterface(name: string): Promise<NetworkInterfaceTelemetry> {
  const [carrier, carrierChanges, operstate, mtu, address, stats] = await Promise.all([
    readSysfsBool(PATHS.network.ifaceCarrier(name)),
    readSysfsInt(`/sys/class/net/${name}/carrier_changes`),
    readSysfs(PATHS.network.ifaceOperstate(name)),
    readSysfsInt(PATHS.network.ifaceMtu(name)),
    readSysfs(PATHS.network.ifaceAddress(name)),
    collectInterfaceStats(name),
  ]);

  return {
    name,
    address: address ?? "00:00:00:00:00:00",
    carrier: carrier ?? false,
    carrierChanges: carrierChanges ?? 0,
    operstate: (operstate as OperationalState) ?? "unknown",
    mtu: mtu ?? 0,
    stats,
    type: getInterfaceType(name),
  };
}

export async function collectNetwork(): Promise<NetworkTelemetry> {
  // Get list of network interfaces
  const entries = await listSysfsDir(PATHS.network.interfaces);
  const ifaceNames = entries.filter((e) => !e.startsWith(".")); // Exclude hidden

  // Collect all interfaces
  const interfaces = await Promise.all(ifaceNames.map(collectInterface));

  // Calculate totals (excluding loopback)
  let totalRxBytes = 0;
  let totalTxBytes = 0;
  for (const iface of interfaces) {
    if (iface.type !== "loopback") {
      totalRxBytes += iface.stats.rxBytes;
      totalTxBytes += iface.stats.txBytes;
    }
  }

  return {
    interfaces,
    totalRxBytes,
    totalTxBytes,
  };
}

