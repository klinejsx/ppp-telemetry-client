/**
 * System telemetry collector (display, LEDs, rfkill)
 */

import type {
  SystemTelemetry,
  DisplayTelemetry,
  LedTelemetry,
  RfKillTelemetry,
} from "../types";
import { readSysfs, readSysfsInt, readSysfsBool, listSysfsDir } from "../utils/sysfs";
import { PATHS } from "./paths";

async function collectDisplay(): Promise<DisplayTelemetry> {
  const [brightness, maxBrightness, power] = await Promise.all([
    readSysfsInt(PATHS.system.backlight.brightness),
    readSysfsInt(PATHS.system.backlight.maxBrightness),
    readSysfsInt(PATHS.system.backlight.power),
  ]);

  const br = brightness ?? 0;
  const maxBr = maxBrightness ?? 1;

  return {
    brightness: br,
    maxBrightness: maxBr,
    brightnessPercent: maxBr > 0 ? (br / maxBr) * 100 : 0,
    power: power === 0, // 0 = on, 4 = off for backlight power
  };
}

async function collectLed(name: string): Promise<LedTelemetry> {
  const base = `${PATHS.system.leds}/${name}`;
  const [brightness, maxBrightness, trigger] = await Promise.all([
    readSysfsInt(`${base}/brightness`),
    readSysfsInt(`${base}/max_brightness`),
    readSysfs(`${base}/trigger`),
  ]);

  // Parse trigger - format: "none [heartbeat] timer ..."
  let activeTrigger = "none";
  if (trigger) {
    const match = trigger.match(/\[(\w+)\]/);
    if (match) activeTrigger = match[1];
  }

  return {
    name,
    brightness: brightness ?? 0,
    maxBrightness: maxBrightness ?? 1,
    trigger: activeTrigger,
  };
}

async function collectLeds(): Promise<LedTelemetry[]> {
  const entries = await listSysfsDir(PATHS.system.leds);
  const ledPromises = entries
    .filter((e) => !e.startsWith("."))
    .map(collectLed);
  return Promise.all(ledPromises);
}

async function collectRfKillDevice(name: string): Promise<RfKillTelemetry | null> {
  const base = `${PATHS.system.rfkill}/${name}`;
  const [type, soft, hard] = await Promise.all([
    readSysfs(`${base}/type`),
    readSysfsBool(`${base}/soft`),
    readSysfsBool(`${base}/hard`),
  ]);

  if (!type) return null;

  let deviceType: RfKillTelemetry["type"] = "wwan";
  if (type === "bluetooth") deviceType = "bluetooth";
  else if (type === "wlan") deviceType = "wifi";

  return {
    type: deviceType,
    name,
    softBlocked: soft ?? false,
    hardBlocked: hard ?? false,
  };
}

async function collectRfKill(): Promise<RfKillTelemetry[]> {
  const entries = await listSysfsDir(PATHS.system.rfkill);
  const devicePromises = entries
    .filter((e) => e.startsWith("rfkill"))
    .map(collectRfKillDevice);
  const devices = await Promise.all(devicePromises);
  return devices.filter((d): d is RfKillTelemetry => d !== null);
}

export async function collectSystem(): Promise<SystemTelemetry> {
  const [display, leds, rfkill, wakeupCount] = await Promise.all([
    collectDisplay(),
    collectLeds(),
    collectRfKill(),
    readSysfsInt(PATHS.system.wakeupCount),
  ]);

  return {
    display,
    leds,
    rfkill,
    wakeupCount: wakeupCount ?? 0,
  };
}

