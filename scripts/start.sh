#!/bin/sh
# Start the Pinephone Pro Telemetry Daemon
# Usage: ./scripts/start.sh [--foreground]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_FILE="/tmp/pinephone-telemetry.pid"
LOG_FILE="/tmp/pinephone-telemetry.log"

cd "$PROJECT_DIR"

# Check if bun is available
if ! command -v bun >/dev/null 2>&1; then
    # Try common bun locations
    if [ -x "$HOME/.bun/bin/bun" ]; then
        export PATH="$HOME/.bun/bin:$PATH"
    else
        echo "Error: bun is not installed or not in PATH"
        exit 1
    fi
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Telemetry daemon is already running (PID: $OLD_PID)"
        exit 0
    else
        echo "Removing stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Copy .env.example if .env doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ] && [ -f "$PROJECT_DIR/env.example" ]; then
    echo "Creating .env from env.example..."
    cp "$PROJECT_DIR/env.example" "$PROJECT_DIR/.env"
    echo "Please edit .env with your configuration"
fi

# Check for foreground mode
if [ "$1" = "--foreground" ] || [ "$1" = "-f" ]; then
    echo "Starting telemetry daemon in foreground..."
    exec bun run src/index.ts
else
    echo "Starting telemetry daemon in background..."
    nohup bun run src/index.ts > "$LOG_FILE" 2>&1 &
    PID=$!
    echo "$PID" > "$PID_FILE"
    echo "Telemetry daemon started (PID: $PID)"
    echo "Logs: $LOG_FILE"
    echo "To stop: ./scripts/stop.sh"
fi

