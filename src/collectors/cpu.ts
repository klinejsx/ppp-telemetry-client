/**
 * CPU telemetry collector
 */

import type {
  CpuTelemetry,
  CpuFrequencyTelemetry,
  CpuFrequencyStats,
  CpuTimeInState,
  CpuIdleTelemetry,
  CpuIdleStateTelemetry,
  CpuTimeTelemetry,
  LoadAverage,
  CpuGovernor,
} from "../types";
import {
  readSysfs,
  readSysfsInt,
  readSysfsNumberList,
  parseCpuStatLine,
  khzToMhz,
} from "../utils/sysfs";
import { PATHS } from "./paths";

const NUM_CPUS = 6; // Pinephone Pro has 6 cores (2x A72 + 4x A53)
const NUM_IDLE_STATES = 3; // WFI, cpu-sleep, cluster-sleep

export async function collectCpuFrequency(cpu: number): Promise<CpuFrequencyTelemetry | null> {
  const [curFreq, minFreq, maxFreq, hwMinFreq, hwMaxFreq, governor] = await Promise.all([
    readSysfsInt(PATHS.cpu.scalingCurFreq(cpu)),
    readSysfsInt(PATHS.cpu.scalingMinFreq(cpu)),
    readSysfsInt(PATHS.cpu.scalingMaxFreq(cpu)),
    readSysfsInt(PATHS.cpu.cpuinfoMinFreq(cpu)),
    readSysfsInt(PATHS.cpu.cpuinfoMaxFreq(cpu)),
    readSysfs(PATHS.cpu.governor(cpu)),
  ]);

  if (curFreq === null) return null;

  return {
    cpu,
    currentFreq: khzToMhz(curFreq),
    minFreq: khzToMhz(minFreq ?? 0),
    maxFreq: khzToMhz(maxFreq ?? 0),
    hardwareMinFreq: khzToMhz(hwMinFreq ?? 0),
    hardwareMaxFreq: khzToMhz(hwMaxFreq ?? 0),
    governor: (governor as CpuGovernor) ?? "unknown",
  };
}

export async function collectCpuFrequencyStats(cpu: number): Promise<CpuFrequencyStats | null> {
  const [timeInStateRaw, totalTrans] = await Promise.all([
    readSysfs(PATHS.cpu.timeInState(cpu)),
    readSysfsInt(PATHS.cpu.totalTrans(cpu)),
  ]);

  if (timeInStateRaw === null) return null;

  // Parse time_in_state format: "freq_khz time_jiffies"
  const timeInState: CpuTimeInState[] = timeInStateRaw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [freq, time] = line.split(/\s+/).map(Number);
      return {
        frequency: khzToMhz(freq),
        timeMs: time * 10, // jiffies to ms (assuming HZ=100)
      };
    });

  return {
    cpu,
    timeInState,
    totalTransitions: totalTrans ?? 0,
  };
}

export async function collectCpuIdleState(
  cpu: number,
  state: number
): Promise<CpuIdleStateTelemetry | null> {
  const base = PATHS.cpu.idleState(cpu, state);
  const [name, desc, usage, time, latency] = await Promise.all([
    readSysfs(`${base}/name`),
    readSysfs(`${base}/desc`),
    readSysfsInt(`${base}/usage`),
    readSysfsInt(`${base}/time`),
    readSysfsInt(`${base}/latency`),
  ]);

  if (name === null) return null;

  return {
    index: state,
    name,
    description: desc ?? "",
    usage: usage ?? 0,
    timeUs: time ?? 0,
    latencyUs: latency ?? 0,
  };
}

export async function collectCpuIdle(cpu: number): Promise<CpuIdleTelemetry | null> {
  const statePromises = Array.from({ length: NUM_IDLE_STATES }, (_, i) =>
    collectCpuIdleState(cpu, i)
  );
  const states = (await Promise.all(statePromises)).filter(
    (s): s is CpuIdleStateTelemetry => s !== null
  );

  if (states.length === 0) return null;

  return { cpu, states };
}

export async function collectCpuTimes(): Promise<CpuTimeTelemetry[]> {
  const statContent = await readSysfs(PATHS.proc.stat);
  if (!statContent) return [];

  const lines = statContent.split("\n");
  const cpuTimes: CpuTimeTelemetry[] = [];

  for (const line of lines) {
    const parsed = parseCpuStatLine(line);
    if (parsed) {
      cpuTimes.push({
        cpu: parsed.cpu,
        user: parsed.user * 10, // jiffies to ms
        nice: parsed.nice * 10,
        system: parsed.system * 10,
        idle: parsed.idle * 10,
        iowait: parsed.iowait * 10,
        irq: parsed.irq * 10,
        softirq: parsed.softirq * 10,
        steal: parsed.steal * 10,
      });
    }
  }

  return cpuTimes;
}

export async function collectLoadAverage(): Promise<LoadAverage> {
  const content = await readSysfs(PATHS.proc.loadavg);
  if (!content) {
    return { load1: 0, load5: 0, load15: 0, runningProcesses: 0, totalProcesses: 0 };
  }

  const parts = content.split(/\s+/);
  const [running, total] = (parts[3] ?? "0/0").split("/").map(Number);

  return {
    load1: parseFloat(parts[0]) || 0,
    load5: parseFloat(parts[1]) || 0,
    load15: parseFloat(parts[2]) || 0,
    runningProcesses: running || 0,
    totalProcesses: total || 0,
  };
}

export async function collectUptime(): Promise<{ uptime: number; idleTime: number }> {
  const content = await readSysfs(PATHS.proc.uptime);
  if (!content) return { uptime: 0, idleTime: 0 };

  const [uptime, idleTime] = content.split(/\s+/).map(parseFloat);
  return { uptime: uptime || 0, idleTime: idleTime || 0 };
}

function parseOnlineList(content: string | null): number[] {
  if (!content) return [];
  const result: number[] = [];
  for (const part of content.split(",")) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) result.push(i);
    } else {
      result.push(Number(part));
    }
  }
  return result.filter((n) => !isNaN(n));
}

export async function collectCpu(includeStats = false): Promise<CpuTelemetry> {
  // Collect basic frequency info for all CPUs
  const freqPromises = Array.from({ length: NUM_CPUS }, (_, i) => collectCpuFrequency(i));
  const frequencies = (await Promise.all(freqPromises)).filter(
    (f): f is CpuFrequencyTelemetry => f !== null
  );

  // Collect CPU times and load average
  const [cpuTimes, loadAverage, uptimeData, onlineRaw, offlineRaw] = await Promise.all([
    collectCpuTimes(),
    collectLoadAverage(),
    collectUptime(),
    readSysfs(PATHS.cpu.online),
    readSysfs(PATHS.cpu.offline),
  ]);

  const result: CpuTelemetry = {
    frequencies,
    cpuTimes,
    loadAverage,
    uptime: uptimeData.uptime,
    idleTime: uptimeData.idleTime,
    onlineCpus: parseOnlineList(onlineRaw),
    offlineCpus: parseOnlineList(offlineRaw),
  };

  // Optionally include detailed stats (for medium-frequency collection)
  if (includeStats) {
    const statsPromises = Array.from({ length: NUM_CPUS }, (_, i) =>
      collectCpuFrequencyStats(i)
    );
    const idlePromises = Array.from({ length: NUM_CPUS }, (_, i) => collectCpuIdle(i));

    const [frequencyStats, idleStats] = await Promise.all([
      Promise.all(statsPromises),
      Promise.all(idlePromises),
    ]);

    result.frequencyStats = frequencyStats.filter(
      (s): s is CpuFrequencyStats => s !== null
    );
    result.idleStats = idleStats.filter((s): s is CpuIdleTelemetry => s !== null);
  }

  return result;
}

