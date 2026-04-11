# Linux Deployment Setup

This directory contains the files needed to manage QRM as a background service on a Linux system using `systemd`.

## Files
- `start.sh`: Starts both the QRM Backend (port 3000) and the UI (port 5173).
- `stop.sh`: Stops both services.
- `qrm.service`: Systemd service unit definition.

## Setup Instructions

1. **Pull changes** to your Linux box.
2. **Make scripts executable**:
   ```bash
   chmod +x deploy/linux/start.sh
   chmod +x deploy/linux/stop.sh
   ```
3. **Install the service**:
   ```bash
   sudo cp deploy/linux/qrm.service /etc/systemd/system/
   sudo systemctl daemon-reload
   ```
4. **Manage the service**:
   - Start: `sudo systemctl start qrm`
   - Stop: `sudo systemctl stop qrm`
   - Check Status: `sudo systemctl status qrm`
   - Enable on Boot: `sudo systemctl enable qrm`

## Logs
Logs will be generated in:
- Backend: `~/src/qrm/server.log`
- UI: `~/src/qrm-ui/ui.log`
- System logs: `journalctl -u qrm -f`
