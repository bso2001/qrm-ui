#!/bin/bash
# QRM Startup Script (Linux / systemd)

# Base directories
UI_DIR="$HOME/src/qrm-ui"
API_DIR="$HOME/src/qrm"

# Ports
UI_PORT=5173
API_PORT=3000

echo "Starting QRM Services..."

# 1. Start QRM Backend
cd "$API_DIR"
node server.js > "$API_DIR/server.log" 2>&1 &
API_PID=$!
echo "Backend running on port $API_PORT (PID: $API_PID)"

# 2. Start QRM UI
cd "$UI_DIR"
npm run dev -- --host --port $UI_PORT > "$UI_DIR/ui.log" 2>&1 &
UI_PID=$!
echo "UI running on port $UI_PORT (PID: $UI_PID)"

# Trap SIGTERM (sent by systemctl stop) to gracefully kill child processes
trap "echo 'Stopping QRM Services...'; kill -TERM $API_PID $UI_PID; exit 0" SIGTERM SIGINT

# Keep the script running to satisfy systemd
wait $API_PID $UI_PID
