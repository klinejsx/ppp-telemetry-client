/**
 * Collectors module - exports all telemetry collectors
 */

export { PATHS } from "./paths";

// Individual collectors
export { collectPower, collectBattery, collectUsbInput, collectUsbCPd, collectTypeCPort } from "./battery";
export { collectThermal, collectThermalZone, collectCoolingDevice } from "./thermal";
export { collectCpu, collectCpuFrequency, collectCpuFrequencyStats, collectCpuIdle, collectCpuTimes, collectLoadAverage } from "./cpu";
export { collectGpu, collectGpuFrequency } from "./gpu";
export { collectMemory } from "./memory";
export { collectNetwork } from "./network";
export { collectStorage } from "./storage";
export { collectSensors } from "./sensors";
export { collectProcesses } from "./processes";
export { collectSystem } from "./system";

// Re-export types for convenience
export type {
  HighFrequencyTelemetry,
  MediumFrequencyTelemetry,
  LowFrequencyTelemetry,
  TelemetryPayload,
  FullTelemetrySnapshot,
} from "../types";

import type {
  HighFrequencyTelemetry,
  MediumFrequencyTelemetry,
  LowFrequencyTelemetry,
  FullTelemetrySnapshot,
} from "../types";

import { collectPower } from "./battery";
import { collectThermal } from "./thermal";
import { collectCpu } from "./cpu";
import { collectGpu } from "./gpu";
import { collectMemory } from "./memory";
import { collectNetwork } from "./network";
import { collectStorage } from "./storage";
import { collectSensors } from "./sensors";
import { collectProcesses } from "./processes";
import { collectSystem } from "./system";
import { config } from "../config";

/**
 * Collect high-frequency telemetry (every ~5 seconds)
 * Battery, thermal, CPU frequencies, memory, network
 */
export async function collectHighFrequency(): Promise<HighFrequencyTelemetry> {
  const [power, thermal, cpu, memory, network] = await Promise.all([
    config.collectors.battery ? collectPower() : null,
    config.collectors.thermal ? collectThermal() : null,
    config.collectors.cpu ? collectCpu(false) : null, // Without detailed stats
    config.collectors.memory ? collectMemory() : null,
    config.collectors.network ? collectNetwork() : null,
  ]);

  return {
    power: power!,
    thermal: thermal!,
    cpu: {
      frequencies: cpu?.frequencies ?? [],
      cpuTimes: cpu?.cpuTimes ?? [],
      loadAverage: cpu?.loadAverage ?? { load1: 0, load5: 0, load15: 0, runningProcesses: 0, totalProcesses: 0 },
      uptime: cpu?.uptime ?? 0,
      idleTime: cpu?.idleTime ?? 0,
      onlineCpus: cpu?.onlineCpus ?? [],
      offlineCpus: cpu?.offlineCpus ?? [],
    },
    memory: memory!,
    network: network!,
  };
}

/**
 * Collect medium-frequency telemetry (every ~60 seconds)
 * CPU stats, GPU, storage, processes
 */
export async function collectMediumFrequency(): Promise<MediumFrequencyTelemetry> {
  const [cpu, gpu, storage, processes] = await Promise.all([
    config.collectors.cpu ? collectCpu(true) : null, // With detailed stats
    config.collectors.gpu ? collectGpu() : null,
    config.collectors.storage ? collectStorage() : null,
    config.collectors.processes ? collectProcesses() : null,
  ]);

  return {
    cpuStats: {
      frequencyStats: cpu?.frequencyStats ?? [],
      idleStats: cpu?.idleStats ?? [],
    },
    gpu: gpu!,
    storage: storage!,
    processes: processes!,
  };
}

/**
 * Collect low-frequency telemetry (every ~5 minutes)
 * Sensors, system state
 */
export async function collectLowFrequency(): Promise<LowFrequencyTelemetry> {
  const [sensors, system] = await Promise.all([
    config.collectors.sensors ? collectSensors() : null,
    collectSystem(),
  ]);

  return {
    sensors: sensors!,
    system: system!,
  };
}

/**
 * Collect full system snapshot (all telemetry)
 */
export async function collectFullSnapshot(): Promise<Omit<FullTelemetrySnapshot, "deviceId" | "timestamp" | "timestampMs">> {
  const [power, thermal, cpu, gpu, memory, network, storage, sensors, processes, system] =
    await Promise.all([
      collectPower(),
      collectThermal(),
      collectCpu(true),
      collectGpu(),
      collectMemory(),
      collectNetwork(),
      collectStorage(),
      collectSensors(),
      collectProcesses(),
      collectSystem(),
    ]);

  return {
    power,
    thermal,
    cpu,
    gpu,
    memory,
    network,
    storage,
    sensors,
    processes,
    system,
  };
}

