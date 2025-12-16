/**
 * Thermal monitoring collector
 */

import type {
  ThermalTelemetry,
  ThermalZoneTelemetry,
  CoolingDeviceTelemetry,
} from "../types";
import { readSysfs, readSysfsInt, listSysfsDir, mCToC } from "../utils/sysfs";
import { PATHS } from "./paths";

export async function collectThermalZone(zone: number): Promise<ThermalZoneTelemetry | null> {
  const [temp, type] = await Promise.all([
    readSysfsInt(PATHS.thermal.zoneTemp(zone)),
    readSysfs(PATHS.thermal.zoneType(zone)),
  ]);

  if (temp === null) return null;

  return {
    zone,
    type: type ?? "unknown",
    temperature: mCToC(temp),
  };
}

export async function collectCoolingDevice(index: number): Promise<CoolingDeviceTelemetry | null> {
  const base = PATHS.thermal.coolingDevice(index);
  const [type, curState, maxState] = await Promise.all([
    readSysfs(`${base}/type`),
    readSysfsInt(`${base}/cur_state`),
    readSysfsInt(`${base}/max_state`),
  ]);

  if (type === null) return null;

  return {
    index,
    type,
    currentState: curState ?? 0,
    maxState: maxState ?? 0,
  };
}

export async function collectThermal(): Promise<ThermalTelemetry> {
  // Collect thermal zones (we know there are 3 on PinePhone Pro)
  const zonePromises = [0, 1, 2].map(collectThermalZone);
  const zones = (await Promise.all(zonePromises)).filter(
    (z): z is ThermalZoneTelemetry => z !== null
  );

  // Collect cooling devices
  const coolingEntries = await listSysfsDir(PATHS.thermal.zones);
  const coolingIndices = coolingEntries
    .filter((e) => e.startsWith("cooling_device"))
    .map((e) => parseInt(e.replace("cooling_device", ""), 10))
    .filter((n) => !isNaN(n));

  const coolingPromises = coolingIndices.map(collectCoolingDevice);
  const coolingDevices = (await Promise.all(coolingPromises)).filter(
    (c): c is CoolingDeviceTelemetry => c !== null
  );

  // Extract specific temperatures (by known zone indices)
  const batteryTemp = zones.find((z) => z.zone === 0)?.temperature ?? 0;
  const cpuTemp = zones.find((z) => z.zone === 1)?.temperature ?? 0;
  const gpuTemp = zones.find((z) => z.zone === 2)?.temperature ?? 0;

  return {
    zones,
    coolingDevices,
    batteryTemp,
    cpuTemp,
    gpuTemp,
  };
}

