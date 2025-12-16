# Pinephone Pro Telemetry Daemon

A comprehensive telemetry collection system for Pinephone Pro running postmarketOS with Phosh. Collects device metrics and sends them to a server for visualization and analysis.

## Features

- **Comprehensive telemetry collection**:
  - Battery & power (capacity, voltage, current, temperature, USB-C PD)
  - Thermal monitoring (CPU, GPU, battery temperatures)
  - CPU metrics (frequencies, load, idle states, time-in-state)
  - GPU metrics (Mali T860 frequency, DVFS)
  - Memory usage (detailed /proc/meminfo parsing)
  - Network statistics (per-interface rx/tx, carrier state)
  - Storage I/O (eMMC, SD card statistics)
  - Sensors (accelerometer, gyroscope, magnetometer, ambient light, proximity)
  - Process telemetry (top processes by CPU/memory)
  - System state (display brightness, LEDs, RF kill)

- **Configurable collection intervals**:
  - High-frequency (default 5s): Battery, temps, CPU, memory, network
  - Medium-frequency (default 60s): CPU stats, GPU, storage, processes
  - Low-frequency (default 5min): Sensors, system state

- **Resilient networking**:
  - Automatic retry with exponential backoff
  - Offline buffering when server is unreachable
  - Configurable timeouts

- **Developer-friendly**:
  - TypeScript with full type definitions
  - Bun runtime for optimal performance
  - Extensive test suite
  - CLI tool for debugging
  - Systemd service integration

## Requirements

- Pinephone Pro running postmarketOS
- [Bun](https://bun.sh/) runtime (v1.0+)

## Installation

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Clone and setup**:
   ```bash
   cd /home/user/src/telemetry
   bun install
   ```

3. **Configure**:
   ```bash
   cp env.example .env
   nano .env  # Edit configuration
   ```

## Configuration

Edit `.env` to configure:

```env
# Server endpoint
TELEMETRY_SERVER_URL=http://your-server.com/api/telemetry
TELEMETRY_API_KEY=your-api-key

# Device identification
DEVICE_ID=pinephone-pro-01

# Collection intervals (milliseconds)
HIGH_FREQ_INTERVAL_MS=5000
MEDIUM_FREQ_INTERVAL_MS=60000
LOW_FREQ_INTERVAL_MS=300000

# Enable/disable collectors
COLLECT_BATTERY=true
COLLECT_THERMAL=true
COLLECT_CPU=true
# ... etc

# Debug mode (logs but doesn't send)
DRY_RUN=false
```

## Usage

### Quick Start

```bash
# Run in foreground (for testing)
bun run start

# Or use the start script
./scripts/start.sh --foreground
```

### Background Daemon

```bash
# Start daemon
./scripts/start.sh

# Check status
./scripts/status.sh

# Stop daemon
./scripts/stop.sh
```

### Systemd Service (Recommended for Production)

```bash
# Install service
sudo ./scripts/install-service.sh

# Start and enable
sudo systemctl enable --now pinephone-telemetry

# View logs
journalctl -u pinephone-telemetry -f

# Uninstall
sudo ./scripts/uninstall-service.sh
```

### CLI Tool

For debugging and one-off collection:

```bash
# Collect all telemetry once and print
bun run collect:once

# Collect specific frequency
bun run src/cli.ts --once --frequency high
bun run src/cli.ts --once --frequency medium
bun run src/cli.ts --once --frequency low
bun run src/cli.ts --once --frequency full

# Output as JSON
bun run src/cli.ts --once --json

# Debug mode
bun run collect:debug
```

### Development

```bash
# Run with watch mode
bun run dev

# Run tests
bun test

# Run tests with watch
bun test --watch

# Type check
bun run typecheck
```

## API Endpoints

The daemon sends JSON payloads to your server. Expected endpoints:

### POST `/api/telemetry`
Receives individual telemetry payloads.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <API_KEY>` (if configured)
- `X-Device-ID: <device-id>`
- `X-Telemetry-Frequency: high|medium|low`

**Body:**
```typescript
interface TelemetryPayload {
  deviceId: string;
  timestamp: string;        // ISO 8601
  timestampMs: number;      // Unix timestamp ms
  frequency: "high" | "medium" | "low";
  data: HighFrequencyTelemetry | MediumFrequencyTelemetry | LowFrequencyTelemetry;
}
```

### POST `/api/telemetry/batch`
Receives batched payloads (for offline buffer flush).

### GET `/api/health`
Health check endpoint (optional).

## Data Models

See `src/types/` for complete TypeScript definitions. Key payloads:

### High-Frequency Data (every 5s)
- Battery: capacity, voltage, current, temperature, status
- Thermal: CPU/GPU/battery temperatures
- CPU: per-core frequencies, load average, uptime
- Memory: total, available, used, swap
- Network: per-interface rx/tx bytes, carrier state

### Medium-Frequency Data (every 60s)
- CPU: time-in-state statistics, idle state stats
- GPU: frequency, governor, DVFS stats
- Storage: read/write bytes, I/O time
- Processes: top 50 by CPU time

### Low-Frequency Data (every 5min)
- Sensors: accelerometer, gyroscope, magnetometer, light, proximity
- System: display brightness, LED states, RF kill states

## Architecture

```
src/
├── index.ts          # Main daemon entry point
├── cli.ts            # CLI tool
├── config.ts         # Environment configuration
├── types/            # TypeScript type definitions
│   ├── battery.ts
│   ├── thermal.ts
│   ├── cpu.ts
│   ├── gpu.ts
│   ├── memory.ts
│   ├── network.ts
│   ├── storage.ts
│   ├── sensors.ts
│   ├── process.ts
│   ├── system.ts
│   └── index.ts      # Combined types and payloads
├── collectors/       # Data collection modules
│   ├── paths.ts      # Sysfs/procfs paths
│   ├── battery.ts
│   ├── thermal.ts
│   ├── cpu.ts
│   ├── gpu.ts
│   ├── memory.ts
│   ├── network.ts
│   ├── storage.ts
│   ├── sensors.ts
│   ├── processes.ts
│   ├── system.ts
│   └── index.ts      # Aggregate collectors
├── api/
│   └── client.ts     # HTTP client with retry logic
└── utils/
    ├── sysfs.ts      # File reading utilities
    └── logger.ts     # Logging utility
```

## Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/collectors.test.ts

# Run with verbose output
bun test --verbose
```

Tests automatically detect if running on Pinephone hardware and skip hardware-specific assertions on other platforms.

## Troubleshooting

### "Permission denied" reading sysfs
Some files require root access. Run the daemon as root or adjust permissions.

### High memory usage
Reduce `MAX_PROCESSES` in `.env` or increase collection intervals.

### Server unreachable
The daemon will buffer telemetry locally (up to `OFFLINE_BUFFER_MAX_SIZE` entries) and retry when the server becomes available.

### Debug mode
Set `DRY_RUN=true` in `.env` to collect telemetry without sending to server.

## License

MIT

