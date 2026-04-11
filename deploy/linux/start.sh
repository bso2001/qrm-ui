#!/bin/bash
# QRM Startup Script (Linux)

# Base directories
UI_DIR="$HOME/src/qrm-ui"
API_DIR="$HOME/src/qrm"

# Ports
UI_PORT=5173
API_PORT=3000

echo "Starting QRM Services..."

# 1. Start QRM Backend (Port 3000)
echo "Starting Backend on port $API_PORT..."
cd "$API_DIR"
nohup node server.js > "$API_DIR/server.log" 2>&1 &
echo $! > "$API_DIR/server.pid"

# 2. Start QRM UI (Port 5173)
echo "Starting UI on port $UI_PORT..."
cd "$UI_DIR"
# Using --host to ensure it listens on all interfaces (for Nginx)
# Using --port to explicitly set it (just in case)
nohup npm run dev -- --host --port $UI_PORT > "$UI_DIR/ui.log" 2>&1 &
echo $! > "$UI_DIR/ui.pid"

echo "QRM Services started."
