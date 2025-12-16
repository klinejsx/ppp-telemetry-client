/**
 * GPU telemetry collector (Mali T860 - Panfrost)
 */

import type { GpuTelemetry, GpuFrequencyTelemetry, GpuGovernor } from "../types";
import { readSysfs, readSysfsInt, hzToMhz } from "../utils/sysfs";
import { PATHS } from "./paths";

export async function collectGpuFrequency(): Promise<GpuFrequencyTelemetry> {
  const [curFreq, targetFreq, minFreq, maxFreq, governor, availableFreqs, pollingInterval] =
    await Promise.all([
      readSysfsInt(PATHS.gpu.curFreq),
      readSysfsInt(PATHS.gpu.targetFreq),
      readSysfsInt(PATHS.gpu.minFreq),
      readSysfsInt(PATHS.gpu.maxFreq),
      readSysfs(PATHS.gpu.governor),
      readSysfs(PATHS.gpu.availableFreqs),
      readSysfsInt(PATHS.gpu.pollingInterval),
    ]);

  const frequencies = (availableFreqs ?? "")
    .split(/\s+/)
    .map((s) => hzToMhz(parseInt(s, 10)))
    .filter((n) => !isNaN(n) && n > 0);

  return {
    currentFreq: hzToMhz(curFreq ?? 0),
    targetFreq: hzToMhz(targetFreq ?? 0),
    minFreq: hzToMhz(minFreq ?? 0),
    maxFreq: hzToMhz(maxFreq ?? 0),
    governor: (governor as GpuGovernor) ?? "unknown",
    availableFrequencies: frequencies,
    pollingIntervalMs: pollingInterval ?? 0,
  };
}

export async function collectGpu(): Promise<GpuTelemetry> {
  const frequency = await collectGpuFrequency();

  // TODO: Parse trans_stat for transition statistics if needed
  // The format is complex and may not be worth parsing for basic telemetry

  return { frequency };
}

