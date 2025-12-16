/**
 * Sensor telemetry types (IIO devices)
 */

/** Ambient light sensor telemetry */
export interface AmbientLightTelemetry {
  /** Raw illuminance value */
  illuminanceRaw: number;
  /** Illuminance scale factor */
  illuminanceScale: number;
  /** Calculated illuminance (lux) */
  illuminanceLux: number;
}

/** Proximity sensor telemetry */
export interface ProximityTelemetry {
  /** Raw proximity value */
  proximityRaw: number;
  /** Proximity scale factor */
  proximityScale: number;
  /** Near level threshold */
  nearLevel: number;
  /** Object is near */
  isNear: boolean;
}

/** 3-axis vector (for accelerometer, gyro, magnetometer) */
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/** Accelerometer telemetry */
export interface AccelerometerTelemetry {
  /** Raw accelerometer values */
  raw: Vector3D;
  /** Scale factor */
  scale: number;
  /** Calculated acceleration in m/s² */
  acceleration: Vector3D;
  /** Magnitude of acceleration (useful for motion detection) */
  magnitude: number;
}

/** Gyroscope telemetry */
export interface GyroscopeTelemetry {
  /** Raw gyroscope values */
  raw: Vector3D;
  /** Scale factor */
  scale: number;
  /** Calculated angular velocity in rad/s */
  angularVelocity: Vector3D;
  /** Magnitude of angular velocity */
  magnitude: number;
}

/** Magnetometer telemetry */
export interface MagnetometerTelemetry {
  /** Raw magnetometer values */
  raw: Vector3D;
  /** Scale factor */
  scale: number;
  /** Calculated magnetic field in µT (microtesla) */
  magneticField: Vector3D;
  /** Heading/bearing in degrees (0-360, 0=North) */
  heading: number;
}

/** ADC channel reading */
export interface AdcChannelTelemetry {
  /** Channel number */
  channel: number;
  /** Raw ADC value */
  raw: number;
  /** Voltage scale factor */
  scale: number;
  /** Calculated voltage */
  voltage: number;
}

/** Combined sensors telemetry payload */
export interface SensorsTelemetry {
  /** Ambient light sensor */
  ambientLight: AmbientLightTelemetry;
  /** Proximity sensor */
  proximity: ProximityTelemetry;
  /** Accelerometer */
  accelerometer: AccelerometerTelemetry;
  /** Gyroscope */
  gyroscope: GyroscopeTelemetry;
  /** Magnetometer */
  magnetometer: MagnetometerTelemetry;
  /** ADC channels */
  adcChannels: AdcChannelTelemetry[];
}

