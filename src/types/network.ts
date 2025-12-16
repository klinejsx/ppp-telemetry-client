/**
 * Network telemetry types
 */

/** Network interface operational state */
export type OperationalState = "up" | "down" | "unknown" | "lowerlayerdown" | "notpresent" | "dormant";

/** Network interface statistics */
export interface NetworkInterfaceStats {
  /** Received bytes */
  rxBytes: number;
  /** Transmitted bytes */
  txBytes: number;
  /** Received packets */
  rxPackets: number;
  /** Transmitted packets */
  txPackets: number;
  /** Receive errors */
  rxErrors: number;
  /** Transmit errors */
  txErrors: number;
  /** Receive drops */
  rxDropped: number;
  /** Transmit drops */
  txDropped: number;
  /** Receive FIFO errors */
  rxFifo: number;
  /** Transmit FIFO errors */
  txFifo: number;
  /** Frame alignment errors */
  rxFrame: number;
  /** Carrier errors */
  txCarrier: number;
  /** Collisions */
  collisions: number;
}

/** Network interface telemetry */
export interface NetworkInterfaceTelemetry {
  /** Interface name */
  name: string;
  /** MAC address */
  address: string;
  /** Link up/down */
  carrier: boolean;
  /** Number of carrier state changes */
  carrierChanges: number;
  /** Operational state */
  operstate: OperationalState | string;
  /** MTU size */
  mtu: number;
  /** Interface statistics */
  stats: NetworkInterfaceStats;
  /** Interface type (for identification) */
  type: "wifi" | "cellular" | "usb" | "loopback" | "other";
}

/** WiFi-specific telemetry */
export interface WifiTelemetry {
  /** Signal strength (dBm) */
  signalStrength?: number;
  /** Link quality percentage */
  linkQuality?: number;
  /** Noise level (dBm) */
  noiseLevel?: number;
  /** Connected SSID */
  ssid?: string;
  /** Frequency in MHz */
  frequency?: number;
  /** Bitrate in Mbps */
  bitrate?: number;
}

/** Combined network telemetry payload */
export interface NetworkTelemetry {
  /** All network interfaces */
  interfaces: NetworkInterfaceTelemetry[];
  /** WiFi-specific info (if wlan0 is up) */
  wifi?: WifiTelemetry;
  /** Total received bytes across all interfaces */
  totalRxBytes: number;
  /** Total transmitted bytes across all interfaces */
  totalTxBytes: number;
}

