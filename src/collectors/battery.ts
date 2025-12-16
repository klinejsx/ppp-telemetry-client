/**
 * Battery and power supply collector
 */

import type {
  BatteryTelemetry,
  BatteryStatus,
  BatteryHealth,
  ChargeType,
  UsbInputTelemetry,
  UsbCPdTelemetry,
  UsbType,
  TypeCPortTelemetry,
  DataRole,
  PowerRole,
  PowerOperationMode,
  PowerTelemetry,
} from "../types";
import { readSysfs, readSysfsInt, readSysfsBool, uvToV, uaToA } from "../utils/sysfs";
import { PATHS } from "./paths";

export async function collectBattery(): Promise<BatteryTelemetry> {
  const [
    capacity,
    status,
    voltage,
    current,
    temp,
    chargeFull,
    chargeFullDesign,
    health,
    present,
    chargeType,
    energyFullDesign,
  ] = await Promise.all([
    readSysfsInt(PATHS.battery.capacity),
    readSysfs(PATHS.battery.status),
    readSysfsInt(PATHS.battery.voltage),
    readSysfsInt(PATHS.battery.current),
    readSysfsInt(PATHS.battery.temp),
    readSysfsInt(PATHS.battery.chargeFull),
    readSysfsInt(PATHS.battery.chargeFullDesign),
    readSysfs(PATHS.battery.health),
    readSysfsBool(PATHS.battery.present),
    readSysfs(PATHS.battery.chargeType),
    readSysfsInt(PATHS.battery.energyFullDesign),
  ]);

  return {
    capacity: capacity ?? 0,
    status: (status as BatteryStatus) ?? "Unknown",
    voltage: uvToV(voltage ?? 0),
    current: uaToA(current ?? 0),
    temperature: (temp ?? 0) / 10, // temp is in 0.1°C units
    chargeFull: (chargeFull ?? 0) / 1000, // µAh to mAh
    chargeFullDesign: (chargeFullDesign ?? 0) / 1000,
    health: (health as BatteryHealth) ?? "Unknown",
    present: present ?? false,
    chargeType: (chargeType as ChargeType) ?? "Unknown",
    energyFullDesign: (energyFullDesign ?? 0) / 1_000_000, // µWh to Wh
  };
}

export async function collectUsbInput(): Promise<UsbInputTelemetry> {
  const [present, health, inputCurrentLimit, inputVoltageLimit] = await Promise.all([
    readSysfsBool(PATHS.usbInput.present),
    readSysfs(PATHS.usbInput.health),
    readSysfsInt(PATHS.usbInput.inputCurrentLimit),
    readSysfsInt(PATHS.usbInput.inputVoltageLimit),
  ]);

  return {
    present: present ?? false,
    health: (health as BatteryHealth) ?? "Unknown",
    inputCurrentLimit: uaToA(inputCurrentLimit ?? 0),
    inputVoltageLimit: uvToV(inputVoltageLimit ?? 0),
  };
}

export async function collectUsbCPd(): Promise<UsbCPdTelemetry> {
  const [online, voltage, voltageMin, voltageMax, current, currentMax, usbType] =
    await Promise.all([
      readSysfsBool(PATHS.usbCPd.online),
      readSysfsInt(PATHS.usbCPd.voltage),
      readSysfsInt(PATHS.usbCPd.voltageMin),
      readSysfsInt(PATHS.usbCPd.voltageMax),
      readSysfsInt(PATHS.usbCPd.current),
      readSysfsInt(PATHS.usbCPd.currentMax),
      readSysfs(PATHS.usbCPd.usbType),
    ]);

  // Parse USB type - format might be "[PD] C DCP" with current selected in brackets
  let parsedUsbType: UsbType = "Unknown";
  if (usbType) {
    const match = usbType.match(/\[(\w+)\]/);
    if (match) {
      parsedUsbType = match[1] as UsbType;
    } else {
      parsedUsbType = usbType.split(/\s+/)[0] as UsbType;
    }
  }

  return {
    online: online ?? false,
    voltage: uvToV(voltage ?? 0),
    voltageMin: uvToV(voltageMin ?? 0),
    voltageMax: uvToV(voltageMax ?? 0),
    current: uaToA(current ?? 0),
    currentMax: uaToA(currentMax ?? 0),
    usbType: parsedUsbType,
  };
}

export async function collectTypeCPort(): Promise<TypeCPortTelemetry> {
  const [dataRole, powerRole, orientation, powerOperationMode, vconnSource] =
    await Promise.all([
      readSysfs(PATHS.typeCPort.dataRole),
      readSysfs(PATHS.typeCPort.powerRole),
      readSysfs(PATHS.typeCPort.orientation),
      readSysfs(PATHS.typeCPort.powerOperationMode),
      readSysfsBool(PATHS.typeCPort.vconnSource),
    ]);

  return {
    dataRole: (dataRole as DataRole) ?? "device",
    powerRole: (powerRole as PowerRole) ?? "sink",
    orientation: orientation ?? "unknown",
    powerOperationMode: (powerOperationMode as PowerOperationMode) ?? "default",
    vconnSource: vconnSource ?? false,
  };
}

export async function collectPower(): Promise<PowerTelemetry> {
  const [battery, usbInput, usbCPd, typeCPort] = await Promise.all([
    collectBattery(),
    collectUsbInput(),
    collectUsbCPd(),
    collectTypeCPort(),
  ]);

  return { battery, usbInput, usbCPd, typeCPort };
}

