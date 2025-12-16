/**
 * Sensors telemetry collector (IIO devices)
 */

import type {
  SensorsTelemetry,
  AmbientLightTelemetry,
  ProximityTelemetry,
  AccelerometerTelemetry,
  GyroscopeTelemetry,
  MagnetometerTelemetry,
  AdcChannelTelemetry,
  Vector3D,
} from "../types";
import { readSysfsInt, readSysfsNumber } from "../utils/sysfs";
import { PATHS } from "./paths";

async function collectAmbientLight(): Promise<AmbientLightTelemetry> {
  const [raw, scale] = await Promise.all([
    readSysfsInt(PATHS.sensors.als.illuminanceRaw),
    readSysfsNumber(PATHS.sensors.als.illuminanceScale),
  ]);

  const illuminanceRaw = raw ?? 0;
  const illuminanceScale = scale ?? 1;

  return {
    illuminanceRaw,
    illuminanceScale,
    illuminanceLux: illuminanceRaw * illuminanceScale,
  };
}

async function collectProximity(): Promise<ProximityTelemetry> {
  const [raw, scale, nearLevel] = await Promise.all([
    readSysfsInt(PATHS.sensors.als.proximityRaw),
    readSysfsNumber(PATHS.sensors.als.proximityScale),
    readSysfsInt(PATHS.sensors.als.proximityNearLevel),
  ]);

  const proximityRaw = raw ?? 0;
  const proximityScale = scale ?? 1;
  const near = nearLevel ?? 100;

  return {
    proximityRaw,
    proximityScale,
    nearLevel: near,
    isNear: proximityRaw > near,
  };
}

async function collectAccelerometer(): Promise<AccelerometerTelemetry> {
  const [xRaw, yRaw, zRaw, scale] = await Promise.all([
    readSysfsInt(PATHS.sensors.imu.accelXRaw),
    readSysfsInt(PATHS.sensors.imu.accelYRaw),
    readSysfsInt(PATHS.sensors.imu.accelZRaw),
    readSysfsNumber(PATHS.sensors.imu.accelScale),
  ]);

  const raw: Vector3D = { x: xRaw ?? 0, y: yRaw ?? 0, z: zRaw ?? 0 };
  const s = scale ?? 1;

  const acceleration: Vector3D = {
    x: raw.x * s,
    y: raw.y * s,
    z: raw.z * s,
  };

  const magnitude = Math.sqrt(
    acceleration.x ** 2 + acceleration.y ** 2 + acceleration.z ** 2
  );

  return {
    raw,
    scale: s,
    acceleration,
    magnitude,
  };
}

async function collectGyroscope(): Promise<GyroscopeTelemetry> {
  const [xRaw, yRaw, zRaw, scale] = await Promise.all([
    readSysfsInt(PATHS.sensors.imu.gyroXRaw),
    readSysfsInt(PATHS.sensors.imu.gyroYRaw),
    readSysfsInt(PATHS.sensors.imu.gyroZRaw),
    readSysfsNumber(PATHS.sensors.imu.gyroScale),
  ]);

  const raw: Vector3D = { x: xRaw ?? 0, y: yRaw ?? 0, z: zRaw ?? 0 };
  const s = scale ?? 1;

  const angularVelocity: Vector3D = {
    x: raw.x * s,
    y: raw.y * s,
    z: raw.z * s,
  };

  const magnitude = Math.sqrt(
    angularVelocity.x ** 2 + angularVelocity.y ** 2 + angularVelocity.z ** 2
  );

  return {
    raw,
    scale: s,
    angularVelocity,
    magnitude,
  };
}

async function collectMagnetometer(): Promise<MagnetometerTelemetry> {
  const [xRaw, yRaw, zRaw, scale] = await Promise.all([
    readSysfsInt(PATHS.sensors.mag.xRaw),
    readSysfsInt(PATHS.sensors.mag.yRaw),
    readSysfsInt(PATHS.sensors.mag.zRaw),
    readSysfsNumber(PATHS.sensors.mag.scale),
  ]);

  const raw: Vector3D = { x: xRaw ?? 0, y: yRaw ?? 0, z: zRaw ?? 0 };
  const s = scale ?? 1;

  const magneticField: Vector3D = {
    x: raw.x * s,
    y: raw.y * s,
    z: raw.z * s,
  };

  // Calculate heading (bearing) from magnetometer
  // Simplified: assumes device is level
  let heading = Math.atan2(magneticField.y, magneticField.x) * (180 / Math.PI);
  if (heading < 0) heading += 360;

  return {
    raw,
    scale: s,
    magneticField,
    heading,
  };
}

async function collectAdcChannels(): Promise<AdcChannelTelemetry[]> {
  const scale = await readSysfsNumber(PATHS.sensors.adc.scale);
  const s = scale ?? 1;

  const channels: AdcChannelTelemetry[] = [];
  for (let ch = 0; ch <= 5; ch++) {
    const raw = await readSysfsInt(PATHS.sensors.adc.voltage(ch));
    if (raw !== null) {
      channels.push({
        channel: ch,
        raw,
        scale: s,
        voltage: raw * s,
      });
    }
  }

  return channels;
}

export async function collectSensors(): Promise<SensorsTelemetry> {
  const [ambientLight, proximity, accelerometer, gyroscope, magnetometer, adcChannels] =
    await Promise.all([
      collectAmbientLight(),
      collectProximity(),
      collectAccelerometer(),
      collectGyroscope(),
      collectMagnetometer(),
      collectAdcChannels(),
    ]);

  return {
    ambientLight,
    proximity,
    accelerometer,
    gyroscope,
    magnetometer,
    adcChannels,
  };
}

