/**
 * Thermal monitoring telemetry types
 */

/** Thermal zone types on Pinephone Pro */
export type ThermalZoneType = "rk818-battery" | "cpu-thermal" | "gpu-thermal";

/** Thermal trip point types */
export type TripPointType = "passive" | "active" | "critical" | "hot";

/** Individual thermal zone telemetry */
export interface ThermalZoneTelemetry {
  /** Zone identifier */
  zone: number;
  /** Zone type name */
  type: ThermalZoneType | string;
  /** Current temperature in celsius */
  temperature: number;
  /** Trip points */
  tripPoints?: TripPoint[];
}

/** Thermal trip point configuration */
export interface TripPoint {
  /** Trip point index */
  index: number;
  /** Temperature threshold in celsius */
  temperature: number;
  /** Trip point type */
  type: TripPointType;
}

/** Cooling device telemetry */
export interface CoolingDeviceTelemetry {
  /** Device index */
  index: number;
  /** Cooling device type/name */
  type: string;
  /** Current cooling state (0 = no cooling) */
  currentState: number;
  /** Maximum cooling state */
  maxState: number;
}

/** Combined thermal telemetry payload */
export interface ThermalTelemetry {
  /** All thermal zones */
  zones: ThermalZoneTelemetry[];
  /** All cooling devices */
  coolingDevices: CoolingDeviceTelemetry[];
  /** Battery temperature (from zone 0) */
  batteryTemp: number;
  /** CPU temperature (from zone 1) */
  cpuTemp: number;
  /** GPU temperature (from zone 2) */
  gpuTemp: number;
}

