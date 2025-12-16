/**
 * Memory telemetry collector
 */

import type { MemoryTelemetry } from "../types";
import { readSysfs, parseMeminfo } from "../utils/sysfs";
import { PATHS } from "./paths";

export async function collectMemory(): Promise<MemoryTelemetry> {
  const content = await readSysfs(PATHS.memory.meminfo);
  if (!content) {
    return {
      total: 0,
      free: 0,
      available: 0,
      buffers: 0,
      cached: 0,
      swapTotal: 0,
      swapFree: 0,
      swapUsed: 0,
      active: 0,
      inactive: 0,
      activeAnon: 0,
      inactiveAnon: 0,
      activeFile: 0,
      inactiveFile: 0,
      dirty: 0,
      writeback: 0,
      anonPages: 0,
      mapped: 0,
      shmem: 0,
      slab: 0,
      sReclaimable: 0,
      sUnreclaim: 0,
      usedPercent: 0,
      swapUsedPercent: 0,
    };
  }

  const mem = parseMeminfo(content);

  const total = mem.get("MemTotal") ?? 0;
  const free = mem.get("MemFree") ?? 0;
  const available = mem.get("MemAvailable") ?? 0;
  const swapTotal = mem.get("SwapTotal") ?? 0;
  const swapFree = mem.get("SwapFree") ?? 0;
  const swapUsed = swapTotal - swapFree;

  // Calculate usage percentages
  const usedPercent = total > 0 ? ((total - available) / total) * 100 : 0;
  const swapUsedPercent = swapTotal > 0 ? (swapUsed / swapTotal) * 100 : 0;

  return {
    total,
    free,
    available,
    buffers: mem.get("Buffers") ?? 0,
    cached: mem.get("Cached") ?? 0,
    swapTotal,
    swapFree,
    swapUsed,
    active: mem.get("Active") ?? 0,
    inactive: mem.get("Inactive") ?? 0,
    activeAnon: mem.get("Active(anon)") ?? 0,
    inactiveAnon: mem.get("Inactive(anon)") ?? 0,
    activeFile: mem.get("Active(file)") ?? 0,
    inactiveFile: mem.get("Inactive(file)") ?? 0,
    dirty: mem.get("Dirty") ?? 0,
    writeback: mem.get("Writeback") ?? 0,
    anonPages: mem.get("AnonPages") ?? 0,
    mapped: mem.get("Mapped") ?? 0,
    shmem: mem.get("Shmem") ?? 0,
    slab: mem.get("Slab") ?? 0,
    sReclaimable: mem.get("SReclaimable") ?? 0,
    sUnreclaim: mem.get("SUnreclaim") ?? 0,
    usedPercent,
    swapUsedPercent,
  };
}

