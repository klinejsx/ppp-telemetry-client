#!/bin/sh
# Stop the Pinephone Pro Telemetry Daemon
# Usage: ./scripts/stop.sh

set -e

PID_FILE="/tmp/pinephone-telemetry.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Telemetry daemon is not running (no PID file)"
    
    # Try to find and kill by process name
    PIDS=$(pgrep -f "bun.*telemetry" 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "Found running processes: $PIDS"
        echo "Sending SIGTERM..."
        echo "$PIDS" | xargs kill -TERM 2>/dev/null || true
        sleep 1
        echo "Stopped"
    fi
    exit 0
fi

PID=$(cat "$PID_FILE")

if ! kill -0 "$PID" 2>/dev/null; then
    echo "Process $PID is not running"
    rm -f "$PID_FILE"
    exit 0
fi

echo "Stopping telemetry daemon (PID: $PID)..."
kill -TERM "$PID"

# Wait for process to terminate
TIMEOUT=10
while [ $TIMEOUT -gt 0 ]; do
    if ! kill -0 "$PID" 2>/dev/null; then
        break
    fi
    sleep 1
    TIMEOUT=$((TIMEOUT - 1))
done

if kill -0 "$PID" 2>/dev/null; then
    echo "Process didn't terminate gracefully, sending SIGKILL..."
    kill -KILL "$PID" 2>/dev/null || true
fi

rm -f "$PID_FILE"
echo "Telemetry daemon stopped"

