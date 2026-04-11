#!/bin/bash
# QRM Shutdown Script (Linux)

# Base directories
UI_DIR="$HOME/src/qrm-ui"
API_DIR="$HOME/src/qrm"

echo "Stopping QRM Services..."

# 1. Stop UI
if [ -f "$UI_DIR/ui.pid" ]; then
    PID=$(cat "$UI_DIR/ui.pid")
    echo "Stopping UI (PID: $PID)..."
    kill $PID
    rm "$UI_DIR/ui.pid"
else
    echo "UI PID file not found."
fi

# 2. Stop Backend
if [ -f "$API_DIR/server.pid" ]; then
    PID=$(cat "$API_DIR/server.pid")
    echo "Stopping Backend (PID: $PID)..."
    kill $PID
    rm "$API_DIR/server.pid"
else
    echo "Backend PID file not found."
fi

# Cleanup: Sometimes Vite leaves orphaned processes
# We can be a bit more aggressive if needed:
# pkill -f "vite"
# pkill -f "server.js"

echo "QRM Services stopped."
