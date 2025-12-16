/**
 * System-level telemetry types
 */

/** Display/backlight telemetry */
export interface DisplayTelemetry {
  /** Current brightness (0-max) */
  brightness: number;
  /** Maximum brightness value */
  maxBrightness: number;
  /** Brightness percentage */
  brightnessPercent: number;
  /** Backlight power state */
  power: boolean;
}

/** LED state */
export interface LedTelemetry {
  /** LED identifier */
  name: string;
  /** Current brightness (0-max) */
  brightness: number;
  /** Maximum brightness */
  maxBrightness: number;
  /** Active trigger */
  trigger: string;
}

/** RF kill state */
export interface RfKillTelemetry {
  /** Device type */
  type: "bluetooth" | "wifi" | "wwan";
  /** Device name */
  name: string;
  /** Software blocked */
  softBlocked: boolean;
  /** Hardware blocked */
  hardBlocked: boolean;
}

/** Wakeup source statistics */
export interface WakeupSourceTelemetry {
  /** Source name */
  name: string;
  /** Number of wakeup events */
  wakeupCount: number;
  /** Active state */
  active: boolean;
}

/** Combined system telemetry */
export interface SystemTelemetry {
  /** Display/backlight */
  display: DisplayTelemetry;
  /** LED states */
  leds: LedTelemetry[];
  /** RF kill states */
  rfkill: RfKillTelemetry[];
  /** System wakeup count */
  wakeupCount: number;
}

