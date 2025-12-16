/**
 * Configuration module - loads settings from environment variables
 */

import { hostname } from "os";

function envBool(key: string, defaultValue: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  return val.toLowerCase() === "true" || val === "1";
}

function envInt(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (val === undefined) return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function envString(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  // Server
  serverUrl: envString("TELEMETRY_SERVER_URL", "http://localhost:3000/api/telemetry"),
  apiKey: envString("TELEMETRY_API_KEY", ""),
  deviceId: envString("DEVICE_ID", hostname()),

  // Intervals (milliseconds)
  intervals: {
    highFrequency: envInt("HIGH_FREQ_INTERVAL_MS", 5000),
    mediumFrequency: envInt("MEDIUM_FREQ_INTERVAL_MS", 60000),
    lowFrequency: envInt("LOW_FREQ_INTERVAL_MS", 300000),
  },

  // Feature flags
  collectors: {
    battery: envBool("COLLECT_BATTERY", true),
    thermal: envBool("COLLECT_THERMAL", true),
    cpu: envBool("COLLECT_CPU", true),
    gpu: envBool("COLLECT_GPU", true),
    memory: envBool("COLLECT_MEMORY", true),
    network: envBool("COLLECT_NETWORK", true),
    storage: envBool("COLLECT_STORAGE", true),
    sensors: envBool("COLLECT_SENSORS", true),
    processes: envBool("COLLECT_PROCESSES", true),
  },

  maxProcesses: envInt("MAX_PROCESSES", 50),

  // Logging
  logLevel: envString("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error",
  logToFile: envBool("LOG_TO_FILE", false),
  logFilePath: envString("LOG_FILE_PATH", "/var/log/pinephone-telemetry.log"),
  dryRun: envBool("DRY_RUN", false),

  // API resilience
  api: {
    retryCount: envInt("API_RETRY_COUNT", 3),
    retryDelayMs: envInt("API_RETRY_DELAY_MS", 1000),
    timeoutMs: envInt("API_TIMEOUT_MS", 10000),
  },

  // Offline buffer
  offlineBuffer: {
    enabled: envBool("ENABLE_OFFLINE_BUFFER", true),
    maxSize: envInt("OFFLINE_BUFFER_MAX_SIZE", 1000),
  },
} as const;

export type Config = typeof config;

