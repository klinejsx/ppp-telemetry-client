/**
 * Type definitions index - re-exports all telemetry types
 */

// Battery & Power
export * from "./battery";

// Thermal
export * from "./thermal";

// CPU
export * from "./cpu";

// GPU
export * from "./gpu";

// Memory
export * from "./memory";

// Network
export * from "./network";

// Storage
export * from "./storage";

// Sensors
export * from "./sensors";

// Processes
export * from "./process";

// System
export * from "./system";

// Import types for the combined payload
import type { PowerTelemetry } from "./battery";
import type { ThermalTelemetry } from "./thermal";
import type { CpuTelemetry } from "./cpu";
import type { GpuTelemetry } from "./gpu";
import type { MemoryTelemetry } from "./memory";
import type { NetworkTelemetry } from "./network";
import type { StorageTelemetry } from "./storage";
import type { SensorsTelemetry } from "./sensors";
import type { ProcessesTelemetry } from "./process";
import type { SystemTelemetry } from "./system";

/**
 * Telemetry collection frequency levels
 */
export type TelemetryFrequency = "high" | "medium" | "low";

/**
 * High-frequency telemetry payload (every ~5 seconds)
 * - Battery status and power
 * - Temperatures
 * - CPU frequencies and load
 * - Memory usage
 * - Network throughput
 */
export interface HighFrequencyTelemetry {
  power: PowerTelemetry;
  thermal: ThermalTelemetry;
  cpu: Pick<CpuTelemetry, "frequencies" | "cpuTimes" | "loadAverage" | "uptime" | "idleTime" | "onlineCpus" | "offlineCpus">;
  memory: MemoryTelemetry;
  network: NetworkTelemetry;
}

/**
 * Medium-frequency telemetry payload (every ~60 seconds)
 * - CPU time-in-state statistics
 * - CPU idle state statistics
 * - Disk I/O statistics
 * - GPU frequency and stats
 * - Top processes
 */
export interface MediumFrequencyTelemetry {
  cpuStats: Pick<CpuTelemetry, "frequencyStats" | "idleStats">;
  gpu: GpuTelemetry;
  storage: StorageTelemetry;
  processes: ProcessesTelemetry;
}

/**
 * Low-frequency telemetry payload (every ~5 minutes)
 * - Full sensor readings
 * - System state (display, LEDs, RF kill)
 * - Detailed process list
 */
export interface LowFrequencyTelemetry {
  sensors: SensorsTelemetry;
  system: SystemTelemetry;
}

/**
 * Combined telemetry payload sent to server
 */
export interface TelemetryPayload {
  /** Device identifier */
  deviceId: string;
  /** Timestamp of collection (ISO 8601) */
  timestamp: string;
  /** Unix timestamp in milliseconds */
  timestampMs: number;
  /** Collection frequency level */
  frequency: TelemetryFrequency;
  /** Payload data based on frequency */
  data: HighFrequencyTelemetry | MediumFrequencyTelemetry | LowFrequencyTelemetry;
}

/**
 * Full system snapshot (all telemetry combined)
 */
export interface FullTelemetrySnapshot {
  deviceId: string;
  timestamp: string;
  timestampMs: number;
  power: PowerTelemetry;
  thermal: ThermalTelemetry;
  cpu: CpuTelemetry;
  gpu: GpuTelemetry;
  memory: MemoryTelemetry;
  network: NetworkTelemetry;
  storage: StorageTelemetry;
  sensors: SensorsTelemetry;
  processes: ProcessesTelemetry;
  system: SystemTelemetry;
}

/**
 * API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface TelemetryAck {
  received: boolean;
  id: string;
  timestamp: string;
}

