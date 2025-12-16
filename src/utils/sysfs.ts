/**
 * Utility functions for reading from sysfs and procfs
 * Optimized for Bun's native file reading
 */

import { readdir } from "fs/promises";

/**
 * Read a sysfs/procfs file and return trimmed string content
 * Returns null if file doesn't exist or can't be read
 */
export async function readSysfs(path: string): Promise<string | null> {
  try {
    const file = Bun.file(path);
    const text = await file.text();
    return text.trim();
  } catch {
    return null;
  }
}

/**
 * Read a sysfs file as a number
 * Returns null if file doesn't exist or content isn't a number
 */
export async function readSysfsNumber(path: string): Promise<number | null> {
  const text = await readSysfs(path);
  if (text === null) return null;
  const num = parseFloat(text);
  return isNaN(num) ? null : num;
}

/**
 * Read a sysfs file as an integer
 */
export async function readSysfsInt(path: string): Promise<number | null> {
  const text = await readSysfs(path);
  if (text === null) return null;
  const num = parseInt(text, 10);
  return isNaN(num) ? null : num;
}

/**
 * Read a sysfs file as a boolean (0/1, true/false, etc.)
 */
export async function readSysfsBool(path: string): Promise<boolean | null> {
  const text = await readSysfs(path);
  if (text === null) return null;
  return text === "1" || text.toLowerCase() === "true" || text.toLowerCase() === "yes";
}

/**
 * Read a sysfs file containing space/newline separated numbers
 */
export async function readSysfsNumberList(path: string): Promise<number[]> {
  const text = await readSysfs(path);
  if (text === null) return [];
  return text.split(/\s+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
}

/**
 * Read multiple sysfs files in parallel
 * Returns a map of path -> value (null for missing/error)
 */
export async function readSysfsMultiple(paths: string[]): Promise<Map<string, string | null>> {
  const results = await Promise.all(paths.map(p => readSysfs(p)));
  const map = new Map<string, string | null>();
  paths.forEach((path, i) => map.set(path, results[i]));
  return map;
}

/**
 * Read a sysfs directory and return list of entries
 */
export async function listSysfsDir(path: string): Promise<string[]> {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}

/**
 * Check if a sysfs path exists
 */
export async function sysfsExists(path: string): Promise<boolean> {
  try {
    const file = Bun.file(path);
    return await file.exists();
  } catch {
    return false;
  }
}

/**
 * Parse a line from /proc/stat for CPU times
 * Format: cpu[N] user nice system idle iowait irq softirq steal guest guest_nice
 */
export function parseCpuStatLine(line: string): {
  cpu: string;
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
} | null {
  const parts = line.trim().split(/\s+/);
  if (!parts[0]?.startsWith("cpu")) return null;
  
  return {
    cpu: parts[0],
    user: parseInt(parts[1], 10) || 0,
    nice: parseInt(parts[2], 10) || 0,
    system: parseInt(parts[3], 10) || 0,
    idle: parseInt(parts[4], 10) || 0,
    iowait: parseInt(parts[5], 10) || 0,
    irq: parseInt(parts[6], 10) || 0,
    softirq: parseInt(parts[7], 10) || 0,
    steal: parseInt(parts[8], 10) || 0,
  };
}

/**
 * Parse /proc/meminfo format (key: value kB)
 */
export function parseMeminfo(content: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of content.split("\n")) {
    const match = line.match(/^(\w+):\s+(\d+)/);
    if (match) {
      // Values are in kB, convert to bytes
      map.set(match[1], parseInt(match[2], 10) * 1024);
    }
  }
  return map;
}

/**
 * Parse /proc/net/dev format
 */
export interface NetDevStats {
  rxBytes: number;
  rxPackets: number;
  rxErrors: number;
  rxDropped: number;
  rxFifo: number;
  rxFrame: number;
  rxCompressed: number;
  rxMulticast: number;
  txBytes: number;
  txPackets: number;
  txErrors: number;
  txDropped: number;
  txFifo: number;
  txCollisions: number;
  txCarrier: number;
  txCompressed: number;
}

export function parseNetDev(content: string): Map<string, NetDevStats> {
  const map = new Map<string, NetDevStats>();
  const lines = content.split("\n").slice(2); // Skip header lines
  
  for (const line of lines) {
    const match = line.match(/^\s*(\w+):\s*(.+)$/);
    if (match) {
      const iface = match[1];
      const values = match[2].trim().split(/\s+/).map(Number);
      map.set(iface, {
        rxBytes: values[0] || 0,
        rxPackets: values[1] || 0,
        rxErrors: values[2] || 0,
        rxDropped: values[3] || 0,
        rxFifo: values[4] || 0,
        rxFrame: values[5] || 0,
        rxCompressed: values[6] || 0,
        rxMulticast: values[7] || 0,
        txBytes: values[8] || 0,
        txPackets: values[9] || 0,
        txErrors: values[10] || 0,
        txDropped: values[11] || 0,
        txFifo: values[12] || 0,
        txCollisions: values[13] || 0,
        txCarrier: values[14] || 0,
        txCompressed: values[15] || 0,
      });
    }
  }
  return map;
}

/**
 * Parse /proc/diskstats format
 */
export interface DiskStats {
  readsCompleted: number;
  readsMerged: number;
  sectorsRead: number;
  readTimeMs: number;
  writesCompleted: number;
  writesMerged: number;
  sectorsWritten: number;
  writeTimeMs: number;
  iosInProgress: number;
  ioTimeMs: number;
  weightedIoTimeMs: number;
}

export function parseDiskstats(content: string): Map<string, DiskStats> {
  const map = new Map<string, DiskStats>();
  
  for (const line of content.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 14) continue;
    
    const name = parts[2];
    map.set(name, {
      readsCompleted: parseInt(parts[3], 10) || 0,
      readsMerged: parseInt(parts[4], 10) || 0,
      sectorsRead: parseInt(parts[5], 10) || 0,
      readTimeMs: parseInt(parts[6], 10) || 0,
      writesCompleted: parseInt(parts[7], 10) || 0,
      writesMerged: parseInt(parts[8], 10) || 0,
      sectorsWritten: parseInt(parts[9], 10) || 0,
      writeTimeMs: parseInt(parts[10], 10) || 0,
      iosInProgress: parseInt(parts[11], 10) || 0,
      ioTimeMs: parseInt(parts[12], 10) || 0,
      weightedIoTimeMs: parseInt(parts[13], 10) || 0,
    });
  }
  return map;
}

/**
 * Convert microamps to amps
 */
export function uaToA(ua: number): number {
  return ua / 1_000_000;
}

/**
 * Convert microvolts to volts
 */
export function uvToV(uv: number): number {
  return uv / 1_000_000;
}

/**
 * Convert millidegrees Celsius to Celsius
 */
export function mCToC(mc: number): number {
  return mc / 1000;
}

/**
 * Convert kHz to MHz
 */
export function khzToMhz(khz: number): number {
  return khz / 1000;
}

/**
 * Convert Hz to MHz
 */
export function hzToMhz(hz: number): number {
  return hz / 1_000_000;
}

