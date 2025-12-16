/**
 * Tests for utility functions
 * Run with: bun test
 */

import { describe, it, expect } from "bun:test";
import {
  parseCpuStatLine,
  parseMeminfo,
  parseNetDev,
  parseDiskstats,
  uvToV,
  uaToA,
  mCToC,
  khzToMhz,
  hzToMhz,
} from "../src/utils/sysfs";

describe("Unit Conversions", () => {
  it("should convert microvolts to volts", () => {
    expect(uvToV(4200000)).toBe(4.2);
    expect(uvToV(3700000)).toBe(3.7);
    expect(uvToV(0)).toBe(0);
  });

  it("should convert microamps to amps", () => {
    expect(uaToA(1500000)).toBe(1.5);
    expect(uaToA(500000)).toBe(0.5);
    expect(uaToA(0)).toBe(0);
  });

  it("should convert millicelsius to celsius", () => {
    expect(mCToC(50000)).toBe(50);
    expect(mCToC(25500)).toBe(25.5);
    expect(mCToC(0)).toBe(0);
  });

  it("should convert kHz to MHz", () => {
    expect(khzToMhz(1008000)).toBe(1008);
    expect(khzToMhz(600000)).toBe(600);
    expect(khzToMhz(0)).toBe(0);
  });

  it("should convert Hz to MHz", () => {
    expect(hzToMhz(200000000)).toBe(200);
    expect(hzToMhz(600000000)).toBe(600);
    expect(hzToMhz(0)).toBe(0);
  });
});

describe("CPU Stat Parser", () => {
  it("should parse cpu line from /proc/stat", () => {
    const line = "cpu  34040 2413 19487 797956 11169 5830 2456 0 0 0";
    const result = parseCpuStatLine(line);

    expect(result).not.toBeNull();
    expect(result!.cpu).toBe("cpu");
    expect(result!.user).toBe(34040);
    expect(result!.nice).toBe(2413);
    expect(result!.system).toBe(19487);
    expect(result!.idle).toBe(797956);
    expect(result!.iowait).toBe(11169);
    expect(result!.irq).toBe(5830);
    expect(result!.softirq).toBe(2456);
    expect(result!.steal).toBe(0);
  });

  it("should parse per-cpu lines", () => {
    const line = "cpu0 4340 6 3349 132857 1706 1955 999 0 0 0";
    const result = parseCpuStatLine(line);

    expect(result).not.toBeNull();
    expect(result!.cpu).toBe("cpu0");
    expect(result!.user).toBe(4340);
  });

  it("should return null for non-cpu lines", () => {
    const line = "intr 2960711 0 42236 839779";
    const result = parseCpuStatLine(line);

    expect(result).toBeNull();
  });
});

describe("Meminfo Parser", () => {
  it("should parse /proc/meminfo format", () => {
    const content = `MemTotal:        3954660 kB
MemFree:         2280788 kB
MemAvailable:    2924492 kB
Buffers:           28280 kB
Cached:           743644 kB
SwapTotal:       1977340 kB
SwapFree:        1977340 kB`;

    const result = parseMeminfo(content);

    // Values should be converted to bytes (kB * 1024)
    expect(result.get("MemTotal")).toBe(3954660 * 1024);
    expect(result.get("MemFree")).toBe(2280788 * 1024);
    expect(result.get("MemAvailable")).toBe(2924492 * 1024);
    expect(result.get("Buffers")).toBe(28280 * 1024);
    expect(result.get("Cached")).toBe(743644 * 1024);
    expect(result.get("SwapTotal")).toBe(1977340 * 1024);
    expect(result.get("SwapFree")).toBe(1977340 * 1024);
  });
});

describe("NetDev Parser", () => {
  it("should parse /proc/net/dev format", () => {
    const content = `Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo: 6012758    7208    0    0    0     0          0         0  6012758    7208    0    0    0     0       0          0
 wlan0: 2490650   22982    0 2646    0     0          0         5  5296949   14743    0    0    0     0       0          0`;

    const result = parseNetDev(content);

    expect(result.has("lo")).toBe(true);
    expect(result.has("wlan0")).toBe(true);

    const lo = result.get("lo")!;
    expect(lo.rxBytes).toBe(6012758);
    expect(lo.txBytes).toBe(6012758);
    expect(lo.rxPackets).toBe(7208);
    expect(lo.txPackets).toBe(7208);

    const wlan0 = result.get("wlan0")!;
    expect(wlan0.rxBytes).toBe(2490650);
    expect(wlan0.txBytes).toBe(5296949);
    expect(wlan0.rxDropped).toBe(2646);
  });
});

describe("Diskstats Parser", () => {
  it("should parse /proc/diskstats format", () => {
    const content = ` 179       0 mmcblk1 13565 6437 1113416 204410 6199 2886 349931 328955 0 87624 533365 0 0 0 0 0 0
 179       2 mmcblk1p2 13222 2627 1100624 200058 6198 2886 349930 328952 0 96886 529011 0 0 0 0 0 0
 179     256 mmcblk2 650 0 23584 399 0 0 0 0 0 302 399 0 0 0 0 0 0`;

    const result = parseDiskstats(content);

    expect(result.has("mmcblk1")).toBe(true);
    expect(result.has("mmcblk2")).toBe(true);

    const mmcblk1 = result.get("mmcblk1")!;
    expect(mmcblk1.readsCompleted).toBe(13565);
    expect(mmcblk1.sectorsRead).toBe(1113416);
    expect(mmcblk1.writesCompleted).toBe(6199);
    expect(mmcblk1.sectorsWritten).toBe(349931);
    expect(mmcblk1.ioTimeMs).toBe(87624);

    const mmcblk2 = result.get("mmcblk2")!;
    expect(mmcblk2.readsCompleted).toBe(650);
    expect(mmcblk2.sectorsRead).toBe(23584);
  });
});

