#!/bin/sh
# Check status of the Pinephone Pro Telemetry Daemon
# Usage: ./scripts/status.sh

PID_FILE="/tmp/pinephone-telemetry.pid"
LOG_FILE="/tmp/pinephone-telemetry.log"

echo "=== Pinephone Pro Telemetry Daemon Status ==="
echo ""

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Status: RUNNING"
        echo "PID: $PID"
        
        # Get memory usage
        if [ -f "/proc/$PID/status" ]; then
            RSS=$(grep "VmRSS" /proc/$PID/status 2>/dev/null | awk '{print $2, $3}')
            echo "Memory: $RSS"
        fi
        
        # Get uptime
        if [ -f "/proc/$PID/stat" ]; then
            START_TIME=$(cut -d' ' -f22 /proc/$PID/stat)
            UPTIME=$(awk '{print $1}' /proc/uptime)
            BOOT_TIME=$(date +%s)
            HZ=100
            PROC_START=$((BOOT_TIME - ${UPTIME%.*} + START_TIME / HZ))
            echo "Started: $(date -d @$PROC_START 2>/dev/null || echo 'unknown')"
        fi
    else
        echo "Status: NOT RUNNING (stale PID file)"
        rm -f "$PID_FILE"
    fi
else
    echo "Status: NOT RUNNING"
fi

echo ""

# Check for any telemetry processes
OTHER_PIDS=$(pgrep -f "bun.*telemetry" 2>/dev/null || true)
if [ -n "$OTHER_PIDS" ]; then
    echo "Other telemetry processes found:"
    echo "$OTHER_PIDS" | while read pid; do
        CMD=$(ps -p "$pid" -o args= 2>/dev/null || echo "unknown")
        echo "  PID $pid: $CMD"
    done
    echo ""
fi

# Show recent log entries
if [ -f "$LOG_FILE" ]; then
    echo "Recent log entries:"
    echo "---"
    tail -10 "$LOG_FILE"
    echo "---"
    echo ""
    echo "Full log: $LOG_FILE"
fi

