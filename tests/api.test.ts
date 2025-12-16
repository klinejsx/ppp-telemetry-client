/**
 * Tests for API client
 * Run with: bun test
 */

import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import type { TelemetryPayload } from "../src/types";

// Create a mock payload for testing
function createMockPayload(frequency: "high" | "medium" | "low"): TelemetryPayload {
  return {
    deviceId: "test-device",
    timestamp: new Date().toISOString(),
    timestampMs: Date.now(),
    frequency,
    data: {} as TelemetryPayload["data"],
  };
}

describe("API Client", () => {
  let originalFetch: typeof global.fetch;
  let mockFetch: ReturnType<typeof mock>;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: true, data: { id: "test-id", received: true, timestamp: new Date().toISOString() } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    global.fetch = mockFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should send telemetry payload", async () => {
    // Re-import to get fresh module with mocked fetch
    const { sendTelemetry } = await import("../src/api/client");

    const payload = createMockPayload("high");
    const result = await sendTelemetry(payload);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should include correct headers", async () => {
    const { sendTelemetry } = await import("../src/api/client");

    const payload = createMockPayload("medium");
    await sendTelemetry(payload);

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;

    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-Device-ID"]).toBeDefined();
    expect(headers["X-Telemetry-Frequency"]).toBe("medium");
  });

  it("should retry on failure", async () => {
    let callCount = 0;
    mockFetch = mock(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );
    });
    global.fetch = mockFetch;

    const { sendTelemetry } = await import("../src/api/client");

    const payload = createMockPayload("low");
    const result = await sendTelemetry(payload);

    expect(result).toBe(true);
    expect(callCount).toBe(3);
  });

  it("should not retry on 4xx errors", async () => {
    let callCount = 0;
    mockFetch = mock(() => {
      callCount++;
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Bad request" }), { status: 400 })
      );
    });
    global.fetch = mockFetch;

    const { sendTelemetry } = await import("../src/api/client");

    const payload = createMockPayload("high");
    const result = await sendTelemetry(payload);

    expect(result).toBe(false);
    expect(callCount).toBe(1); // No retries on 4xx
  });
});

describe("Payload Structure", () => {
  it("should create valid high-frequency payload", () => {
    const payload = createMockPayload("high");

    expect(payload.deviceId).toBe("test-device");
    expect(payload.frequency).toBe("high");
    expect(payload.timestamp).toBeDefined();
    expect(payload.timestampMs).toBeGreaterThan(0);
    expect(new Date(payload.timestamp).getTime()).toBeCloseTo(payload.timestampMs, -3);
  });

  it("should serialize to valid JSON", () => {
    const payload = createMockPayload("medium");
    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);

    expect(parsed.deviceId).toBe(payload.deviceId);
    expect(parsed.frequency).toBe(payload.frequency);
    expect(parsed.timestamp).toBe(payload.timestamp);
  });
});

