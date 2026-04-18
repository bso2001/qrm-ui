#!/bin/bash
# QRM Startup Script (Linux / systemd)

# Hardcoded absolute paths for systemd reliability
UI_DIR="/var/www/qrm-ui"
API_DIR="/var/www/qrm"

# Ports
UI_PORT=5173
API_PORT=3000

echo "Starting QRM Services from $UI_DIR..."

# 1. Start QRM Backend
if [ -d "$API_DIR" ]; then
    echo "Starting Backend in $API_DIR..."
    $API_DIR/node server.js > "$API_DIR/server.log" 2>&1 &
    API_PID=$!
    echo "Backend running (PID: $API_PID)"
else
    echo "Error: Backend directory $API_DIR not found."
    exit 1
fi

# 2. Start QRM UI
if [ -d "$UI_DIR" ]; then
    echo "Starting UI in $UI_DIR..."
    cd "$UI_DIR"
    # Ensure node_modules are present
    npm run dev -- --host --port $UI_PORT > "$UI_DIR/ui.log" 2>&1 &
    UI_PID=$!
    echo "UI running (PID: $UI_PID)"
else
    echo "Error: UI directory $UI_DIR not found."
    exit 1
fi

# Trap SIGTERM (sent by systemctl stop) to gracefully kill child processes
trap "echo 'Stopping QRM Services...'; kill -TERM $API_PID $UI_PID; exit 0" SIGTERM SIGINT

# Keep the script running to satisfy systemd
wait $API_PID $UI_PID
