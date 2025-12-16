/**
 * Process telemetry types
 */

/** Process state */
export type ProcessState = 
  | "R"  // Running
  | "S"  // Sleeping (interruptible)
  | "D"  // Disk sleep (uninterruptible)
  | "Z"  // Zombie
  | "T"  // Stopped
  | "t"  // Tracing stop
  | "X"  // Dead
  | "I"; // Idle

/** Process telemetry from /proc/[pid]/stat and related files */
export interface ProcessTelemetry {
  /** Process ID */
  pid: number;
  /** Process name */
  name: string;
  /** Process state */
  state: ProcessState | string;
  /** Parent process ID */
  ppid: number;
  /** Process group ID */
  pgrp: number;
  /** Session ID */
  session: number;
  /** User time in milliseconds */
  userTimeMs: number;
  /** System time in milliseconds */
  systemTimeMs: number;
  /** Total CPU time in milliseconds */
  totalCpuTimeMs: number;
  /** CPU usage percentage (calculated over sample period) */
  cpuPercent?: number;
  /** Virtual memory size in bytes */
  vsize: number;
  /** Resident set size in bytes */
  rss: number;
  /** RSS limit in bytes */
  rssLimit: number;
  /** Memory usage percentage */
  memoryPercent: number;
  /** Number of threads */
  numThreads: number;
  /** Nice value */
  nice: number;
  /** Priority */
  priority: number;
  /** Start time (seconds since boot) */
  startTime: number;
  /** Command line */
  cmdline: string;
  /** OOM score (higher = more likely to be killed) */
  oomScore: number;
  /** Read bytes */
  readBytes?: number;
  /** Write bytes */
  writeBytes?: number;
}

/** Process summary for high-level overview */
export interface ProcessSummary {
  /** Total number of processes */
  total: number;
  /** Number of running processes */
  running: number;
  /** Number of sleeping processes */
  sleeping: number;
  /** Number of zombie processes */
  zombie: number;
  /** Number of stopped processes */
  stopped: number;
}

/** Combined process telemetry payload */
export interface ProcessesTelemetry {
  /** Top processes by resource usage */
  processes: ProcessTelemetry[];
  /** Process summary */
  summary: ProcessSummary;
  /** Total system CPU time since boot (ms) */
  totalCpuTime: number;
  /** System context switches */
  contextSwitches: number;
  /** Total processes created */
  processesCreated: number;
}

