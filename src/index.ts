/**
 * Pinephone Pro Telemetry Daemon
 * Main entry point - orchestrates collection and transmission
 */

import { config } from "./config";
import { logger } from "./utils/logger";
import {
  collectHighFrequency,
  collectMediumFrequency,
  collectLowFrequency,
} from "./collectors";
import { sendTelemetry, checkServerHealth, getOfflineBufferSize } from "./api";
import type { TelemetryPayload, TelemetryFrequency } from "./types";

/** Interval handles for cleanup */
let highFreqInterval: ReturnType<typeof setInterval> | null = null;
let mediumFreqInterval: ReturnType<typeof setInterval> | null = null;
let lowFreqInterval: ReturnType<typeof setInterval> | null = null;

/** Running state */
let isRunning = false;

/**
 * Create a telemetry payload wrapper
 */
function createPayload<T>(frequency: TelemetryFrequency, data: T): TelemetryPayload {
  const now = new Date();
  return {
    deviceId: config.deviceId,
    timestamp: now.toISOString(),
    timestampMs: now.getTime(),
    frequency,
    data: data as TelemetryPayload["data"],
  };
}

/**
 * High-frequency collection task
 */
async function highFrequencyTask(): Promise<void> {
  try {
    logger.debug("Collecting high-frequency telemetry...");
    const startTime = performance.now();
    
    const data = await collectHighFrequency();
    const payload = createPayload("high", data);
    
    const collectTime = performance.now() - startTime;
    logger.debug(`High-frequency collection took ${collectTime.toFixed(1)}ms`);
    
    await sendTelemetry(payload);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`High-frequency task error: ${errorMessage}`);
  }
}

/**
 * Medium-frequency collection task
 */
async function mediumFrequencyTask(): Promise<void> {
  try {
    logger.debug("Collecting medium-frequency telemetry...");
    const startTime = performance.now();
    
    const data = await collectMediumFrequency();
    const payload = createPayload("medium", data);
    
    const collectTime = performance.now() - startTime;
    logger.debug(`Medium-frequency collection took ${collectTime.toFixed(1)}ms`);
    
    await sendTelemetry(payload);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Medium-frequency task error: ${errorMessage}`);
  }
}

/**
 * Low-frequency collection task
 */
async function lowFrequencyTask(): Promise<void> {
  try {
    logger.debug("Collecting low-frequency telemetry...");
    const startTime = performance.now();
    
    const data = await collectLowFrequency();
    const payload = createPayload("low", data);
    
    const collectTime = performance.now() - startTime;
    logger.debug(`Low-frequency collection took ${collectTime.toFixed(1)}ms`);
    
    await sendTelemetry(payload);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Low-frequency task error: ${errorMessage}`);
  }
}

/**
 * Start the telemetry daemon
 */
export async function start(): Promise<void> {
  if (isRunning) {
    logger.warn("Telemetry daemon is already running");
    return;
  }

  logger.info("Starting Pinephone Pro Telemetry Daemon...");
  logger.info(`Device ID: ${config.deviceId}`);
  logger.info(`Server URL: ${config.serverUrl}`);
  logger.info(`High-frequency interval: ${config.intervals.highFrequency}ms`);
  logger.info(`Medium-frequency interval: ${config.intervals.mediumFrequency}ms`);
  logger.info(`Low-frequency interval: ${config.intervals.lowFrequency}ms`);
  
  if (config.dryRun) {
    logger.warn("DRY RUN MODE - telemetry will not be sent to server");
  }

  // Check server health
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    logger.warn("Server health check failed - will buffer telemetry until server is available");
  } else {
    logger.info("Server health check passed");
  }

  isRunning = true;

  // Run initial collection immediately
  logger.info("Running initial collection...");
  await Promise.all([
    highFrequencyTask(),
    mediumFrequencyTask(),
    lowFrequencyTask(),
  ]);

  // Set up intervals
  highFreqInterval = setInterval(highFrequencyTask, config.intervals.highFrequency);
  mediumFreqInterval = setInterval(mediumFrequencyTask, config.intervals.mediumFrequency);
  lowFreqInterval = setInterval(lowFrequencyTask, config.intervals.lowFrequency);

  logger.info("Telemetry daemon started successfully");

  // Log buffer status periodically
  setInterval(() => {
    const bufferSize = getOfflineBufferSize();
    if (bufferSize > 0) {
      logger.info(`Offline buffer: ${bufferSize} entries`);
    }
  }, 60000);
}

/**
 * Stop the telemetry daemon
 */
export function stop(): void {
  if (!isRunning) {
    logger.warn("Telemetry daemon is not running");
    return;
  }

  logger.info("Stopping Pinephone Pro Telemetry Daemon...");

  if (highFreqInterval) {
    clearInterval(highFreqInterval);
    highFreqInterval = null;
  }
  if (mediumFreqInterval) {
    clearInterval(mediumFreqInterval);
    mediumFreqInterval = null;
  }
  if (lowFreqInterval) {
    clearInterval(lowFreqInterval);
    lowFreqInterval = null;
  }

  isRunning = false;
  logger.info("Telemetry daemon stopped");
}

/**
 * Check if daemon is running
 */
export function isActive(): boolean {
  return isRunning;
}

// Handle process signals for graceful shutdown
process.on("SIGINT", () => {
  logger.info("Received SIGINT signal");
  stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM signal");
  stop();
  process.exit(0);
});

// Auto-start if run directly
if (import.meta.main) {
  start().catch((error) => {
    logger.error("Failed to start telemetry daemon:", error);
    process.exit(1);
  });
}

