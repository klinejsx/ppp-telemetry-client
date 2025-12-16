#!/bin/sh
# Install the Pinephone Pro Telemetry Daemon as a systemd service
# Usage: sudo ./scripts/install-service.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_FILE="$PROJECT_DIR/pinephone-telemetry.service"
DEST="/etc/systemd/system/pinephone-telemetry.service"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root (use sudo)"
    exit 1
fi

# Check if service file exists
if [ ! -f "$SERVICE_FILE" ]; then
    echo "Error: Service file not found: $SERVICE_FILE"
    exit 1
fi

# Find bun location
BUN_PATH=""
for path in "/root/.bun/bin/bun" "/home/*/.bun/bin/bun" "/usr/local/bin/bun" "/usr/bin/bun"; do
    for found in $path; do
        if [ -x "$found" ]; then
            BUN_PATH="$(dirname "$found")"
            break 2
        fi
    done
done

if [ -z "$BUN_PATH" ]; then
    echo "Error: bun not found. Please install bun first."
    exit 1
fi

echo "Found bun at: $BUN_PATH"

# Update service file with correct paths
echo "Installing service file..."
sed -e "s|WorkingDirectory=.*|WorkingDirectory=$PROJECT_DIR|" \
    -e "s|Environment=\"PATH=.*\"|Environment=\"PATH=$BUN_PATH:/usr/local/bin:/usr/bin:/bin\"|" \
    -e "s|ExecStart=.*/bun|ExecStart=$BUN_PATH/bun|" \
    "$SERVICE_FILE" > "$DEST"

# Set correct permissions
chmod 644 "$DEST"

# Reload systemd
echo "Reloading systemd..."
systemctl daemon-reload

echo ""
echo "Service installed successfully!"
echo ""
echo "Commands:"
echo "  Start:   sudo systemctl start pinephone-telemetry"
echo "  Stop:    sudo systemctl stop pinephone-telemetry"
echo "  Status:  sudo systemctl status pinephone-telemetry"
echo "  Enable:  sudo systemctl enable pinephone-telemetry"
echo "  Logs:    journalctl -u pinephone-telemetry -f"
echo ""
echo "Before starting, make sure to configure .env file:"
echo "  cp $PROJECT_DIR/env.example $PROJECT_DIR/.env"
echo "  nano $PROJECT_DIR/.env"

