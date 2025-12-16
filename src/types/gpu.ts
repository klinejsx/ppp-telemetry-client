/**
 * GPU telemetry types (Mali T860 - Panfrost)
 */

/** GPU DVFS governor types */
export type GpuGovernor = "simple_ondemand" | "performance" | "powersave" | "userspace";

/** GPU frequency telemetry */
export interface GpuFrequencyTelemetry {
  /** Current frequency in MHz */
  currentFreq: number;
  /** Target frequency in MHz */
  targetFreq: number;
  /** Minimum frequency in MHz */
  minFreq: number;
  /** Maximum frequency in MHz */
  maxFreq: number;
  /** Active DVFS governor */
  governor: GpuGovernor | string;
  /** Available frequencies in MHz */
  availableFrequencies: number[];
  /** Polling interval in milliseconds */
  pollingIntervalMs: number;
}

/** GPU frequency transition statistics */
export interface GpuTransitionStats {
  /** From frequency in MHz */
  fromFreq: number;
  /** To frequency in MHz */
  toFreq: number;
  /** Number of transitions */
  count: number;
}

/** Combined GPU telemetry payload */
export interface GpuTelemetry {
  /** Frequency information */
  frequency: GpuFrequencyTelemetry;
  /** Transition statistics (medium frequency) */
  transitionStats?: GpuTransitionStats[];
  /** Total frequency transitions */
  totalTransitions?: number;
}

