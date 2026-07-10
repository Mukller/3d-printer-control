# Setup Guide

Complete step-by-step guide for setting up the 3D printer control system on Raspberry Pi.

## Hardware

- Raspberry Pi 4 (2GB+ recommended) or Pi 3B+
- microSD 16GB+ (Class 10)
- USB-A to USB-B cable (to printer)
- USB webcam (for camera stream)
- Optional: Sonoff Smart Plug (for PSU control via eWeLink)

## Step 1: Flash Raspberry Pi OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Choose: **Raspberry Pi OS Lite (64-bit)**
3. Advanced settings (⚙️):
   - Enable SSH
   - Set username: `pi`
   - Set your WiFi credentials
   - Set hostname: `raspberrypi`
4. Flash to SD card

## Step 2: First Boot

```bash
# Connect via SSH
ssh pi@raspberrypi.local

# Clone this repo
git clone https://github.com/Mukller/3d-printer-control.git
cd 3d-printer-control

# Run setup
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
```

## Step 3: Configure MCU Serial Port

Find the printer serial port:
```bash
ls /dev/serial/by-id/
# Example output: usb-1a86_USB_Serial-if00-port0
```

Edit `/home/pi/printer_data/config/printer.cfg`:
```yaml
[mcu]
serial: /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0
```

## Step 4: Start Services

```bash
sudo systemctl start klipper
sudo systemctl start octoprint
sudo systemctl start webcam
sudo systemctl start haproxy
```

Check status:
```bash
sudo systemctl status octoprint
sudo systemctl status klipper
```

## Step 5: OctoPrint First Setup

1. Open browser: `http://raspberrypi.local`
2. Complete the setup wizard
3. API key is in Settings → API

## Step 6: Install Telegram Plugin

1. OctoPrint → Settings → Plugin Manager → Get More
2. Search: `Telegram`
3. Install **OctoTelegram** by fabianonline
4. Restart OctoPrint

## Step 7: Configure Telegram Bot

1. Open Telegram, message [@BotFather](https://t.me/BotFather)
2. `/newbot` → set name and username
3. Copy the bot token

In OctoPrint → Settings → Telegram:
- Paste the bot token
- Start the bot (`/start` in Telegram)
- Grant yourself access in the plugin settings

See [telegram-bot/config-template.json](../telegram-bot/config-template.json) for all options.

## Step 8: Bed Leveling (Klipper)

```bash
# In OctoPrint terminal or Mainsail:
G28          # Home all axes
PROBE_CALIBRATE  # Interactive z-offset calibration
BED_MESH_CALIBRATE  # Create mesh
SAVE_CONFIG  # Save to printer.cfg
```

## Step 9: OctoEverywhere (optional)

For remote access without port forwarding:
1. Install OctoEverywhere plugin
2. Register at [octoeverywhere.com](https://octoeverywhere.com)
3. Link your printer

## Webcam URL

- Stream: `http://raspberrypi.local/webcam/?action=stream`
- Snapshot: `http://raspberrypi.local/webcam/?action=snapshot`

## Troubleshooting

**OctoPrint not starting:**
```bash
journalctl -u octoprint -n 50
```

**Klipper MCU connection error:**
```bash
# Check port
ls /dev/ttyUSB* /dev/ttyACM*
# Add pi to dialout group
sudo usermod -a -G dialout pi
```

**Camera not detected:**
```bash
v4l2-ctl --list-devices
# Check /dev/video0 exists
```
