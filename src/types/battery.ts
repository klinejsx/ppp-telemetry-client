/**
 * Battery and power supply telemetry types
 */

/** Primary battery status */
export type BatteryStatus = "Charging" | "Discharging" | "Full" | "Not charging" | "Unknown";

/** Battery health status */
export type BatteryHealth = "Good" | "Overheat" | "Dead" | "Over voltage" | "Failure" | "Unknown";

/** Charge type during charging */
export type ChargeType = "Fast" | "Trickle" | "Standard" | "Unknown";

/** USB power types */
export type UsbType = "Unknown" | "SDP" | "DCP" | "CDP" | "ACA" | "C" | "PD" | "PD_DRP" | "PD_PPS" | "BrickID";

/** Type-C power operation modes */
export type PowerOperationMode = "default" | "1.5A" | "3.0A" | "usb_power_delivery";

/** Type-C data role */
export type DataRole = "host" | "device" | "[host]" | "[device]";

/** Type-C power role */
export type PowerRole = "source" | "sink" | "[source]" | "[sink]";

/** Primary battery telemetry (RK818) */
export interface BatteryTelemetry {
  /** Battery percentage (0-100) */
  capacity: number;
  /** Charging status */
  status: BatteryStatus;
  /** Current voltage in volts */
  voltage: number;
  /** Current draw in amps (positive = charging, negative = discharging) */
  current: number;
  /** Battery temperature in celsius */
  temperature: number;
  /** Current full charge capacity in mAh */
  chargeFull: number;
  /** Design full charge capacity in mAh */
  chargeFullDesign: number;
  /** Battery health status */
  health: BatteryHealth;
  /** Battery physically present */
  present: boolean;
  /** Charge type (if charging) */
  chargeType: ChargeType;
  /** Energy capacity in Wh */
  energyFullDesign: number;
}

/** USB input power telemetry */
export interface UsbInputTelemetry {
  /** USB power connected */
  present: boolean;
  /** Input health status */
  health: BatteryHealth;
  /** Input current limit in amps */
  inputCurrentLimit: number;
  /** Input voltage limit in volts */
  inputVoltageLimit: number;
}

/** USB-C Power Delivery telemetry */
export interface UsbCPdTelemetry {
  /** PD source connected */
  online: boolean;
  /** Negotiated voltage in volts */
  voltage: number;
  /** Minimum voltage in volts */
  voltageMin: number;
  /** Maximum voltage in volts */
  voltageMax: number;
  /** Current draw in amps */
  current: number;
  /** Maximum current in amps */
  currentMax: number;
  /** USB type */
  usbType: UsbType;
}

/** USB Type-C port status */
export interface TypeCPortTelemetry {
  /** Data role (host/device) */
  dataRole: DataRole;
  /** Power role (source/sink) */
  powerRole: PowerRole;
  /** Cable orientation */
  orientation: string;
  /** Power operation mode */
  powerOperationMode: PowerOperationMode;
  /** VCONN source active */
  vconnSource: boolean;
}

/** Combined power telemetry payload */
export interface PowerTelemetry {
  battery: BatteryTelemetry;
  usbInput: UsbInputTelemetry;
  usbCPd: UsbCPdTelemetry;
  typeCPort: TypeCPortTelemetry;
}

