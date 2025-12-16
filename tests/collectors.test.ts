/**
 * Tests for telemetry collectors
 * Run with: bun test
 */

import { describe, it, expect, beforeAll } from "bun:test";
import {
  collectHighFrequency,
  collectMediumFrequency,
  collectLowFrequency,
  collectFullSnapshot,
  collectPower,
  collectThermal,
  collectCpu,
  collectGpu,
  collectMemory,
  collectNetwork,
  collectStorage,
  collectSensors,
  collectProcesses,
  collectSystem,
} from "../src/collectors";
import { sysfsExists } from "../src/utils/sysfs";
import { PATHS } from "../src/collectors/paths";

// Check if we're running on actual Pinephone hardware
let isOnPinephone = false;

beforeAll(async () => {
  isOnPinephone = await sysfsExists(PATHS.battery.base);
  if (!isOnPinephone) {
    console.log("⚠️  Not running on Pinephone Pro - some tests will be skipped");
  }
});

describe("Battery Collector", () => {
  it("should return valid battery telemetry structure", async () => {
    const power = await collectPower();

    // Battery structure
    expect(power.battery).toBeDefined();
    expect(typeof power.battery.capacity).toBe("number");
    expect(power.battery.capacity).toBeGreaterThanOrEqual(0);
    expect(power.battery.capacity).toBeLessThanOrEqual(100);
    expect(typeof power.battery.status).toBe("string");
    expect(typeof power.battery.voltage).toBe("number");
    expect(typeof power.battery.current).toBe("number");
    expect(typeof power.battery.temperature).toBe("number");
    expect(typeof power.battery.present).toBe("boolean");

    // USB input structure
    expect(power.usbInput).toBeDefined();
    expect(typeof power.usbInput.present).toBe("boolean");

    // USB-C PD structure
    expect(power.usbCPd).toBeDefined();
    expect(typeof power.usbCPd.online).toBe("boolean");

    // Type-C port structure
    expect(power.typeCPort).toBeDefined();
    expect(typeof power.typeCPort.dataRole).toBe("string");
    expect(typeof power.typeCPort.powerRole).toBe("string");
  });

  it("should have reasonable battery values on Pinephone", async () => {
    if (!isOnPinephone) return;

    const power = await collectPower();
    
    // Voltage should be in reasonable range (3.0V - 4.5V)
    expect(power.battery.voltage).toBeGreaterThan(3.0);
    expect(power.battery.voltage).toBeLessThan(4.5);
    
    // Temperature should be reasonable (-20°C to 60°C)
    expect(power.battery.temperature).toBeGreaterThan(-20);
    expect(power.battery.temperature).toBeLessThan(60);
  });
});

describe("Thermal Collector", () => {
  it("should return valid thermal telemetry structure", async () => {
    const thermal = await collectThermal();

    expect(thermal.zones).toBeDefined();
    expect(Array.isArray(thermal.zones)).toBe(true);
    expect(thermal.coolingDevices).toBeDefined();
    expect(Array.isArray(thermal.coolingDevices)).toBe(true);
    expect(typeof thermal.batteryTemp).toBe("number");
    expect(typeof thermal.cpuTemp).toBe("number");
    expect(typeof thermal.gpuTemp).toBe("number");
  });

  it("should have 3 thermal zones on Pinephone", async () => {
    if (!isOnPinephone) return;

    const thermal = await collectThermal();
    expect(thermal.zones.length).toBe(3);
    
    // Zone types
    const types = thermal.zones.map((z) => z.type);
    expect(types).toContain("rk818-battery");
    expect(types).toContain("cpu-thermal");
    expect(types).toContain("gpu-thermal");
  });

  it("should have reasonable temperature values", async () => {
    if (!isOnPinephone) return;

    const thermal = await collectThermal();
    
    // CPU temp should be reasonable (0°C - 100°C)
    expect(thermal.cpuTemp).toBeGreaterThan(0);
    expect(thermal.cpuTemp).toBeLessThan(100);
    
    // GPU temp should be reasonable
    expect(thermal.gpuTemp).toBeGreaterThan(0);
    expect(thermal.gpuTemp).toBeLessThan(100);
  });
});

describe("CPU Collector", () => {
  it("should return valid CPU telemetry structure", async () => {
    const cpu = await collectCpu(false);

    expect(cpu.frequencies).toBeDefined();
    expect(Array.isArray(cpu.frequencies)).toBe(true);
    expect(cpu.cpuTimes).toBeDefined();
    expect(Array.isArray(cpu.cpuTimes)).toBe(true);
    expect(cpu.loadAverage).toBeDefined();
    expect(typeof cpu.loadAverage.load1).toBe("number");
    expect(typeof cpu.loadAverage.load5).toBe("number");
    expect(typeof cpu.loadAverage.load15).toBe("number");
    expect(typeof cpu.uptime).toBe("number");
    expect(Array.isArray(cpu.onlineCpus)).toBe(true);
  });

  it("should have 6 CPU cores on Pinephone", async () => {
    if (!isOnPinephone) return;

    const cpu = await collectCpu(false);
    expect(cpu.frequencies.length).toBe(6);
    expect(cpu.onlineCpus.length).toBeGreaterThanOrEqual(1);
  });

  it("should include stats when requested", async () => {
    if (!isOnPinephone) return;

    const cpu = await collectCpu(true);
    expect(cpu.frequencyStats).toBeDefined();
    expect(cpu.idleStats).toBeDefined();
  });

  it("should have valid load average values", async () => {
    const cpu = await collectCpu(false);
    
    expect(cpu.loadAverage.load1).toBeGreaterThanOrEqual(0);
    expect(cpu.loadAverage.load5).toBeGreaterThanOrEqual(0);
    expect(cpu.loadAverage.load15).toBeGreaterThanOrEqual(0);
    expect(cpu.uptime).toBeGreaterThan(0);
  });
});

describe("GPU Collector", () => {
  it("should return valid GPU telemetry structure", async () => {
    const gpu = await collectGpu();

    expect(gpu.frequency).toBeDefined();
    expect(typeof gpu.frequency.currentFreq).toBe("number");
    expect(typeof gpu.frequency.minFreq).toBe("number");
    expect(typeof gpu.frequency.maxFreq).toBe("number");
    expect(typeof gpu.frequency.governor).toBe("string");
    expect(Array.isArray(gpu.frequency.availableFrequencies)).toBe(true);
  });

  it("should have valid GPU frequencies on Pinephone", async () => {
    if (!isOnPinephone) return;

    const gpu = await collectGpu();
    
    // GPU freq should be in range (0 - 800 MHz for Mali T860)
    expect(gpu.frequency.currentFreq).toBeGreaterThanOrEqual(0);
    expect(gpu.frequency.currentFreq).toBeLessThanOrEqual(800);
    expect(gpu.frequency.availableFrequencies.length).toBeGreaterThan(0);
  });
});

describe("Memory Collector", () => {
  it("should return valid memory telemetry structure", async () => {
    const memory = await collectMemory();

    expect(typeof memory.total).toBe("number");
    expect(typeof memory.free).toBe("number");
    expect(typeof memory.available).toBe("number");
    expect(typeof memory.buffers).toBe("number");
    expect(typeof memory.cached).toBe("number");
    expect(typeof memory.swapTotal).toBe("number");
    expect(typeof memory.swapFree).toBe("number");
    expect(typeof memory.usedPercent).toBe("number");
  });

  it("should have reasonable memory values", async () => {
    const memory = await collectMemory();

    // Total should be positive
    expect(memory.total).toBeGreaterThan(0);
    
    // Available should not exceed total
    expect(memory.available).toBeLessThanOrEqual(memory.total);
    
    // Percentage should be 0-100
    expect(memory.usedPercent).toBeGreaterThanOrEqual(0);
    expect(memory.usedPercent).toBeLessThanOrEqual(100);
  });

  it("should have ~4GB on Pinephone Pro", async () => {
    if (!isOnPinephone) return;

    const memory = await collectMemory();
    
    // Pinephone Pro has 4GB RAM (~4GB = ~4 * 1024^3 bytes)
    const fourGB = 4 * 1024 * 1024 * 1024;
    expect(memory.total).toBeGreaterThan(fourGB * 0.9); // At least 90% of 4GB
    expect(memory.total).toBeLessThan(fourGB * 1.1); // At most 110% of 4GB
  });
});

describe("Network Collector", () => {
  it("should return valid network telemetry structure", async () => {
    const network = await collectNetwork();

    expect(network.interfaces).toBeDefined();
    expect(Array.isArray(network.interfaces)).toBe(true);
    expect(typeof network.totalRxBytes).toBe("number");
    expect(typeof network.totalTxBytes).toBe("number");
  });

  it("should have expected interfaces on Pinephone", async () => {
    if (!isOnPinephone) return;

    const network = await collectNetwork();
    const names = network.interfaces.map((i) => i.name);
    
    // Should have loopback
    expect(names).toContain("lo");
    
    // Should have WiFi
    expect(names).toContain("wlan0");
  });

  it("should have valid interface statistics", async () => {
    const network = await collectNetwork();

    for (const iface of network.interfaces) {
      expect(typeof iface.name).toBe("string");
      expect(typeof iface.carrier).toBe("boolean");
      expect(typeof iface.stats.rxBytes).toBe("number");
      expect(typeof iface.stats.txBytes).toBe("number");
      expect(iface.stats.rxBytes).toBeGreaterThanOrEqual(0);
      expect(iface.stats.txBytes).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Storage Collector", () => {
  it("should return valid storage telemetry structure", async () => {
    const storage = await collectStorage();

    expect(storage.devices).toBeDefined();
    expect(Array.isArray(storage.devices)).toBe(true);
    expect(typeof storage.totalBytesRead).toBe("number");
    expect(typeof storage.totalBytesWritten).toBe("number");
  });

  it("should have eMMC on Pinephone", async () => {
    if (!isOnPinephone) return;

    const storage = await collectStorage();
    const names = storage.devices.map((d) => d.name);
    
    expect(names).toContain("mmcblk2"); // eMMC
  });
});

describe("Sensors Collector", () => {
  it("should return valid sensors telemetry structure", async () => {
    const sensors = await collectSensors();

    expect(sensors.ambientLight).toBeDefined();
    expect(typeof sensors.ambientLight.illuminanceLux).toBe("number");
    
    expect(sensors.proximity).toBeDefined();
    expect(typeof sensors.proximity.isNear).toBe("boolean");
    
    expect(sensors.accelerometer).toBeDefined();
    expect(typeof sensors.accelerometer.magnitude).toBe("number");
    
    expect(sensors.gyroscope).toBeDefined();
    expect(sensors.magnetometer).toBeDefined();
    expect(sensors.adcChannels).toBeDefined();
  });

  it("should have reasonable accelerometer values", async () => {
    if (!isOnPinephone) return;

    const sensors = await collectSensors();
    
    // At rest, magnitude should be close to 9.8 m/s² (gravity)
    // Allow wide tolerance due to calibration
    expect(sensors.accelerometer.magnitude).toBeGreaterThan(0);
    expect(sensors.accelerometer.magnitude).toBeLessThan(20);
  });

  it("should have valid magnetometer heading", async () => {
    if (!isOnPinephone) return;

    const sensors = await collectSensors();
    
    // Heading should be 0-360 degrees
    expect(sensors.magnetometer.heading).toBeGreaterThanOrEqual(0);
    expect(sensors.magnetometer.heading).toBeLessThan(360);
  });
});

describe("Process Collector", () => {
  it("should return valid process telemetry structure", async () => {
    const processes = await collectProcesses();

    expect(processes.processes).toBeDefined();
    expect(Array.isArray(processes.processes)).toBe(true);
    expect(processes.summary).toBeDefined();
    expect(typeof processes.summary.total).toBe("number");
    expect(typeof processes.summary.running).toBe("number");
    expect(typeof processes.contextSwitches).toBe("number");
  });

  it("should have at least some processes", async () => {
    const processes = await collectProcesses();
    
    expect(processes.processes.length).toBeGreaterThan(0);
    expect(processes.summary.total).toBeGreaterThan(0);
  });

  it("should have valid process entries", async () => {
    const processes = await collectProcesses();

    for (const proc of processes.processes.slice(0, 10)) {
      expect(typeof proc.pid).toBe("number");
      expect(proc.pid).toBeGreaterThan(0);
      expect(typeof proc.name).toBe("string");
      expect(proc.name.length).toBeGreaterThan(0);
      expect(typeof proc.state).toBe("string");
      expect(typeof proc.totalCpuTimeMs).toBe("number");
      expect(proc.totalCpuTimeMs).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("System Collector", () => {
  it("should return valid system telemetry structure", async () => {
    const system = await collectSystem();

    expect(system.display).toBeDefined();
    expect(typeof system.display.brightness).toBe("number");
    expect(typeof system.display.maxBrightness).toBe("number");
    expect(typeof system.display.brightnessPercent).toBe("number");
    
    expect(system.leds).toBeDefined();
    expect(Array.isArray(system.leds)).toBe(true);
    
    expect(system.rfkill).toBeDefined();
    expect(Array.isArray(system.rfkill)).toBe(true);
  });

  it("should have LEDs on Pinephone", async () => {
    if (!isOnPinephone) return;

    const system = await collectSystem();
    
    // Should have RGB LED
    const ledNames = system.leds.map((l) => l.name);
    expect(ledNames.length).toBeGreaterThan(0);
  });
});

describe("Aggregate Collectors", () => {
  it("should collect high-frequency telemetry", async () => {
    const data = await collectHighFrequency();

    expect(data.power).toBeDefined();
    expect(data.thermal).toBeDefined();
    expect(data.cpu).toBeDefined();
    expect(data.memory).toBeDefined();
    expect(data.network).toBeDefined();
  });

  it("should collect medium-frequency telemetry", async () => {
    const data = await collectMediumFrequency();

    expect(data.cpuStats).toBeDefined();
    expect(data.gpu).toBeDefined();
    expect(data.storage).toBeDefined();
    expect(data.processes).toBeDefined();
  });

  it("should collect low-frequency telemetry", async () => {
    const data = await collectLowFrequency();

    expect(data.sensors).toBeDefined();
    expect(data.system).toBeDefined();
  });

  it("should collect full snapshot", async () => {
    const data = await collectFullSnapshot();

    expect(data.power).toBeDefined();
    expect(data.thermal).toBeDefined();
    expect(data.cpu).toBeDefined();
    expect(data.gpu).toBeDefined();
    expect(data.memory).toBeDefined();
    expect(data.network).toBeDefined();
    expect(data.storage).toBeDefined();
    expect(data.sensors).toBeDefined();
    expect(data.processes).toBeDefined();
    expect(data.system).toBeDefined();
  });

  it("should complete collection in reasonable time", async () => {
    const startTime = performance.now();
    await collectFullSnapshot();
    const elapsed = performance.now() - startTime;

    // Full collection should complete in under 5 seconds
    expect(elapsed).toBeLessThan(5000);
    console.log(`Full snapshot collection took ${elapsed.toFixed(1)}ms`);
  });
});

