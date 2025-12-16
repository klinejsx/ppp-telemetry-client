/**
 * CPU telemetry types
 */

/** CPU frequency governor types */
export type CpuGovernor = 
  | "performance"
  | "powersave"
  | "ondemand"
  | "conservative"
  | "schedutil"
  | "userspace";

/** CPU idle state names */
export type CpuIdleState = "WFI" | "cpu-sleep" | "cluster-sleep";

/** Per-CPU frequency telemetry */
export interface CpuFrequencyTelemetry {
  /** CPU core index */
  cpu: number;
  /** Current frequency in MHz */
  currentFreq: number;
  /** Minimum scaling frequency in MHz */
  minFreq: number;
  /** Maximum scaling frequency in MHz */
  maxFreq: number;
  /** Hardware minimum frequency in MHz */
  hardwareMinFreq: number;
  /** Hardware maximum frequency in MHz */
  hardwareMaxFreq: number;
  /** Active frequency governor */
  governor: CpuGovernor | string;
}

/** CPU frequency time-in-state statistics */
export interface CpuTimeInState {
  /** Frequency in MHz */
  frequency: number;
  /** Time spent at this frequency in milliseconds */
  timeMs: number;
}

/** CPU frequency statistics */
export interface CpuFrequencyStats {
  /** CPU core index */
  cpu: number;
  /** Time spent at each frequency */
  timeInState: CpuTimeInState[];
  /** Total frequency transitions */
  totalTransitions: number;
}

/** CPU idle state statistics */
export interface CpuIdleStateTelemetry {
  /** State index */
  index: number;
  /** State name */
  name: string;
  /** State description */
  description: string;
  /** Number of times entered this state */
  usage: number;
  /** Total time in this state in microseconds */
  timeUs: number;
  /** Exit latency in microseconds */
  latencyUs: number;
}

/** Per-CPU idle statistics */
export interface CpuIdleTelemetry {
  /** CPU core index */
  cpu: number;
  /** Idle states */
  states: CpuIdleStateTelemetry[];
}

/** System-wide CPU times from /proc/stat */
export interface CpuTimeTelemetry {
  /** CPU identifier (cpu, cpu0, cpu1, etc.) */
  cpu: string;
  /** Time spent in user mode (ms) */
  user: number;
  /** Time spent in user mode with low priority (nice) (ms) */
  nice: number;
  /** Time spent in system mode (ms) */
  system: number;
  /** Time spent idle (ms) */
  idle: number;
  /** Time waiting for I/O (ms) */
  iowait: number;
  /** Time servicing interrupts (ms) */
  irq: number;
  /** Time servicing softirqs (ms) */
  softirq: number;
  /** Time stolen by hypervisor (ms) */
  steal: number;
}

/** System load averages */
export interface LoadAverage {
  /** 1-minute load average */
  load1: number;
  /** 5-minute load average */
  load5: number;
  /** 15-minute load average */
  load15: number;
  /** Currently running processes */
  runningProcesses: number;
  /** Total processes */
  totalProcesses: number;
}

/** Combined CPU telemetry payload */
export interface CpuTelemetry {
  /** Per-CPU frequency info */
  frequencies: CpuFrequencyTelemetry[];
  /** Per-CPU frequency statistics (medium frequency) */
  frequencyStats?: CpuFrequencyStats[];
  /** Per-CPU idle statistics (medium frequency) */
  idleStats?: CpuIdleTelemetry[];
  /** System-wide CPU times */
  cpuTimes: CpuTimeTelemetry[];
  /** Load averages */
  loadAverage: LoadAverage;
  /** System uptime in seconds */
  uptime: number;
  /** Total idle time in seconds */
  idleTime: number;
  /** Online CPU list */
  onlineCpus: number[];
  /** Offline CPU list */
  offlineCpus: number[];
}

