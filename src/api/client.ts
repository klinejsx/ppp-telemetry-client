/**
 * API client for sending telemetry to server
 */

import type { TelemetryPayload, TelemetryAck, ApiResponse } from "../types";
import { config } from "../config";
import { logger } from "../utils/logger";

/** Offline buffer for storing telemetry when server is unreachable */
const offlineBuffer: TelemetryPayload[] = [];

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send telemetry to server with retry logic
 */
export async function sendTelemetry(payload: TelemetryPayload): Promise<boolean> {
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would send ${payload.frequency} telemetry`);
    logger.debug("Payload:", JSON.stringify(payload, null, 2));
    return true;
  }

  // Try to send with retries
  for (let attempt = 1; attempt <= config.api.retryCount; attempt++) {
    try {
      const response = await fetch(config.serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
          "X-Device-ID": config.deviceId,
          "X-Telemetry-Frequency": payload.frequency,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.api.timeoutMs),
      });

      if (response.ok) {
        const result = (await response.json()) as ApiResponse<TelemetryAck>;
        logger.debug(`Telemetry sent successfully: ${result.data?.id}`);
        
        // If we had buffered data, try to flush it
        if (offlineBuffer.length > 0) {
          await flushOfflineBuffer();
        }
        
        return true;
      }

      logger.warn(`Server returned ${response.status}: ${response.statusText}`);
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Attempt ${attempt}/${config.api.retryCount} failed: ${errorMessage}`);
    }

    // Wait before retry (except on last attempt)
    if (attempt < config.api.retryCount) {
      await sleep(config.api.retryDelayMs * attempt); // Exponential backoff
    }
  }

  // All retries failed - buffer if enabled
  if (config.offlineBuffer.enabled) {
    bufferTelemetry(payload);
  }

  return false;
}

/**
 * Buffer telemetry for later sending
 */
function bufferTelemetry(payload: TelemetryPayload): void {
  if (offlineBuffer.length >= config.offlineBuffer.maxSize) {
    // Remove oldest entry
    offlineBuffer.shift();
    logger.warn("Offline buffer full, dropping oldest entry");
  }
  
  offlineBuffer.push(payload);
  logger.info(`Buffered telemetry (${offlineBuffer.length} entries)`);
}

/**
 * Attempt to flush offline buffer
 */
async function flushOfflineBuffer(): Promise<void> {
  logger.info(`Flushing offline buffer (${offlineBuffer.length} entries)`);
  
  while (offlineBuffer.length > 0) {
    const payload = offlineBuffer[0];
    
    try {
      const response = await fetch(`${config.serverUrl}/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
          "X-Device-ID": config.deviceId,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(config.api.timeoutMs),
      });

      if (response.ok) {
        offlineBuffer.shift(); // Remove successfully sent entry
        logger.debug(`Flushed buffered entry, ${offlineBuffer.length} remaining`);
      } else {
        // Stop trying to flush on error
        logger.warn("Failed to flush buffer, will retry later");
        break;
      }
    } catch {
      logger.warn("Error flushing buffer, will retry later");
      break;
    }
  }
}

/**
 * Send a batch of telemetry payloads
 */
export async function sendTelemetryBatch(payloads: TelemetryPayload[]): Promise<boolean> {
  if (config.dryRun) {
    logger.info(`[DRY RUN] Would send batch of ${payloads.length} telemetry payloads`);
    return true;
  }

  try {
    const response = await fetch(`${config.serverUrl}/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
        "X-Device-ID": config.deviceId,
      },
      body: JSON.stringify({ payloads }),
      signal: AbortSignal.timeout(config.api.timeoutMs * 2), // Longer timeout for batch
    });

    if (response.ok) {
      logger.debug(`Batch of ${payloads.length} telemetry payloads sent successfully`);
      return true;
    }

    logger.warn(`Batch send failed: ${response.status}`);
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Batch send error: ${errorMessage}`);
    return false;
  }
}

/**
 * Check if server is reachable
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const healthUrl = config.serverUrl.replace(/\/telemetry$/, "/health");
    const response = await fetch(healthUrl, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get current offline buffer size
 */
export function getOfflineBufferSize(): number {
  return offlineBuffer.length;
}

