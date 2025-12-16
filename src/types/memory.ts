/**
 * Memory telemetry types
 */

/** System memory telemetry from /proc/meminfo */
export interface MemoryTelemetry {
  /** Total physical RAM in bytes */
  total: number;
  /** Free memory in bytes */
  free: number;
  /** Available memory (including reclaimable) in bytes */
  available: number;
  /** Buffer cache in bytes */
  buffers: number;
  /** Page cache in bytes */
  cached: number;
  /** Total swap space in bytes */
  swapTotal: number;
  /** Free swap space in bytes */
  swapFree: number;
  /** Used swap space in bytes */
  swapUsed: number;
  /** Active memory (recently used) in bytes */
  active: number;
  /** Inactive memory in bytes */
  inactive: number;
  /** Active anonymous pages in bytes */
  activeAnon: number;
  /** Inactive anonymous pages in bytes */
  inactiveAnon: number;
  /** Active file-backed pages in bytes */
  activeFile: number;
  /** Inactive file-backed pages in bytes */
  inactiveFile: number;
  /** Memory waiting to be written back in bytes */
  dirty: number;
  /** Memory currently being written back in bytes */
  writeback: number;
  /** Anonymous pages in bytes */
  anonPages: number;
  /** Memory-mapped files in bytes */
  mapped: number;
  /** Shared memory in bytes */
  shmem: number;
  /** Kernel slab cache in bytes */
  slab: number;
  /** Reclaimable slab in bytes */
  sReclaimable: number;
  /** Unreclaimable slab in bytes */
  sUnreclaim: number;

  // Calculated percentages for convenience
  /** Memory usage percentage */
  usedPercent: number;
  /** Swap usage percentage */
  swapUsedPercent: number;
}

/** ZRAM statistics */
export interface ZramTelemetry {
  /** Device name */
  device: string;
  /** Original data size in bytes */
  origDataSize: number;
  /** Compressed data size in bytes */
  compDataSize: number;
  /** Memory used by zram in bytes */
  memUsedTotal: number;
  /** Memory limit in bytes */
  memLimit: number;
  /** Maximum memory used in bytes */
  memUsedMax: number;
  /** Compression ratio */
  compressionRatio: number;
}

