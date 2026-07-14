<div align="center">

**English** • [Русский](README.md)

</div>

# 3D Printer Control

<p align="center">
  <a href="https://github.com/Mukller">
    <img src="https://img.shields.io/badge/Anton%20Petnitsky-Developer-0d1117?style=for-the-badge&logo=github&logoColor=white&labelColor=0d1117&color=58a6ff" alt="Anton Petnitsky" />
  </a>
</p>

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red)
![OctoPrint](https://img.shields.io/badge/OctoPrint-1.9+-orange)
![Klipper](https://img.shields.io/badge/Klipper-latest-green)

**Full 3D printer management stack: OctoPrint + Klipper + Telegram bot + online slicer**

Runs on **Raspberry Pi Zero 2 WH** with a **Creality Ender 5 S1**. Real-time Telegram control: photos with temperatures every 2 mm, start/stop/pause, upload G-code files directly in chat.

---

## Table of Contents

- [Hardware](#hardware)
- [Architecture](#architecture)
- [Installation](#installation)
- [Klipper](#klipper)
- [OctoPrint Plugins](#octoprint-plugins)
- [Telegram Bot](#telegram-bot)
- [Bot Commands](#bot-commands)
- [Camera](#camera)
- [Power Control](#power-control)
- [Calibrations](#calibrations)
- [Online Slicer](#online-slicer)
- [Troubleshooting](#troubleshooting)

---

## Hardware

| Component | Model |
|-----------|-------|
| Printer | Creality Ender 5 S1 |
| Printer MCU | STM32F401 |
| SBC | Raspberry Pi Zero 2 WH |
| Camera | Logitech USB camera (previously Pi Camera Module) |
| Power control | Relay module (GPIO) |
| Slicer | Orca Slicer |

> **Note:** Pi Zero 2 WH (512 MB RAM, 1 GHz) is the minimum for OctoPrint + Klipper. Pi 3B+ or Pi 4 recommended for comfortable use.

---

## Architecture

```
Telegram
   │
   ▼
OctoTelegram plugin
   │
   ▼
OctoPrint (port 5000)
   │
   ├── Klipper (klippy.py)
   │      │
   │      ▼
   │   STM32F401 (printer MCU) → motors, heaters, sensors
   │
   └── mjpg-streamer (port 8080) → Logitech camera
```

---

## Installation

### Step 1: Flash Raspberry Pi OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Choose: **Raspberry Pi OS Lite (64-bit)**
3. Advanced settings (⚙️): enable SSH, set username `pi`, WiFi, hostname `raspberrypi`
4. Flash to SD card

### Step 2: First connection

```bash
ssh pi@raspberrypi.local

git clone https://github.com/Mukller/3d-printer-control.git
cd 3d-printer-control
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
```

### Step 3: Install OctoPrint

```bash
python3 -m venv ~/oprint
source ~/oprint/bin/activate
pip install OctoPrint
```

Systemd service (`/etc/systemd/system/octoprint.service`):

```ini
[Unit]
Description=OctoPrint
After=network.target

[Service]
User=pi
ExecStart=/home/pi/oprint/bin/octoprint serve
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable octoprint && sudo systemctl start octoprint
```

### Step 4: Install Klipper

```bash
cd ~
git clone https://github.com/Klipper3d/klipper
./klipper/scripts/install-octopi.sh
```

### Step 5: Flash printer MCU (STM32F401)

Mandatory step — Klipper won't connect without it.

```bash
cd ~/klipper
make menuconfig
```

Settings for Ender 5 S1:

| Parameter | Value |
|-----------|-------|
| Micro-controller | STM32 |
| Processor model | STM32F401 |
| Bootloader offset | 32KiB bootloader |
| Communication interface | Serial (USART1 PA10/PA9) |
| Baud rate | 250000 |

```bash
make
cp out/klipper.bin /media/pi/SDCARD/firmware.bin
```

Insert SD card into printer and power cycle. It flashes automatically.

### Step 6: Find serial port

```bash
ls /dev/serial/by-id/
# Example: usb-1a86_USB_Serial-if00-port0
```

Set in `klipper/printer.cfg`:

```ini
[mcu]
serial: /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0
```

### Step 7: Install plugins

```bash
source ~/oprint/bin/activate
./octoprint/scripts/install-plugins.sh
sudo systemctl restart octoprint
```

### Step 8: Configure Telegram bot

1. Message [@BotFather](https://t.me/BotFather) → `/newbot`
2. Copy the token
3. OctoPrint → Settings → Telegram → paste token → send `/start` to bot → grant yourself access

---

## Klipper

Klipper is printer firmware running on the Raspberry Pi. Unlike Marlin it offloads computations from the MCU to the Pi, enabling Input Shaping, Pressure Advance, and live config editing.

### Macros

```ini
[gcode_macro PAUSE]
rename_existing: BASE_PAUSE
gcode:
  BASE_PAUSE
  G91
  G1 Z10 F300
  G90

[gcode_macro RESUME]
rename_existing: BASE_RESUME
gcode:
  BASE_RESUME

[gcode_macro CANCEL_PRINT]
rename_existing: BASE_CANCEL_PRINT
gcode:
  BASE_CANCEL_PRINT
  G28 X Y

[gcode_macro PREHEAT_PLA]
gcode:
  M140 S60
  M104 S210

[gcode_macro PREHEAT_PETG]
gcode:
  M140 S85
  M104 S225
```

### Useful commands

```gcode
FIRMWARE_RESTART    ; restart Klipper
G28                 ; home all axes
M119                ; endstop states
BED_MESH_OUTPUT     ; show current mesh
PREHEAT_PLA         ; preheat for PLA
PREHEAT_PETG        ; preheat for PETG
```

---

## OctoPrint Plugins

### OctoTelegram (main)

**Repo:** https://github.com/fabianonline/OctoPrint-Telegram

Full printer control via Telegram with automatic photos every 2 mm Z-height.

### PSU Control + GPIO relay

**Repo:** https://github.com/kantlivelong/OctoPrint-PSUControl

Controls printer power via Pi GPIO → relay module → printer power cable.

Settings: Switching method: GPIO, Pin: `17` (replace with your free pin), Active Low: `True`.

> **Alternative:** Sonoff smart plug + [PSU Control eWeLink](https://github.com/airens/OctoPrint-PSUControl-eWeLink)

### OctoEverywhere ⭐ Recommended

**Site:** https://octoeverywhere.com

Encrypted remote access tunnel + built-in AI print failure detection (**Gadget**). Free tier: 1 printer.

### PrintWatch (alternative to Gadget)

**Repo:** https://github.com/printpal-io/OctoPrint-PrintWatch

AI defect detection. Requires printpal.io API key.

> **Use one, not both:** OctoEverywhere Gadget **or** PrintWatch.

### SlicerEstimator

**Repo:** https://github.com/NillerMedDild/Octoprint-SlicerEstimator

Accurate print time from slicer M73 metadata.

### UI Customizer

**Repo:** https://github.com/LazeMSS/OctoPrint-UICustomizer — dark theme for OctoPrint.

---

## Telegram Bot

On startup:
```
🚀 Hello. I'm online and ready to receive your commands.
```

On shutdown:
```
🐙 💤 Shutting down. Goodbye.
```

### Automatic notifications

| Event | Message |
|-------|---------|
| Printer connected | `🔗 Printer Connected` |
| Printer disconnected | `💔 Printer Disconnected` |
| Printer error | `⚠ ⚠ ⚠Printer Error {message}` |
| Print started | `Started printing {file}.` + photo |
| Print finished | `Finished printing {file}.` + photo |
| Every 2 mm Z | Photo + temps + progress |
| Homing | `🏠 Printer received home command` + temps |

Progress format:
```
Printing at Z=3.2.
Bed 86.39/86.0, Extruder 225.03/225.0.
00:31:11, 25% done, 00:40:26 remaining.
Completed time 15:41:14.
```

### Temperature profiles

| Material | Bed | Extruder |
|----------|-----|----------|
| PLA | 60°C | 210°C |
| PETG | 85–86°C | 224–225°C |

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/abort` | Emergency stop🆘 |
| `/shutup` | Mute bot🔕 |
| `/dontshutup` | Unmute bot🔔 |
| `/status` | Current status⛏🔨/🛏💤 |
| `/settings` | Notification settings⚙🔔 |
| `/files` | List available files📂 |
| `/filament` | Filament info🪛🪱🧵 |
| `/print` | Start printing✅ |
| `/togglepause` | Pause/resume print⏯ |
| `/con` | Connection info📲🔌 |
| `/upload` | Upload G-code file |
| `/sys` | System info🛠 |
| `/ctrl` | Printer control commands🧰 |
| `/tune` | Print tuning⚙ |
| `/user` | User info🚹🚺 |
| `/help` | Help⚠️❓ |
| `/gif` | 20-frame camera GIF🌇 |
| `/supergif` | 60-frame camera GIF🏙 |
| `/on` | Turn on printer (GPIO relay) |
| `/off` | Turn off printer (GPIO relay) |
| `/gcode` | Send G-code command |

---

## Camera

### Logitech USB camera (mjpg-streamer)

```bash
sudo apt-get install -y cmake libjpeg62-turbo-dev
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer/mjpg-streamer-experimental
make && sudo make install

mjpg_streamer \
  -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" \
  -o "output_http.so -p 8080"
```

Stream: `http://raspberrypi.local:8080/?action=stream`
Snapshot: `http://raspberrypi.local:8080/?action=snapshot`

OctoPrint → Settings → Webcam → Stream URL: `http://127.0.0.1:8080/?action=stream`

### Pi Camera Module (camera-streamer)

```bash
sudo apt-get install -y libcamera-dev liblivemedia-dev
git clone https://github.com/ayufan/camera-streamer.git
cd camera-streamer && make && sudo make install

camera-streamer \
  --camera-path=/base/soc/i2c0mux/i2c@1/imx219@10 \
  --camera-type=libcamera \
  --http-port=8080
```

---

## Power Control

### GPIO relay (original setup)

```
Pi GPIO17 → Relay module → break in printer 220V power cable
```

Wiring: VCC→5V, GND→GND, IN→GPIO17. PSU Control settings: GPIO, pin 17, Active Low: True.

> **Alternative:** Sonoff + PSU Control eWeLink plugin

### HAProxy (optional)

For a single URL without ports:

```bash
sudo apt-get install haproxy
```

```
frontend octoprint
    bind *:80
    acl is_webcam path_beg /webcam/
    use_backend webcam if is_webcam
    default_backend octoprint

backend octoprint
    server octoprint 127.0.0.1:5000

backend webcam
    server webcam 127.0.0.1:8080
```

> On Pi Zero 2 WH HAProxy adds load. Default setup uses direct ports: OctoPrint `:5000`, camera `:8080`.

---

## Calibrations

Main slicer: **Orca Slicer**. Alternative: Creality Print (CE5S1 profile built-in).

### PID tuning

```gcode
PID_CALIBRATE HEATER=extruder TARGET=225
PID_CALIBRATE HEATER=heater_bed TARGET=85
SAVE_CONFIG
```

### Z-Offset

```gcode
G28
PROBE_CALIBRATE
ACCEPT
SAVE_CONFIG
```

### Bed Mesh

```gcode
G28
BED_MESH_CALIBRATE
SAVE_CONFIG
```

### Pressure Advance

```gcode
SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=1 ACCEL=500
TUNING_TOWER COMMAND=SET_PRESSURE_ADVANCE PARAMETER=ADVANCE START=0 FACTOR=.005
```

### Resources

- [k3d.tech/calibrations](https://k3d.tech/calibrations/)
- [Klipper Config Reference](https://www.klipper3d.org/Config_Reference.html)

---

## Online Slicer

Web app for viewing and slicing STL files in the browser.

**Path:** `online-slicer/`

| Part | Technologies |
|------|-------------|
| Frontend | React 19, Vite, Three.js, TailwindCSS, Framer Motion |
| Backend | Node.js, Express 5, Multer, Mongoose |

```bash
# Backend
cd online-slicer/backend && npm install && npm start

# Frontend
cd online-slicer/frontend && npm install && npm run dev
```

---

## Troubleshooting

**OctoPrint not starting:** `journalctl -u octoprint -n 50`

**Klipper can't find MCU:**
```bash
ls /dev/ttyUSB* /dev/ttyACM*
sudo usermod -a -G dialout pi
```

**Camera not detected:** `v4l2-ctl --list-devices`

**Bot not responding:** Check token in OctoPrint → Settings → Telegram

**Klipper "mcu: Unable to connect":** `ls /dev/serial/by-id/` → update path in printer.cfg

**Pi overheating:** `vcgencmd measure_temp` → add heatsink
