/**
 * Storage I/O telemetry types
 */

/** Block device type */
export type BlockDeviceType = "emmc" | "sdcard" | "zram" | "loop" | "other";

/** Block device statistics */
export interface BlockDeviceStats {
  /** Reads completed successfully */
  readsCompleted: number;
  /** Reads merged */
  readsMerged: number;
  /** Sectors read */
  sectorsRead: number;
  /** Time spent reading (ms) */
  readTimeMs: number;
  /** Writes completed */
  writesCompleted: number;
  /** Writes merged */
  writesMerged: number;
  /** Sectors written */
  sectorsWritten: number;
  /** Time spent writing (ms) */
  writeTimeMs: number;
  /** I/Os currently in progress */
  iosInProgress: number;
  /** Time spent doing I/Os (ms) */
  ioTimeMs: number;
  /** Weighted time doing I/Os (ms) */
  weightedIoTimeMs: number;
}

/** Block device telemetry */
export interface BlockDeviceTelemetry {
  /** Device name (mmcblk2, mmcblk1, etc.) */
  name: string;
  /** Device type */
  type: BlockDeviceType;
  /** Device size in bytes */
  size: number;
  /** Device statistics */
  stats: BlockDeviceStats;
  /** Calculated read bytes (sectors * 512) */
  bytesRead: number;
  /** Calculated written bytes (sectors * 512) */
  bytesWritten: number;
  /** Partitions (if any) */
  partitions?: BlockDeviceTelemetry[];
}

/** Combined storage telemetry payload */
export interface StorageTelemetry {
  /** All block devices */
  devices: BlockDeviceTelemetry[];
  /** Total bytes read across all devices */
  totalBytesRead: number;
  /** Total bytes written across all devices */
  totalBytesWritten: number;
  /** Total I/O time across all devices (ms) */
  totalIoTimeMs: number;
}

