#!/bin/bash
# Full setup script for Raspberry Pi (Raspberry Pi OS Lite 64-bit)
# Sets up OctoPrint + Klipper + webcam streaming
# Run as pi user: sudo ./setup.sh

set -e

echo "=== 3D Printer Control Setup ==="
echo "Platform: $(uname -m)"
echo ""

# --- System update ---
echo "[1/8] Updating system..."
apt-get update && apt-get upgrade -y

# --- Install dependencies ---
echo "[2/8] Installing dependencies..."
apt-get install -y \
    python3 python3-pip python3-venv \
    git curl wget \
    libffi-dev libyaml-dev \
    build-essential \
    haproxy \
    ffmpeg \
    v4l-utils \
    screen

# --- Install OctoPrint ---
echo "[3/8] Installing OctoPrint..."
cd /home/pi
python3 -m venv oprint
source oprint/bin/activate
pip install --upgrade pip
pip install octoprint
deactivate

# --- OctoPrint systemd service ---
echo "[4/8] Creating OctoPrint service..."
cat > /etc/systemd/system/octoprint.service << 'EOF'
[Unit]
Description=OctoPrint
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
ExecStart=/home/pi/oprint/bin/octoprint serve
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable octoprint

# --- Install Klipper ---
echo "[5/8] Installing Klipper..."
cd /home/pi
git clone https://github.com/Klipper3d/klipper.git
cd klipper
python3 -m venv klippy-env
klippy-env/bin/pip install -r scripts/klippy-requirements.txt

# Klipper systemd service
cat > /etc/systemd/system/klipper.service << 'EOF'
[Unit]
Description=Klipper 3D Printer Firmware
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/home/pi/klipper/klippy-env/bin/python /home/pi/klipper/klippy/klippy.py /home/pi/printer_data/config/printer.cfg -l /home/pi/printer_data/logs/klippy.log -a /tmp/klippy_uds
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable klipper

# --- Webcam streaming ---
echo "[6/8] Setting up webcam (mjpg-streamer)..."
apt-get install -y cmake libjpeg62-turbo-dev
cd /tmp
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer/mjpg-streamer-experimental
make
make install

cat > /etc/systemd/system/webcam.service << 'EOF'
[Unit]
Description=Webcam Streaming
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" -o "output_http.so -p 8080 -w /usr/local/share/mjpg-streamer/www"
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable webcam

# --- HAProxy (reverse proxy for OctoPrint + webcam) ---
echo "[7/8] Configuring HAProxy..."
cat > /etc/haproxy/haproxy.cfg << 'EOF'
global
    maxconn 4096
    user haproxy
    group haproxy
    daemon
    log /dev/log local0 debug

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    retries 3
    option redispatch
    maxconn 2000
    timeout connect 5000
    timeout client  50000
    timeout server  50000

frontend public
    bind *:80
    default_backend octoprint

backend octoprint
    reqrep ^([^\ :]*)\ /webcam/(.*)     \1\ /\2
    option forwardfor
    server octoprint 127.0.0.1:5000

backend webcam
    server webcam 127.0.0.1:8080
EOF

systemctl enable haproxy

# --- Copy configs ---
echo "[8/8] Copying config files..."
mkdir -p /home/pi/printer_data/config
mkdir -p /home/pi/printer_data/gcodes
mkdir -p /home/pi/printer_data/logs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/../klipper/printer.cfg" /home/pi/printer_data/config/printer.cfg
chown -R pi:pi /home/pi/printer_data

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "1. Edit /home/pi/printer_data/config/printer.cfg"
echo "   - Set the correct MCU serial: ls /dev/serial/by-id/"
echo "   - Run PROBE_CALIBRATE to set z_offset"
echo ""
echo "2. Start services:"
echo "   sudo systemctl start octoprint klipper webcam haproxy"
echo ""
echo "3. Open OctoPrint: http://raspberrypi.local"
echo ""
echo "4. Install Telegram plugin via OctoPrint plugin manager"
echo "   Then configure with your bot token"
echo ""
echo "See docs/SETUP.md for detailed instructions"
