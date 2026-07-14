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

This documentation contains everything needed to set up the system from scratch. No other instructions required.

<p align="center">
  <img src="https://octoprint.org/assets/img/features/control-tab.png" width="48%" alt="OctoPrint Control" />
  <img src="https://octoprint.org/assets/img/features/temperature-tab.png" width="48%" alt="OctoPrint Temperature" />
</p>
<p align="center">
  <img src="https://github.com/jacopotediosi/OctoPrint-Telegram/raw/master/extras/images/screen_1.png" width="32%" alt="Telegram Bot" />
  <img src="https://github.com/jacopotediosi/OctoPrint-Telegram/raw/master/extras/images/screen_2.png" width="32%" alt="Telegram Commands" />
  <img src="https://octoprint.org/assets/img/features/timelapse-tab.png" width="32%" alt="OctoPrint Timelapse" />
</p>

---

## Table of Contents

- [Hardware](#hardware)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Klipper — Printer Configuration](#klipper--printer-configuration)
- [OctoPrint Plugins](#octoprint-plugins)
  - [OctoTelegram](#ocotelegram--telegram-printer-control)
  - [PSU Control (GPIO relay)](#psu-control--printer-power-management)
  - [OctoEverywhere](#octoeverywhere--remote-access--ai-defect-detection)
  - [PrintWatch](#printwatch--alternative-ai-defect-detector)
  - [Obico (open-source AI)](#obico--open-source-ai-detector-with-self-hosting)
- [Telegram Bot](#telegram-bot)
- [Bot Commands](#bot-commands)
- [Camera](#camera)
- [Power Control](#power-control)
- [Calibrations](#calibrations)
  - [Print Defect Reference](#3d-print-defect-reference)
- [Online Slicer](#online-slicer)
- [Troubleshooting](#troubleshooting)

---

## Hardware

### What You Need

| Component | Model / Description |
|-----------|---------------------|
| 3D Printer | Creality Ender 5 S1 |
| Printer MCU | STM32F401 (built into the printer board) |
| Single-board computer | Raspberry Pi Zero 2 WH |
| Camera (option 1) | Logitech USB camera (any UVC-compatible model) |
| Camera (option 2) | Raspberry Pi Camera Module (any generation) |
| Power control | 5V Relay module (with optocoupler, active LOW) |
| Cable | USB-A → micro-USB (connecting Pi to printer) |
| SD card | microSD 16 GB+ (Class 10 / A1) |
| Pi power supply | 5V 2.5A micro-USB adapter |
| Slicer | Orca Slicer (free) |

> **Note about Pi Zero 2 WH:** 512 MB RAM and 1 GHz is the absolute minimum for running OctoPrint + Klipper simultaneously. The system works, but the web interface loads slowly (10–20 sec). Pi 3B+ (1 GB) or Pi 4 (2 GB+) is recommended for a comfortable experience. Pi Zero 2 WH is perfectly sufficient if you primarily control everything through Telegram and rarely open the web interface.

> **About the cable:** Pi Zero needs USB-A (printer side) → micro-USB (Pi side). This is how Klipper communicates with the printer MCU over serial.

---

## System Architecture

### How Everything Connects

```
┌─────────────────────────────────────────────────┐
│                    Telegram                      │
│          (your phone / any device)               │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS (internet)
                       ▼
┌─────────────────────────────────────────────────┐
│            Raspberry Pi Zero 2 WH               │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  OctoPrint (port 5000)                  │   │
│  │  ├── OctoTelegram plugin                │   │
│  │  ├── PSU Control (GPIO17 → relay)       │   │
│  │  ├── OctoEverywhere                     │   │
│  │  ├── SlicerEstimator                    │   │
│  │  └── UI Customizer                      │   │
│  └────────────────┬────────────────────────┘   │
│                   │ G-code via /tmp/printer     │
│  ┌────────────────▼────────────────────────┐   │
│  │  Klipper (klippy.py)                    │   │
│  │  Reads printer.cfg                      │   │
│  └────────────────┬────────────────────────┘   │
│                   │ USB Serial (/dev/ttyUSB0)   │
│  ┌────────────────▼────────────────────────┐   │
│  │  mjpg-streamer (port 8080)              │   │
│  │  Logitech USB → MJPEG stream            │   │
│  └─────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │ USB
                       ▼
┌─────────────────────────────────────────────────┐
│         Creality Ender 5 S1                     │
│         STM32F401 MCU                           │
│         Motors / Heaters / Sensors / CR Touch   │
└─────────────────────────────────────────────────┘
```

### Role of Each Component

**OctoPrint** — web server running on the Pi. Accepts commands from plugins and sends G-code to Klipper. Provides the web interface at `http://raspberrypi.local:5000`.

**Klipper** — printer firmware running on the Pi. Receives G-code from OctoPrint via Unix socket (`/tmp/printer`), translates it into stepper motor and heater signals. The printer MCU in Klipper mode is just a command executor for the Pi.

**OctoTelegram** — OctoPrint plugin. Listens for events (print start/end, Z-height change, errors) and sends notifications to Telegram. Accepts your commands and forwards them to OctoPrint.

**mjpg-streamer** — program that streams video from a USB camera over HTTP in MJPEG format. OctoPrint grabs snapshots from it and includes them in Telegram messages.

---

## Installation

### Step 1: Writing the OS Image to SD Card

#### Why Raspberry Pi OS and not regular Linux?

You could technically use Ubuntu Server or any other ARM Linux distribution. However, **Raspberry Pi OS** is the recommended choice for several reasons:

- **Hardware-optimized kernel** — the Pi uses a VideoCore GPU and a custom ARM SoC. Raspberry Pi OS ships with a kernel tuned specifically for this hardware
- **GPIO support out of the box** — `RPi.GPIO`, `lgpio`, and `gpiod` libraries are pre-installed. Our relay control needs these. On Ubuntu you'd install them separately and sometimes run into compatibility issues
- **`raspi-config` tool** — one command to enable camera, SPI, I2C, SSH, expand filesystem, overclock safely
- **Camera stack** — Pi Camera Module requires `libcamera` which is pre-configured in Pi OS. On other distributions it requires manual setup
- **Lite = no desktop** — "Lite" means no GNOME/KDE/XFCE desktop environment. That frees ~400 MB of RAM and significant CPU load. We don't need a GUI — OctoPrint runs in the browser, we manage everything remotely via SSH and Telegram
- **Better community support** — the OctoPrint, Klipper, and mjpg-streamer communities all document against Pi OS. Any issue you encounter will have a solution written for Pi OS

**In short:** Raspberry Pi OS Lite (64-bit) gives you a lean, hardware-compatible base that works without fighting drivers.

#### Flashing the image

1. Download **Raspberry Pi Imager** from the official site: https://www.raspberrypi.com/software/

2. Insert your microSD card into the computer

3. In Raspberry Pi Imager:
   - **Choose Device** → select `Raspberry Pi Zero 2 W`
   - **Choose OS** → `Raspberry Pi OS (other)` → `Raspberry Pi OS Lite (64-bit)` — choose Lite specifically, no desktop needed, it only wastes resources
   - **Choose Storage** → select your SD card

4. Before clicking Write, configure all settings at once using the keyboard shortcut:

   > **Press `Ctrl + Shift + X`** (Windows/Linux) or **`Cmd + Shift + X`** (Mac) to open the **Advanced Options** panel. In newer versions of Raspberry Pi Imager (1.8+) this opens automatically as **"Use OS customisation?"** after clicking Next.

   Fill in:
   - **Set hostname:** `raspberrypi`
   - **Enable SSH:** check → `Use password authentication`
   - **Set username and password:** username `pi`, choose a password
   - **Configure wireless LAN:** enter your Wi-Fi network name and password
   - **Wireless LAN country:** select your country (important for correct Wi-Fi frequencies)
   - **Set locale settings:** your timezone

   This saves you from connecting a keyboard and monitor to the Pi for initial setup — everything is preconfigured on the SD card before the Pi even boots.

5. Click **Save**, then **Write**. Wait ~5 minutes.

6. Insert the card into the Pi, connect power.

### Step 2: First SSH Connection

Wait ~60 seconds after powering on — the Pi is booting and connecting to Wi-Fi.

Open a terminal (PowerShell on Windows, Terminal on Mac/Linux):

```bash
ssh pi@raspberrypi.local
```

If the hostname doesn't resolve, find the IP address in your router's admin panel (section "connected devices") and connect directly:

```bash
ssh pi@192.168.X.X
```

On the first connection you'll see a fingerprint prompt — type `yes` and press Enter.

Enter your password (characters won't show — that's normal).

### Step 3: System Update

Run a system update immediately after logging in. Some dependencies won't install without up-to-date packages.

```bash
sudo apt update && sudo apt upgrade -y
```

Wait 5–15 minutes depending on internet speed. Then reboot:

```bash
sudo reboot
```

Reconnect via SSH after ~30 seconds.

### Step 4: Install Dependencies

```bash
sudo apt install -y \
  git \
  python3 \
  python3-pip \
  python3-venv \
  virtualenv \
  cmake \
  libjpeg62-turbo-dev \
  libavformat-dev \
  libavcodec-dev \
  libswscale-dev \
  libv4l-dev \
  v4l-utils \
  haproxy \
  build-essential \
  pkg-config \
  libffi-dev \
  libssl-dev \
  libyaml-dev \
  curl \
  wget \
  unzip
```

### Step 5: Clone This Repository

```bash
cd ~
git clone https://github.com/Mukller/3d-printer-control.git
```

### Step 6: Install OctoPrint

OctoPrint is installed in an isolated Python virtual environment (`~/oprint`) to avoid conflicts with system packages.

```bash
# Create virtual environment
python3 -m venv ~/oprint

# Activate it
source ~/oprint/bin/activate

# Update pip
pip install --upgrade pip

# Install OctoPrint
pip install OctoPrint

# Exit the virtual environment
deactivate
```

Create a systemd service for automatic startup on boot:

```bash
sudo nano /etc/systemd/system/octoprint.service
```

Paste the following (Ctrl+Shift+V to paste in most terminals):

```ini
[Unit]
Description=The snappy web interface for your 3D printer
After=network-online.target
Wants=network-online.target

[Service]
Environment="LC_ALL=C.UTF-8"
Environment="LANG=C.UTF-8"
Type=simple
User=pi
ExecStart=/home/pi/oprint/bin/octoprint serve --iface=0.0.0.0
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Save: Ctrl+O, Enter, Ctrl+X.

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable autostart
sudo systemctl enable octoprint

# Start now
sudo systemctl start octoprint

# Verify it's running
sudo systemctl status octoprint
```

You should see `Active: active (running)`. If not — see [Troubleshooting](#troubleshooting).

OctoPrint is now available in your browser: `http://raspberrypi.local:5000`

On first open, a setup wizard will run. Complete it, create an account. Find the API key later at Settings → API.

### Step 7: Install Klipper

```bash
cd ~
git clone https://github.com/Klipper3d/klipper.git

# Install Klipper dependencies
~/klipper/scripts/install-octopi.sh
```

The script installs all required packages and registers `klipper` as a systemd service.

Check:

```bash
sudo systemctl status klipper
```

The status will be `failed` or `inactive` right now — that's normal. Klipper won't start until `printer.cfg` exists. We'll configure it in the next steps.

### Step 8: Flash the Printer MCU (STM32F401)

**This step is mandatory.** Klipper works as a pair: software on the Pi (klippy) and a small firmware on the printer MCU. The stock Marlin firmware is not compatible — the MCU must be reflashed with Klipper firmware.

#### Build the firmware

```bash
cd ~/klipper
make menuconfig
```

A text-based configuration interface opens. Use arrow keys and Enter to navigate. Set the following:

```
[*] Enable extra low-level configuration options

    Micro-controller Architecture ---> STM32

    Processor model ---> STM32F401

    Bootloader offset ---> 32KiB bootloader

    Clock Reference ---> 8 MHz crystal

    Communication interface ---> Serial (on USART1 PA10/PA9)

    Baud rate for serial port ---> 250000
```

Exit: press `Q`, then `Y` to save.

```bash
# Build the firmware
make

# The firmware file will be here:
ls -la out/klipper.bin
```

#### Write firmware to the printer

The firmware is flashed via the printer's SD card:

1. Take any FAT32 micro-SD card (can be the one already in the printer)
2. Copy `out/klipper.bin` to the card:

```bash
# Insert the printer's SD card into Pi via adapter (or copy to your computer)
# Assuming the card mounts as /media/pi/SDCARD
cp ~/klipper/out/klipper.bin /media/pi/SDCARD/firmware.bin
sync
sudo umount /media/pi/SDCARD
```

If you can't mount the card directly on Pi, copy `klipper.bin` to your computer via SCP:

```bash
# On your computer (not on Pi):
scp pi@raspberrypi.local:~/klipper/out/klipper.bin ./
```

Rename the file to `firmware.bin` and copy it to the root of the printer's SD card.

3. Insert the card into the printer (slot at bottom or back)
4. Power the printer off completely (not just sleep)
5. Power it back on

The printer will automatically find `firmware.bin`, flash itself (~10 sec) and rename the file to `FIRMWARE.CUR`. If the rename happened — flashing was successful.

### Step 9: Connect Pi to Printer via USB

Connect Pi and printer with USB-A (printer) → micro-USB (Pi) cable.

Find the serial port:

```bash
ls /dev/serial/by-id/
```

You'll see something like:
```
usb-1a86_USB_Serial-if00-port0
```

Remember this path — it goes into `printer.cfg`.

Add user `pi` to the `dialout` group so OctoPrint/Klipper can read this port:

```bash
sudo usermod -a -G dialout pi
sudo reboot
```

### Step 10: Configure printer.cfg

After rebooting, copy the config from this repo:

```bash
cp ~/3d-printer-control/klipper/printer.cfg ~/printer_data/config/printer.cfg
```

Open it and replace the serial port with yours (from Step 9):

```bash
nano ~/printer_data/config/printer.cfg
```

Find the `serial:` line in the `[mcu]` section and replace it with your path.

Save and start Klipper:

```bash
sudo systemctl start klipper
sudo systemctl status klipper
```

Klipper should now show `Active: active (running)`.

### Step 11: Connect OctoPrint to Klipper

Open `http://raspberrypi.local:5000` in your browser.

Go to Settings → Serial Connection:

- **Serial Port:** `/tmp/printer` (this is a Unix socket created by Klipper, not the USB port)
- **Baudrate:** `250000`

Click Connect in the main interface. If everything is correct, the printer connects and you'll see temperatures.

### Step 12: Install OctoPrint Plugins

```bash
source ~/oprint/bin/activate

# OctoTelegram — Telegram control
pip install https://github.com/fabianonline/OctoPrint-Telegram/archive/stable.zip

# PSU Control — GPIO power control
pip install "https://github.com/kantlivelong/OctoPrint-PSUControl/archive/master.zip"

# SlicerEstimator — accurate time from slicer data
pip install https://github.com/NillerMedDild/Octoprint-SlicerEstimator/archive/master.zip

# UI Customizer — dark theme
pip install https://github.com/LazeMSS/OctoPrint-UICustomizer/archive/main.zip

# OctoEverywhere — remote access + AI defect detection
pip install https://github.com/QuinnDamerell/OctoPrint-OctoEverywhere/archive/main.zip

# PrintWatch — alternative AI defect detector
pip install https://github.com/printpal-io/OctoPrint-PrintWatch/archive/main.zip

# Bit-Bang SPI — additional GPIO control
pip install https://github.com/RoboMagus/OctoPrint-Bit-Bang/archive/main.zip

deactivate

# Restart OctoPrint to load plugins
sudo systemctl restart octoprint
```

### Step 13: Configure the Telegram Bot

#### Create a bot via BotFather

1. Open Telegram and find [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. BotFather asks for a display name — e.g. `My Printer`
4. Then asks for a username (must end in `bot`) — e.g. `my_printer_3d_bot`
5. BotFather sends a token like: `7123456789:AAHdqTcvCH1vGWJxfSeofSs0K8F_LLL`

**Save this token** — it's needed for plugin configuration.

#### Configure the OctoTelegram plugin

In OctoPrint → Settings → Telegram:

1. Paste the token into the **Telegram Token** field
2. Click **Save**
3. Open Telegram, find your bot by username, send `/start`
4. Return to OctoPrint → Settings → Telegram — your account appears in the **Users** section
5. Click on your account and grant **all permissions** (Admin/Full Access)
6. Configure notifications:
   - **Notify on print done:** ✓
   - **Notify on print failed:** ✓
   - **Notify on print started:** ✓
   - **Notify on print cancelled:** ✓
   - **Notify on firmware error:** ✓
   - **Notify on OctoPrint startup:** ✓
   - **Send image with every notification:** ✓
   - **Height (mm) between snapshots:** `2` — photo every 2 mm Z-height
7. Click **Save**

Now send `/status` to the bot — it should reply with a photo of the current printer state.

---

## Klipper — Printer Configuration

### What Klipper Is and Why You Need It

The stock Ender 5 S1 firmware is **Marlin**. It runs entirely on the STM32F401 (printer MCU). The MCU has limited computational resources, so Marlin can't perform complex real-time calculations.

**Klipper** moves the main computations to the Raspberry Pi, which is 10+ times more powerful than the MCU. This provides:

- **Input Shaping (Resonance Compensation)** — the Pi analyzes the printer's resonance frequencies and compensates for vibrations. Allows printing faster without "ghosting" (ringing) on part corners
- **Pressure Advance** — dynamic extruder pressure control during acceleration/deceleration. Corners are sharp without blobs
- **Smooth Pressure Advance** — smooths pressure spikes
- **Live Config** — change any parameter in `printer.cfg` and run `FIRMWARE_RESTART` — no recompiling or reflashing
- **Precise control** — the Pi can compute steps with microsecond accuracy

### Full printer.cfg for Ender 5 S1

The file is located at `klipper/printer.cfg`. Here is its full content with explanations for every section.

```ini
# printer.cfg for Creality Ender 5 S1
# Klipper configuration

# ═══════════════════════════════════════════════
# MCU — Micro-Controller Unit (STM32F401)
# ═══════════════════════════════════════════════
[mcu]
# Path to the printer's serial port
# Find it with: ls /dev/serial/by-id/
serial: /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0
# If not found, try:
# serial: /dev/ttyUSB0
# or: serial: /dev/ttyACM0

# ═══════════════════════════════════════════════
# PRINTER — core kinematics parameters
# ═══════════════════════════════════════════════
[printer]
kinematics: cartesian          # Kinematics type — Cartesian (Ender 5 S1 is Cartesian)
max_velocity: 300              # Maximum print speed, mm/s
max_accel: 3000                # Maximum acceleration, mm/s²
max_z_velocity: 5              # Maximum Z speed, mm/s (slow — for precision)
max_z_accel: 100               # Z acceleration
square_corner_velocity: 5.0   # Corner speed (reduce to 1 for Input Shaping tuning)

# ═══════════════════════════════════════════════
# STEPPER X — X axis
# ═══════════════════════════════════════════════
[stepper_x]
step_pin: PC2                  # Step pin for X motor on the board
dir_pin: PB9                   # Direction pin
enable_pin: !PC3               # Enable pin (! = inverted — active LOW)
microsteps: 16                 # Microstepping
rotation_distance: 40          # mm per revolution (GT2 pulley 20 teeth: 20*2=40)
endstop_pin: ^PA5              # X endstop pin (^ = pullup to power)
position_endstop: 0            # Endstop position = 0 mm
position_max: 220              # Maximum X position = 220 mm (work area)
homing_speed: 50               # Homing speed, mm/s

# ═══════════════════════════════════════════════
# STEPPER Y — Y axis
# ═══════════════════════════════════════════════
[stepper_y]
step_pin: PB8
dir_pin: PB7
enable_pin: !PC3
microsteps: 16
rotation_distance: 40
endstop_pin: ^PA6
position_endstop: 0
position_max: 220
homing_speed: 50

# ═══════════════════════════════════════════════
# STEPPER Z — Z axis (vertical)
# ═══════════════════════════════════════════════
[stepper_z]
step_pin: PB6
dir_pin: !PB5              # ! means direction is inverted
enable_pin: !PC3
microsteps: 16
rotation_distance: 8       # For M8 lead screw with 8 mm/rev pitch
# Z endstop not used — using CR Touch (probe) instead
endstop_pin: probe:z_virtual_endstop
position_min: -5           # Allow slight negative travel for z-offset
position_max: 280          # Ender 5 S1 work area height = 280 mm
homing_speed: 4            # Slow — for precision

# ═══════════════════════════════════════════════
# EXTRUDER — Sprite Pro direct drive extruder
# ═══════════════════════════════════════════════
[extruder]
step_pin: PB4
dir_pin: PB3
enable_pin: !PC3
microsteps: 16
# rotation_distance must be calibrated (E-steps calibration)
# Standard value for Sprite Pro ≈ 7.5
# Replace this value after calibration
rotation_distance: 7.5
nozzle_diameter: 0.400     # Nozzle diameter — standard 0.4 mm
filament_diameter: 1.750   # Filament diameter
heater_pin: PA1            # Hotend heater pin
sensor_type: EPCOS 100K B57560G104F  # Thermistor type (Creality standard)
sensor_pin: PC5            # Analog thermistor pin
# PID coefficients — MUST be calibrated with PID_CALIBRATE
control: pid
pid_Kp: 21.527
pid_Ki: 1.063
pid_Kd: 108.982
min_temp: 0                # Minimum temperature for heater operation
max_temp: 300              # Maximum temperature
min_extrude_temp: 170      # Can't extrude until this temperature is reached
max_extrude_only_distance: 500  # Maximum retract length (for filament loading)
pressure_advance: 0.0      # Pressure Advance — set after calibration
pressure_advance_smooth_time: 0.040

# ═══════════════════════════════════════════════
# HEATER BED — heated bed
# ═══════════════════════════════════════════════
[heater_bed]
heater_pin: PA15
sensor_type: EPCOS 100K B57560G104F
sensor_pin: PC4
# Bed PID coefficients — MUST be calibrated
control: pid
pid_Kp: 54.027
pid_Ki: 0.770
pid_Kd: 948.182
min_temp: 0
max_temp: 120

# ═══════════════════════════════════════════════
# FAN — fans
# ═══════════════════════════════════════════════
[fan]
# Part cooling fan
pin: PA0

[heater_fan hotend_fan]
# Hotend fan — turns on when hotend > 50°C
pin: PC0
heater: extruder
heater_temp: 50.0

# ═══════════════════════════════════════════════
# CR TOUCH (BLTouch compatible) — bed level sensor
# ═══════════════════════════════════════════════
[bltouch]
sensor_pin: ^PC14          # Signal pin from sensor (^ = pullup)
control_pin: PC13          # Servo control pin
# Sensor offset relative to nozzle (measure physically)
# x_offset: positive = sensor is to the right of nozzle
# y_offset: positive = sensor is further back (toward rear wall)
x_offset: -31.8
y_offset: -40.5
z_offset: 0                # Z-offset is set with PROBE_CALIBRATE
speed: 4                   # Probe descent speed
lift_speed: 10
samples: 2                 # Number of samples per point (average)
sample_retract_dist: 5

[safe_z_home]
# Coordinates for safe Z homing (usually bed center)
home_xy_position: 141.8, 150.5   # Center + sensor offset compensation
speed: 50
z_hop: 10                         # Lift Z 10 mm before homing
z_hop_speed: 5

# ═══════════════════════════════════════════════
# BED MESH — bed flatness compensation
# ═══════════════════════════════════════════════
[bed_mesh]
speed: 120
horizontal_move_z: 5       # Height for moves between probe points
mesh_min: 18, 18           # Bottom-left corner (accounting for sensor offset)
mesh_max: 188, 179         # Top-right corner
probe_count: 5, 5          # 5×5 grid = 25 points
algorithm: bicubic         # Interpolation algorithm between points
fade_start: 0.6            # Start fading compensation
fade_end: 10               # At 10 mm height compensation is fully off

# ═══════════════════════════════════════════════
# SCREWS TILT ADJUST — bed leveling assistant
# ═══════════════════════════════════════════════
[screws_tilt_adjust]
# Coordinates of bed adjustment screws
screw1: 51.8, 69.5
screw1_name: Front Left
screw2: 221.8, 69.5
screw2_name: Front Right
screw3: 221.8, 219.5
screw3_name: Back Right
screw4: 51.8, 219.5
screw4_name: Back Left
horizontal_move_z: 10
speed: 50
screw_thread: CW-M4        # Screw thread direction for Ender 5 S1

# ═══════════════════════════════════════════════
# DISPLAY — printer display (CR-10 compatible)
# ═══════════════════════════════════════════════
[display]
lcd_type: st7920
cs_pin: PB12
sclk_pin: PB13
sid_pin: PB15
encoder_pins: ^PB14, ^PB10
click_pin: ^!PB2

# ═══════════════════════════════════════════════
# MACROS — custom G-code commands
# ═══════════════════════════════════════════════

# PAUSE — pause print, lift nozzle, park to corner
[gcode_macro PAUSE]
rename_existing: BASE_PAUSE
gcode:
    {% set E = params.E|default(1)|float %}    # Retract length on pause
    {% set x_park = printer.toolhead.axis_maximum.x|float - 5.0 %}
    {% set y_park = printer.toolhead.axis_maximum.y|float - 5.0 %}
    {% set max_z = printer.toolhead.axis_maximum.z|float %}
    {% set act_z = printer.toolhead.position.z|float %}
    {% if act_z < (max_z - 2.0) %}
        {% set z_safe = 2.0 %}
    {% else %}
        {% set z_safe = max_z - act_z %}
    {% endif %}
    BASE_PAUSE
    G91
    G1 E-{E} F2100          ; retract filament
    G1 Z{z_safe} F900       ; lift nozzle
    G90
    G1 X{x_park} Y{y_park} F6000   ; move to corner
    G91

# RESUME — continue after pause
[gcode_macro RESUME]
rename_existing: BASE_RESUME
gcode:
    {% set E = params.E|default(1)|float %}
    G91
    G1 E{E} F2100           ; re-feed filament
    G90
    BASE_RESUME

# CANCEL_PRINT — cancel print
[gcode_macro CANCEL_PRINT]
rename_existing: BASE_CANCEL_PRINT
gcode:
    G28 X Y                 ; home X and Y
    {% set max_z = printer.toolhead.axis_maximum.z|float %}
    {% set act_z = printer.toolhead.position.z|float %}
    {% if act_z < (max_z - 2.0) %}
        G91
        G1 Z2 F300
        G90
    {% endif %}
    M104 S0                 ; turn off hotend
    M140 S0                 ; turn off bed
    M106 S0                 ; turn off fan
    BASE_CANCEL_PRINT

# PREHEAT_PLA — preheat for PLA
[gcode_macro PREHEAT_PLA]
gcode:
    M117 Preheating PLA...
    M140 S60               ; bed 60°C
    M104 S210              ; hotend 210°C
    M109 S210              ; wait for hotend

# PREHEAT_PETG — preheat for PETG
[gcode_macro PREHEAT_PETG]
gcode:
    M117 Preheating PETG...
    M140 S85               ; bed 85°C
    M104 S225              ; hotend 225°C
    M109 S225              ; wait for hotend

# LOAD_FILAMENT — load filament
[gcode_macro LOAD_FILAMENT]
gcode:
    {% set speed = params.SPEED|default(300)|float %}
    G91
    G1 E50 F{speed}        ; fast feed
    G1 E30 F150            ; slow feed (extrude)
    G90

# UNLOAD_FILAMENT — unload filament
[gcode_macro UNLOAD_FILAMENT]
gcode:
    {% set speed = params.SPEED|default(300)|float %}
    G91
    G1 E10 F150            ; slight push to relieve pressure
    G1 E-80 F{speed}       ; fast retract
    G90

# START_PRINT — called by slicer at the start of each print
# In Orca Slicer add to Machine G-code → Start G-code:
# START_PRINT BED_TEMP={first_layer_bed_temperature} EXTRUDER_TEMP={first_layer_temperature}
[gcode_macro START_PRINT]
gcode:
    {% set BED_TEMP = params.BED_TEMP|default(60)|float %}
    {% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(210)|float %}
    M117 Heating...
    M140 S{BED_TEMP}
    M109 S{EXTRUDER_TEMP}
    M190 S{BED_TEMP}
    G28                    ; home all axes
    BED_MESH_CALIBRATE     ; probe bed mesh
    G1 X0 Y0 Z0.3 F5000   ; move to start position
    G92 E0                 ; reset extruder
    G1 X60 E9 F1000        ; prime line
    G1 X100 E12.5 F1000
    G92 E0
    M117 Printing...

# END_PRINT — called by slicer at end of print
[gcode_macro END_PRINT]
gcode:
    G91
    G1 E-3 F300            ; retract
    G1 Z5 F300             ; lift nozzle
    G90
    G28 X Y                ; home X and Y
    M104 S0                ; turn off hotend
    M140 S0                ; turn off bed
    M106 S0                ; turn off part fan
    M84                    ; disable motors
    M117 Print done!

# ═══════════════════════════════════════════════
# BED SCREWS — manual bed leveling
# ═══════════════════════════════════════════════
[bed_screws]
screw1: 30, 40
screw1_name: Front Left
screw2: 200, 40
screw2_name: Front Right
screw3: 200, 200
screw3_name: Back Right
screw4: 30, 200
screw4_name: Back Left

# ═══════════════════════════════════════════════
# VIRTUAL SD CARD
# Allows OctoPrint to pass G-code files to Klipper
# ═══════════════════════════════════════════════
[virtual_sdcard]
path: ~/printer_data/gcodes

# ═══════════════════════════════════════════════
# DISPLAY STATUS — display status on screen
# ═══════════════════════════════════════════════
[display_status]

# ═══════════════════════════════════════════════
# PAUSE RESUME — built-in pause support
# ═══════════════════════════════════════════════
[pause_resume]
```

### Klipper Command Reference

Enter in the OctoPrint terminal (Terminal tab):

| Command | What it does |
|---------|-------------|
| `FIRMWARE_RESTART` | Restarts Klipper (applies printer.cfg changes) |
| `G28` | Home all axes (find endstops) |
| `G28 X Y` | Home X and Y only |
| `M119` | Show endstop states (OPEN/TRIGGERED) |
| `GET_POSITION` | Current coordinates of all axes |
| `BED_MESH_CALIBRATE` | Probe bed mesh (25 points) |
| `BED_MESH_OUTPUT` | Show current mesh |
| `PROBE` | Single probe with CR Touch |
| `PROBE_CALIBRATE` | Interactive Z-offset calibration |
| `SCREWS_TILT_CALCULATE` | Calculate how much to turn each bed screw |
| `PID_CALIBRATE HEATER=extruder TARGET=225` | PID calibrate hotend |
| `PID_CALIBRATE HEATER=heater_bed TARGET=85` | PID calibrate bed |
| `SAVE_CONFIG` | Save calibration results to printer.cfg |
| `STATUS` | Printer state |
| `PREHEAT_PLA` | Preheat for PLA (60°C bed / 210°C hotend) |
| `PREHEAT_PETG` | Preheat for PETG (85°C bed / 225°C hotend) |
| `LOAD_FILAMENT` | Load filament |
| `UNLOAD_FILAMENT` | Unload filament |

---

## OctoPrint Plugins

### OctoTelegram — Telegram Printer Control

**Repository:** https://github.com/fabianonline/OctoPrint-Telegram

This is the main plugin of the entire system. It:
- Sends notifications on print start/finish/failure
- Listens to your Telegram commands
- Takes a snapshot from the camera every 2 mm Z-height and sends it with temperatures
- Allows controlling all OctoPrint functions from the chat

**Installation:**
```bash
source ~/oprint/bin/activate
pip install https://github.com/fabianonline/OctoPrint-Telegram/archive/stable.zip
deactivate
sudo systemctl restart octoprint
```

**Full configuration:**

Go to OctoPrint → Settings → Telegram:

1. **Token** — paste the BotFather token
2. Click **Save**, wait 10 seconds
3. Open the bot in Telegram, send `/start`
4. Return to settings — your account appears in the **Users** section
5. Click on it → set **Trust level: Admin**
6. In the **Notifications** section:
   - ✓ `Notify on print done`
   - ✓ `Notify on print failed`
   - ✓ `Notify on print started`
   - ✓ `Notify on print cancelled`
   - ✓ `Notify on firmware error`
   - ✓ `Notify on OctoPrint startup`
   - ✓ `Send image with every notification`
   - **Height (mm):** `2` — snapshot every 2 mm
7. Click **Save**

**Verify it works:**
Send `/status` to the bot — it should reply with a photo and temperatures.

---

### PSU Control — Printer Power Management

**Repository:** https://github.com/kantlivelong/OctoPrint-PSUControl

Controls the printer's power supply via Raspberry Pi GPIO → relay module. Enables `/on` and `/off` Telegram commands.

#### Relay Wiring Diagram

```
Raspberry Pi Zero 2 WH          5V Relay Module
┌─────────────────┐             ┌──────────────────┐
│  Pin 2 (5V)  ───┼─────────────┤ VCC              │
│  Pin 6 (GND) ───┼─────────────┤ GND              │
│  Pin 11 (GPIO17)┼─────────────┤ IN (Signal)      │
└─────────────────┘             │                  │
                                │ COM ─────────────┼──── from wall outlet (L wire)
                                │ NO ──────────────┼──── to printer (L wire)
                                └──────────────────┘
```

The neutral (N) and ground (PE) wires connect directly without going through the relay. Only the live wire (L) is interrupted.

> **Warning:** Working with 220V/110V mains is dangerous. If you're not comfortable with it — use a Sonoff smart plug instead (see below).

**Pi Zero 2 WH pinout:**

```
(3.3V)  1 ● ● 2  (5V)      ← Relay VCC here
 (SDA)  3 ● ● 4  (5V)
 (SCL)  5 ● ● 6  (GND)     ← Relay GND here
(GPIO4) 7 ● ● 8  (TX)
 (GND)  9 ● ● 10 (RX)
(GPIO17)11 ● ● 12 (GPIO18)  ← Relay Signal here
...
```

GPIO17 = Physical Pin 11 (BCM numbering).

**Plugin configuration:**

OctoPrint → Settings → PSU Control:

```
PSU Control enabled: ✓
Switching Method: GPIO
GPIO Pin (BCM): 17
Active LOW: ✓
  (most optocoupler relay modules are active LOW:
   LOW on IN = relay ON, HIGH = relay OFF)
Default PSU State on startup: OFF
```

Click Save. A power icon appears in the OctoPrint interface.

Test it: click ON in OctoPrint — the relay should click. Send `/on` to the bot — same result.

#### Alternative — Sonoff Smart Plug (no soldering required)

1. Buy a **Sonoff S26** (plug adapter) or **Sonoff Basic R2** (inline)
2. Plug the printer into the Sonoff
3. Install the **eWeLink** app, create an account
4. Add Sonoff to eWeLink following the box instructions
5. Verify you can toggle it from the app

Install the plugin:

```bash
source ~/oprint/bin/activate
pip install "https://github.com/airens/OctoPrint-PSUControl-eWeLink/archive/master.zip"
deactivate
sudo systemctl restart octoprint
```

OctoPrint → Settings → PSU Control eWeLink:
- **Username:** your eWeLink email
- **Password:** your eWeLink password
- Click Save — the plugin loads your device list
- **Device:** select your Sonoff

---

### OctoEverywhere — Remote Access + AI Defect Detection

**Site:** https://octoeverywhere.com

**⭐ Strongly recommended** for two reasons:

1. **Remote access** — encrypted tunnel to OctoPrint from anywhere without port forwarding or VPN
2. **Gadget AI** — built-in AI print failure detector. Analyzes camera frames in real time and detects: spaghetti failures, detachment from bed, layer shifts. Can automatically pause or cancel the print on detection.

**Free tier:** 1 printer, basic Gadget

**Installation:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/QuinnDamerell/OctoPrint-OctoEverywhere/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

**Setup:**

1. OctoPrint → Settings → OctoEverywhere → copy the registration link
2. Open the link, create an account
3. The printer automatically binds to your account
4. Enable **Gadget** in OctoEverywhere settings on the website
5. Configure notifications — Gadget will send a Telegram alert on defect detection

After registration you get a personal link like `https://xxx.octoeverywhere.com` — full OctoPrint access from anywhere in the world.

---

### PrintWatch — Alternative AI Defect Detector

**Repository:** https://github.com/printpal-io/OctoPrint-PrintWatch

Alternative to OctoEverywhere Gadget for those who don't want to use OctoEverywhere for remote access but still want AI monitoring.

> **Use one, not both:** OctoEverywhere Gadget **or** PrintWatch. Two AI services running in parallel add unnecessary load and there's no benefit to duplication.

**Installation:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/printpal-io/OctoPrint-PrintWatch/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

**Setup:**

1. Register at https://www.printpal.io — get an API key (free tier available)
2. OctoPrint → Settings → PrintWatch → paste API key
3. Set detection sensitivity threshold (default 50%)
4. Choose action on detection: `Pause` or `Cancel`

---

### Obico — Open-Source AI Detector with Self-Hosting

**Repository:** https://github.com/TheSpaghettiDetective/obico-server  
**OctoPrint plugin:** https://github.com/TheSpaghettiDetective/OctoPrint-Obico

Obico (formerly The Spaghetti Detective) is the only fully open-source AI print failure detector. Licensed under AGPL v3. The algorithm has detected over 800,000 failed prints across the global community.

**Key advantage:** When self-hosted, runs completely locally, free of charge, with unlimited printers and all Pro features at no subscription cost.

**How it works:**

Obico runs as a separate server (can run on the same Pi or another machine). The OctoPrint plugin connects to this server. The server receives camera frames every 30–60 seconds, runs them through the neural network, and when confidence exceeds the threshold over several consecutive frames — pauses or cancels the print.

```
Printer + camera → OctoPrint → Obico plugin → Obico server → AI model → Pause/Notify
```

**Deployment options:**

| Option | Cost | Where AI runs |
|--------|------|---------------|
| Obico Cloud | Free 1 printer / $4/mo Pro | Obico's servers |
| Self-hosted (recommended) | Free | Locally on your hardware |

**Install Obico server (self-hosted):**

```bash
# On a separate machine (Pi 3B+/4, PC, VPS) with Docker
cd ~
git clone https://github.com/TheSpaghettiDetective/obico-server.git
cd obico-server
docker-compose up -d
```

Or keep OctoPrint+Klipper on your Pi and run the Obico server on a VPS or home PC.

**Install OctoPrint plugin:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/TheSpaghettiDetective/OctoPrint-Obico/archive/master.zip
deactivate
sudo systemctl restart octoprint
```

**Connect to your server:**

OctoPrint → Settings → Obico:
- **Server address:** `http://your-server:3334`
- Click **Link OctoPrint** — get a code
- Enter the code in your Obico server → printer added
- **AI Failure Detection:** enable, select **Pause on detection**
- **Notification channels:** Telegram or email

> **Obico vs OctoEverywhere vs PrintWatch:**  
> — Obico self-hosted: free, local, open source — best choice if you have a second machine  
> — OctoEverywhere Gadget: convenient, cloud, paid for multiple printers  
> — PrintWatch: requires API key from their service, not fully offline

---

### SlicerEstimator — Accurate Print Time

**Repository:** https://github.com/NillerMedDild/Octoprint-SlicerEstimator

OctoPrint calculates print time on its own, but inaccurately — it doesn't know the actual speeds from the slicer. SlicerEstimator reads `M73 P[progress]` commands embedded in G-code by the slicer and displays the slicer's own time estimate.

**Installation:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/NillerMedDild/Octoprint-SlicerEstimator/archive/master.zip
deactivate
sudo systemctl restart octoprint
```

**Setup in Orca Slicer:**

Orca Slicer → Printer Settings → Machine G-code → Layer change G-code, add:

```gcode
M73 P[layer_num]
```

G-code files will now contain progress data and SlicerEstimator will show accurate time.

**Plugin configuration:**

OctoPrint → Settings → SlicerEstimator:
- **Slicer:** Orca Slicer / Bambu Studio
- **Use M73 progress:** ✓

---

### UI Customizer — Dark Theme for OctoPrint

**Repository:** https://github.com/LazeMSS/OctoPrint-UICustomizer

Changes OctoPrint's appearance: dark theme, rearrange panels, hide unnecessary elements.

**Installation:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/LazeMSS/OctoPrint-UICustomizer/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

**Setup:**

OctoPrint → Settings → UI Customizer → Theme: Dark → customize layout by dragging panels.

---

### Bit-Bang SPI — Additional GPIO Control

**Repository:** https://github.com/RoboMagus/OctoPrint-Bit-Bang

Plugin for controlling additional GPIO pins on the Pi directly from OctoPrint. Useful for controlling multiple relays or other hardware.

**Installation:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/RoboMagus/OctoPrint-Bit-Bang/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

---

## Telegram Bot

### How the Bot Responds to Printer Events

The bot works through the OctoTelegram plugin. When OctoPrint receives an event from Klipper, the plugin creates a message and sends it to Telegram.

**On OctoPrint startup:**
```
🚀 Hello. I'm online and ready to receive your commands.
```

**On OctoPrint shutdown:**
```
🐙 💤 Shutting down. Goodbye.
```

**When printer connects:**
```
🔗 Printer Connected
```

**When printer disconnects (power lost, cable):**
```
💔 Printer Disconnected
```

**On printer error:**
```
⚠ ⚠ ⚠Printer Error {error message}
```

**When print starts** — photo with caption:
```
Started printing CE5S1_Dachshund.stl single colour.gcode.
```

**When print finishes** — photo:
```
Finished printing CE5S1_Dachshund.stl single colour.gcode.
```

**Every 2 mm Z-height** — automatic photo with data:
```
Printing at Z=3.2.
Bed 86.39/86.0, Extruder 225.03/225.0.
00:31:11, 25% done, 00:40:26 remaining.
Completed time 15:41:14.
```

**On G28 homing command:**
```
🏠 Printer received home command 
Bed 86.46/86.0, Extruder 224.67/225.0
```

### Bot Responses to Commands

**`/on`** — bot asks for confirmation:
```
❓ Turn on the Printer?
[✅ Yes]  [❌ No]
```
After confirmation:
```
✅ Command executed.
```
If printer is already on:
```
⚠Printer has already been turned on.
```

**`/off`:**
```
✅ Shutdown Command executed.
```
If already off:
```
⚠Printer has already been turned off.
```

**`/upload`:**
```
ℹ To upload a gcode file (also accept zip file), just send it to me.
The file will be stored in 'TelegramPlugin' folder.
```
After sending a file:
```
📥 I've successfully saved the file you sent me as TelegramPlugin/filename.gcode.
```

**`/print`** (no files):
```
Maybe next time.
```
**`/print`** (after file upload):
```
🚀 Started the print job.
```

**Unknown command:**
```
I do not understand you! 😖
```

### Temperature Profiles (from real use)

| Material | Bed | Extruder |
|----------|-----|----------|
| PLA | 60°C | 210°C |
| PETG | 85–86°C | 224–225°C |

---

## Bot Commands

Full command list with exact descriptions as in OctoTelegram:

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
| `/gcode` | Send arbitrary G-code command |

### What Each Command Does in Detail

**`/status`** — sends a camera photo with current state:
- Bed and hotend temperatures (actual/target)
- Print progress in percent
- Time remaining
- File name

**`/ctrl`** — opens control menu:
- Home (homing)
- Motors Off
- Fan On/Off

**`/tune`** — settings during print:
- Flowrate (%) — material feed multiplier
- Feedrate (%) — speed multiplier
- Hotend and bed temperatures

**`/sys`** — system information:
- Raspberry Pi CPU temperature
- CPU load
- RAM usage
- Uptime

**`/gif`** — takes 20 snapshots with pauses between them and assembles an animated GIF. Takes ~30 seconds.

**`/supergif`** — same but 60 frames. Takes ~2 minutes. For longer processes.

**`/filament`** — shows data about the current file: how much material is needed (in grams and meters, if the slicer embedded this data in G-code).

---

## Camera

### Option 1: Logitech USB Camera (mjpg-streamer)

mjpg-streamer captures video from a USB camera and streams it over HTTP. OctoPrint connects to it and takes snapshots for Telegram.

#### Install mjpg-streamer

```bash
# Dependencies
sudo apt install -y cmake libjpeg62-turbo-dev libv4l-dev

# Clone sources
cd ~
git clone https://github.com/jacksonliam/mjpg-streamer.git

# Compile
cd mjpg-streamer/mjpg-streamer-experimental
make

# Install
sudo make install
```

#### Verify the camera is detected

```bash
# List video devices
v4l2-ctl --list-devices

# Should show something like:
# Logitech HD Webcam C270 (usb-...):
#         /dev/video0

# Check supported resolutions
v4l2-ctl -d /dev/video0 --list-formats-ext
```

#### Test mjpg-streamer manually

```bash
mjpg_streamer \
  -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" \
  -o "output_http.so -p 8080 -w /usr/local/share/mjpg-streamer/www"
```

Parameters:
- `-d /dev/video0` — camera device
- `-r 640x480` — resolution (can use 1280x720 if camera supports it, but adds load on Zero 2)
- `-f 15` — FPS (15 frames/sec — reasonable balance for Zero 2)
- `-p 8080` — HTTP server port

Open in browser: `http://raspberrypi.local:8080/?action=stream` — you should see the stream.

Stop with: Ctrl+C.

#### Autostart mjpg-streamer via systemd

```bash
sudo nano /etc/systemd/system/webcam.service
```

```ini
[Unit]
Description=mjpg-streamer webcam streaming
After=network.target

[Service]
User=pi
ExecStart=/usr/local/bin/mjpg_streamer \
  -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" \
  -o "output_http.so -p 8080 -w /usr/local/share/mjpg-streamer/www"
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable webcam
sudo systemctl start webcam
sudo systemctl status webcam
```

#### Configure camera in OctoPrint

OctoPrint → Settings → Webcam & Timelapse:

- **Stream URL:** `http://127.0.0.1:8080/?action=stream`
- **Snapshot URL:** `http://127.0.0.1:8080/?action=snapshot`
- **Webcam enabled:** ✓
- **Rotate 90°:** check if image is upside down

Click Save. A camera tab appears in the OctoPrint main interface.

---

### Option 2: Raspberry Pi Camera Module (camera-streamer)

For Pi Camera (CSI ribbon cable, not USB), you need `camera-streamer` which works with libcamera.

#### Enable camera in Raspberry Pi OS

```bash
sudo raspi-config
```

Go to: `Interface Options` → `Legacy Camera` → `Enable` (for older Camera Module v1/v2).

For Camera Module 3 or HQ Camera, legacy mode is not needed — libcamera works directly.

```bash
sudo reboot
```

#### Install camera-streamer

```bash
# libcamera dependencies
sudo apt install -y \
  libcamera-dev \
  liblivemedia-dev \
  libboost-dev \
  libssl-dev \
  pkg-config

# Clone and compile
cd ~
git clone https://github.com/ayufan/camera-streamer.git
cd camera-streamer
make

sudo make install
```

#### Test run

```bash
# For Pi Camera Module v2 (IMX219)
camera-streamer \
  --camera-path=/base/soc/i2c0mux/i2c@1/imx219@10 \
  --camera-type=libcamera \
  --http-port=8080

# If you don't know the path, find it:
cam --list-cameras
```

#### Systemd service for Pi Camera

```bash
sudo nano /etc/systemd/system/webcam.service
```

```ini
[Unit]
Description=camera-streamer Pi Camera
After=network.target

[Service]
User=pi
ExecStart=/usr/local/bin/camera-streamer \
  --camera-path=/base/soc/i2c0mux/i2c@1/imx219@10 \
  --camera-type=libcamera \
  --http-port=8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable webcam
sudo systemctl start webcam
```

Stream URL: `http://raspberrypi.local:8080/?action=stream`

---

## Power Control

### Setup 1: GPIO Relay (Original)

#### How it works

Raspberry Pi GPIO pins are digital outputs that can output 3.3V (HIGH) or 0V (LOW). The relay module monitors this pin and opens/closes the 220V circuit.

```
┌──────────────────────────────────────────────────────────────┐
│                      5V Relay Module                         │
│  ┌────────────────┐                    ┌──────────────────┐  │
│  │   Optocoupler  │                    │    Relay         │  │
│  │  VCC ← 5V Pi  │                    │  COM ─── Wall    │  │
│  │  GND ← GND Pi │──[Transistor]──────│  NO  ─── Printer │  │
│  │  IN  ← GPIO17 │                    │  NC  ─── (unused)│  │
│  └────────────────┘                    └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**COM** (Common) — relay common terminal  
**NO** (Normally Open) — open when relay is off → we use this  
**NC** (Normally Closed) — closed when relay is off → unused

Connect the live wire (L) from wall outlet to COM, from NO to printer. When relay activates, circuit closes — printer gets power.

**Pi Zero 2 WH pinout (top view):**

```
                   USB  HDMI
                    ┌──┬──┐
              3.3V  1 ○ ○ 2  5V   ← Relay VCC here
               SDA  3 ○ ○ 4  5V
               SCL  5 ○ ○ 6  GND  ← Relay GND here
             GPIO4  7 ○ ○ 8  TX
               GND  9 ○ ○ 10 RX
           GPIO17  11 ○ ○ 12 GPIO18  ← Relay Signal here
           GPIO27  13 ○ ○ 14 GND
...
```

GPIO17 = Physical Pin 11 (BCM numbering).

> Full 40-pin diagram:

![Raspberry Pi Zero 2 WH GPIO Pinout](https://pinout-ai.s3.eu-west-2.amazonaws.com/raspberry-pi-zero-2w.png)

**OctoPrint PSU Control configuration:**

OctoPrint → Settings → PSU Control:

```
PSU Control enabled: ✓
Switching Method: GPIO
GPIO Pin (BCM): 17
Active LOW: ✓
  (most optocoupler relay modules are active LOW:
   LOW on IN = relay ON, HIGH = relay OFF)
Default PSU State on startup: OFF
```

Click Save. Test: click ON in OctoPrint — relay should click. Send `/on` to bot — same result.

---

### Setup 2: Sonoff Smart Plug (No Soldering)

For those who don't want to work with mains wiring.

#### What to buy

- **Sonoff S26** (plug adapter) — easiest, just plug in
- **Sonoff Basic R2** — wires into cable break, requires wire connections but no mains wiring

#### Setup

1. Install the **eWeLink** app (iOS/Android), create an account
2. Add Sonoff to eWeLink following the box instructions (usually hold button until LED blinks)
3. Verify you can toggle it from the app

**PSU Control eWeLink plugin:**

```bash
source ~/oprint/bin/activate
pip install "https://github.com/airens/OctoPrint-PSUControl-eWeLink/archive/master.zip"
deactivate
sudo systemctl restart octoprint
```

OctoPrint → Settings → PSU Control eWeLink:
- **Username:** eWeLink email
- **Password:** eWeLink password
- Click Save — plugin loads device list
- **Device:** select your Sonoff

---

### HAProxy — Optional (Single URL Without Ports)

By default:
- OctoPrint: `http://raspberrypi.local:5000`
- Camera: `http://raspberrypi.local:8080`

With HAProxy on port 80:
- OctoPrint: `http://raspberrypi.local/`
- Camera: `http://raspberrypi.local/webcam/`

> **On Pi Zero 2 WH, HAProxy adds load**. Not recommended — direct ports work identically.

If you want it anyway:

```bash
sudo nano /etc/haproxy/haproxy.cfg
```

```
global
    maxconn 4096
    user haproxy
    group haproxy

defaults
    mode http
    timeout connect 5s
    timeout client 5s
    timeout server 5s

frontend octoprint_front
    bind *:80
    acl is_webcam path_beg /webcam/
    use_backend webcam_back if is_webcam
    default_backend octoprint_back

backend octoprint_back
    server octoprint 127.0.0.1:5000

backend webcam_back
    reqrep ^([^\ :]*)\ /webcam/(.*) \1\ /\2
    server webcam 127.0.0.1:8080
```

```bash
sudo systemctl enable haproxy
sudo systemctl restart haproxy
```

---

## Calibrations

Calibrations are done once after initial setup. Results are saved to `printer.cfg` and applied automatically.

### Orca Slicer — Slicer Setup

Orca Slicer is the main slicer. Download from https://github.com/SoftFever/OrcaSlicer/releases

On first launch:
- Click `+` in the Printer section
- Find **Creality Ender 5 S1** — Orca Slicer has a ready profile
- Select material profiles: PLA and PETG

**Klipper integration:**

Printer Settings → Machine G-code:

**Start G-code:**
```gcode
START_PRINT BED_TEMP={first_layer_bed_temperature[0]} EXTRUDER_TEMP={first_layer_temperature[0]}
```

**End G-code:**
```gcode
END_PRINT
```

**Layer change G-code** (for SlicerEstimator):
```gcode
M73 P{layer_num}
```

> **Alternative:** Creality Print (native slicer with CE5S1 profile built-in) — simpler but less flexible than Orca Slicer.

---

### PID Tuning — Hotend

PID is the temperature control algorithm. Without calibration the temperature will fluctuate instead of holding steady.

Do this when:
- First setup
- Replacing hotend or thermistor
- Replacing fan

```gcode
# In the OctoPrint terminal, enter one command at a time

# Calibrate for PETG (225°C)
PID_CALIBRATE HEATER=extruder TARGET=225

# Wait ~5 minutes for the process to complete
# You'll see: PID parameters: pid_Kp=... pid_Ki=... pid_Kd=...

# Calibrate for PLA (210°C)
PID_CALIBRATE HEATER=extruder TARGET=210

# Save results to printer.cfg
SAVE_CONFIG
```

After `SAVE_CONFIG` Klipper restarts and stores the new PID coefficients.

---

### PID Tuning — Bed

```gcode
# Calibrate for PETG (85°C)
PID_CALIBRATE HEATER=heater_bed TARGET=85

# Wait ~10 minutes
# Save
SAVE_CONFIG
```

---

### E-Steps — Extruder Feed Calibration

E-steps determine how many mm of filament is actually delivered per motor step. Without calibration the printer will under- or over-extrude.

```bash
# 1. Heat hotend to working temperature
PREHEAT_PETG
# or
PREHEAT_PLA

# 2. Load filament if not loaded

# 3. Mark 120 mm from the extruder inlet with a marker

# 4. Switch to relative coordinates
G91
M83

# 5. Command 100 mm of extrusion
G1 E100 F50

# 6. Measure how much was actually extruded
# If 25 mm remain to the mark — actual extrusion = 95 mm

# 7. Calculate new rotation_distance:
# new = old * commanded / actual
# new = 7.5 * 100 / 95 = 7.89

# 8. Replace rotation_distance in [extruder] in printer.cfg
# Then:
FIRMWARE_RESTART
```

---

### Z-Offset — Nozzle-to-Bed Distance

Z-Offset is the distance between the nozzle and bed when CR Touch triggers. Must be set precisely — too high = poor adhesion, too low = nozzle scratches the bed.

```gcode
# 1. Home all axes
G28

# 2. Start calibration
PROBE_CALIBRATE

# The printer moves to bed center and lowers the nozzle

# 3. Use the paper test:
# Place a regular sheet of paper under the nozzle
# Enter commands until the paper just barely drags:
TESTZ Z=-0.1    # lower 0.1 mm
TESTZ Z=-0.05   # lower 0.05 mm
TESTZ Z=+0.05   # raise 0.05 mm
# When the paper slightly catches — that's the correct distance

# 4. Accept result
ACCEPT

# 5. Save
SAVE_CONFIG
```

---

### Bed Mesh — Bed Leveling Grid

Probes the bed height at 25 points (5×5 grid) and automatically compensates for unevenness during printing.

```gcode
# 1. Heat bed to working temperature (mesh changes with temperature!)
M190 S85   # for PETG
# or
M190 S60   # for PLA

# 2. Home
G28

# 3. Probe mesh
BED_MESH_CALIBRATE

# Takes ~5 minutes — printer probes 25 points

# 4. Save
SAVE_CONFIG

# 5. View result
BED_MESH_OUTPUT
```

After `SAVE_CONFIG` the mesh is applied automatically on every print.

---

### Screws Tilt Adjust — Manual Bed Leveling

If the Bed Mesh shows large deviations (>1.5 mm) — physically level the bed with the screws first.

```gcode
G28
SCREWS_TILT_CALCULATE
```

The printer calculates and tells you how many turns and which direction for each screw:

```
01:Front Left : x=51.8, y=69.5 --> adjust CCW 00:22
02:Front Right: x=221.8, y=69.5 --> adjust CW 00:05
...
```

CW = clockwise = raise that corner  
CCW = counter-clockwise = lower that corner  
Format `MM:SS` = turns:fractions (00:22 = quarter turn)

Repeat `G28` + `SCREWS_TILT_CALCULATE` until deviation ≤0.3 mm.

---

### Pressure Advance — Extruder Pressure Compensation

Compensates for extruder lag during acceleration and deceleration. Corners become sharp and clean.

```gcode
# 1. Heat
PREHEAT_PETG

# 2. Home
G28

# 3. Setup for test
SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=1 ACCEL=500

# 4. Run calibration tower (prints a tower with increasing PA)
TUNING_TOWER COMMAND=SET_PRESSURE_ADVANCE PARAMETER=ADVANCE START=0 FACTOR=.005

# 5. Print a test part (download from Klipper documentation)

# 6. Find the layer with the best corners, measure its height (mm)
# Calculate: pressure_advance = START + height * FACTOR
# Example: optimal layer at 12 mm → PA = 0 + 12 * 0.005 = 0.060

# 7. Set in printer.cfg under [extruder]:
# pressure_advance: 0.060

# 8. Apply
FIRMWARE_RESTART
```

---

### Input Shaper — ADXL345 Accelerometer

Input Shaper is a Klipper feature that measures resonant frequencies of the printer and automatically compensates for them. The result: no more "ghosting" (ringing artifacts on corners) even at high print speeds (150+ mm/s).

**Requires:** ADXL345 accelerometer (~$3) connected via SPI to Raspberry Pi.

#### Wiring ADXL345 → Raspberry Pi Zero 2 WH

| ADXL345 Pin | RPi Pin | Name              |
|-------------|---------|-------------------|
| VCC (3.3V)  | Pin 1   | 3.3V DC           |
| GND         | Pin 6   | GND               |
| CS          | Pin 24  | GPIO8 (SPI0_CE0)  |
| SDO (MISO)  | Pin 21  | GPIO9 (SPI0_MISO) |
| SDA (MOSI)  | Pin 19  | GPIO10 (SPI0_MOSI)|
| SCL (SCLK)  | Pin 23  | GPIO11 (SPI0_SCLK)|

![Raspberry Pi Zero 2 WH GPIO Pinout](https://pinout-ai.s3.eu-west-2.amazonaws.com/raspberry-pi-zero-2w.png)

#### 1. Enable SPI

```bash
sudo raspi-config
# Interface Options → SPI → Yes → Finish
sudo reboot
```

#### 2. Install numpy and klipper_host_mcu

```bash
# numpy (required for resonance data processing)
~/klippy-env/bin/pip install numpy

# Compile and install klipper host MCU
cd ~/klipper
make menuconfig
# Select: Linux process
make
sudo make install

sudo systemctl enable klipper-mcu
sudo systemctl start klipper-mcu
```

#### 3. Add to printer.cfg

```ini
[mcu rpi]
serial: /tmp/klipper_host_mcu

[adxl345]
cs_pin: rpi:None

[resonance_tester]
accel_chip: adxl345
probe_points:
    110, 110, 20  # center of your bed
```

After editing: `FIRMWARE_RESTART`

#### 4. Verify Connection

In OctoPrint terminal or Mainsail:

```
ACCELEROMETER_QUERY
```

Expected output:
```
adxl345 values (x, y, z): 470.719200, 941.438400, 9728.095200
```

If you see values — the accelerometer is working correctly.

#### 5. Run Calibration

```
SHAPER_CALIBRATE
```

The printer will tap X and Y axes in turn. Example output:

```
Fitted shaper 'zv' frequency = 34.4 Hz (vibrations = 4.0%, smoothing ~= 0.132)
Fitted shaper 'mzv' frequency = 28.6 Hz (vibrations = 0.0%, smoothing ~= 0.170)
Fitted shaper 'ei' frequency = 34.4 Hz (vibrations = 0.0%, smoothing ~= 0.191)
Recommended shaper is mzv @ 28.6 Hz
```

Save the result:

```
SAVE_CONFIG
```

Klipper will automatically add to printer.cfg:

```ini
[input_shaper]
shaper_freq_x: 28.6
shaper_type_x: mzv
shaper_freq_y: 34.2
shaper_type_y: mzv
```

#### Shaper Types

| Type     | Description                                     | Best for                              |
|----------|-------------------------------------------------|---------------------------------------|
| zv       | Zero Vibration — simplest, minimal smoothing    | Stiff frames, fast printers           |
| mzv      | Modified ZV — good balance (recommended)        | Most printers                         |
| ei       | Extra Insensitive — strong compensation         | High-resonance printers               |
| 2hump_ei | Double hump — maximum compensation              | Very wobbly frames, Bed Slingers      |

> After calibration you can safely increase speed to 150–200 mm/s in slicer without ringing artifacts.

---

### Calibration Resources

- **[k3d.tech/calibrations](https://k3d.tech/calibrations/)** — detailed Klipper calibration guides
- **[Klipper Config Reference](https://www.klipper3d.org/Config_Reference.html)** — full documentation for all printer.cfg parameters
- **[Klipper Pressure Advance](https://www.klipper3d.org/Pressure_Advance.html)** — detailed PA tuning guide
- **[Klipper Input Shaper](https://www.klipper3d.org/Resonance_Compensation.html)** — vibration compensation setup (advanced)

---

### 3D Print Defect Reference

> Source: [3dpt.ru FAQ](https://3dpt.ru/page/faq) — images show what each problem looks like on real printed parts.

#### Print Start Issues

| Defect | Photo | Causes | Fix |
|--------|-------|--------|-----|
| **Not extruding at start** | ![](https://static.insales-cdn.com/files/1/669/1712797/original/Not-Extruding-At-Start-200.jpg) | Filament not loaded, broken at entry, stuck nozzle | Check loading, clean nozzle, add skirt in slicer to prime before printing |
| **Poor first layer adhesion** | ![](https://static.insales-cdn.com/files/1/681/1712809/original/400-Print-Not-Sticking-To-Bed.jpg) | Z-offset too high, cold bed, oily bed, wet filament | Calibrate Z-offset, clean bed with IPA, adjust bed temperature, dry filament |

#### Extrusion Issues

| Defect | Photo | Causes | Fix |
|--------|-------|--------|-----|
| **Under-extrusion** | ![](https://static.insales-cdn.com/files/1/682/1712810/original/400-Under-Extruding.jpg) | Wrong filament diameter in slicer, worn nozzle, weak drive gear tension | Measure real diameter with calipers, check nozzle, calibrate E-steps |
| **Over-extrusion** | ![](https://static.insales-cdn.com/files/1/684/1712812/original/400-Over-Extruding-400.jpg) | Diameter set too small, partial clog | Correct diameter in slicer, inspect nozzle |
| **Holes in top layers** | ![](https://static.insales-cdn.com/files/1/694/1712822/original/400-Holes-Or-Gaps-In-Top-Layers.jpg) | Too few solid top layers, low infill | Increase solid top layers (min 0.5 mm), raise infill to 30–50% |
| **Stringing (hairs)** | ![](https://static.insales-cdn.com/files/1/695/1712823/original/400-Hairs-And-Stringing.jpg) | Material too fluid during travel moves | Enable retraction (1–2 mm direct, up to 6 mm bowden), lower temp 5–10°C, tune Pressure Advance |
| **Stops mid-print** | ![](https://static.insales-cdn.com/files/1/1257/1713385/original/400-Stops-Extruding-Mid-Print.jpg) | Filament ran out, drive gear stripped, clog | Check spool, inspect drive for shavings, clean nozzle |
| **Stripped filament** | ![](https://static.insales-cdn.com/files/1/1255/1713383/original/400-Grinding-Or-Stripped-Filament.jpg) | Extruder grinding the filament — too fast or clogged | Reduce speed 50%, clean nozzle, raise temp 5°C |
| **Clogged extruder** | ![](https://static.insales-cdn.com/files/1/1256/1713384/original/400-Clogged-Extruder.jpg) | Burnt plastic, material change without cleaning, too low temp | Cold pull, cleaning needle, replace nozzle |

#### Surface Quality Issues

| Defect | Photo | Causes | Fix |
|--------|-------|--------|-----|
| **Overheating** | ![](https://static.insales-cdn.com/files/1/696/1712824/original/400-Over-Heating.jpg) | Insufficient cooling between layers | Lower temp 5°C, reduce speed, boost fan speed, set min layer time ≥10 sec |
| **Blobs and zits** | ![](https://static.insales-cdn.com/files/1/1261/1713389/original/400-Blobs-And-Zits.jpg) | Nozzle pressure at seam start/end | Tune retraction and restart distance, enable coasting (0.2–0.5 mm), randomize seam position |
| **Weak infill** | ![](https://static.insales-cdn.com/files/1/1258/1713386/original/400-Weak-Or-Stringy-Infill.jpg) | Infill speed too high | Reduce infill speed 50%, switch pattern to Grid or Gyroid |
| **Gap between infill and wall** | ![](https://static.insales-cdn.com/files/1/1259/1713387/original/400-Gap-Between-Infill-And-Outline.jpg) | Low overlap percentage | Increase outline overlap from 20% to 30%, raise extrusion multiplier |
| **Scars on top surface** | ![](https://static.insales-cdn.com/files/1/1291/1713419/original/200-Scars-On-Top-Surface.jpg) | Nozzle drags over surface during travel | Increase Z-offset, enable nozzle lift during retraction |
| **Lines on side** | ![](https://static.insales-cdn.com/files/1/1294/1713422/original/200-Lines-On-Side-Of-Print.jpg) | Temperature fluctuations, inconsistent extrusion | Stabilize temperature with PID calibration, check consistent filament feed |
| **Gaps in floor corners** | ![](https://static.insales-cdn.com/files/1/1292/1713420/original/200-Gaps-In-Floor-Corners.jpg) | Too few top layers, weak infill | Increase solid top layers, raise infill |
| **Gaps in thin walls** | ![](https://static.insales-cdn.com/files/1/1298/1713426/original/200-Gaps-In-Thin-Walls.jpg) | Wall thickness below 2× nozzle diameter | Enable thin wall compensation in slicer, fix model geometry |

#### Mechanical Defects

| Defect | Photo | Causes | Fix |
|--------|-------|--------|-----|
| **Layer shifting** | ![](https://static.insales-cdn.com/files/1/697/1712825/original/400-Layer-Shifting.jpg) | Acceleration too high for steppers, loose belts, mechanical obstruction | Reduce acceleration, check belt tension, clear any obstacles in motion path |
| **Warping** | ![](https://static.insales-cdn.com/files/1/1241/1713369/original/200-Curling-And-Warping.jpg) | Material shrinkage during cooling | Keep bed at temperature, no fan on first layers, shield from drafts |
| **Delamination / layer splitting** | ![](https://static.insales-cdn.com/files/1/1243/1713371/original/400-Layers-Splitting-Or-Cracking.jpg) | Layers not bonding — temperature too low | Raise nozzle temp 10°C, reduce cooling, keep layer height ≤80% of nozzle diameter |
| **Ringing / ghosting** | ![](https://static.insales-cdn.com/files/1/1295/1713423/original/200-Vibrations-And-Ringing.jpg) | Print head inertia at direction changes | Tighten belts, lower acceleration and jerk, enable **Input Shaper** in Klipper — eliminates the problem entirely |

#### Material Temperature Reference (k3d.tech)

| Material | Nozzle | Bed |
|----------|--------|-----|
| PLA | 210°C | 60°C |
| PETG | 235°C | 75°C |
| ABS/ASA | 280–290°C | 110°C |
| HIPS | 270°C | 100°C |
| PC (Polycarbonate) | 280–290°C | 120°C |
| PA12 (Nylon) | 250°C | 100°C |
| ABS CF/GF | 290°C | 110°C |

> ⚠️ PTFE tube is limited to 250°C. For high-temperature materials, you need a full-metal hotend assembly.

---

## Online Slicer

Web application for viewing and slicing STL files in the browser. No software installation required — open the site, upload a model, configure settings, get G-code.

**Path in repository:** `online-slicer/`

### Tech Stack

| Part | Technologies | Purpose |
|------|-------------|---------|
| Frontend | React 19, Vite 8 | UI framework and bundler |
| 3D engine | Three.js, @react-three/fiber, @react-three/drei | 3D model rendering |
| UI library | TailwindCSS | Styling |
| Animations | Framer Motion | Smooth transitions |
| HTTP client | Axios | Backend requests |
| Backend | Node.js, Express 5 | API server |
| File upload | Multer | STL upload handling |
| Database | Mongoose (MongoDB) | History storage |

### Project Structure

```
online-slicer/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── STLViewer.jsx        # 3D model viewer in browser
│   │   │   ├── Header.jsx           # App header
│   │   │   ├── Hero.jsx             # Main screen
│   │   │   ├── Services.jsx         # Features list
│   │   │   ├── Portfolio.jsx        # Portfolio examples
│   │   │   └── CalculatorForm.jsx   # Print cost calculator
│   │   ├── pages/
│   │   │   └── Home.jsx             # Main page
│   │   ├── api/
│   │   │   ├── api.js               # Backend requests
│   │   │   └── server.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Express API server
│   ├── server.js          # Main file — all routes
│   ├── uploads/           # Uploaded STL files
│   └── package.json
│
└── print3d-app/           # Additional React application
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

### Install Dependencies

```bash
# Backend
cd online-slicer/backend
npm install

# Main frontend
cd ../frontend
npm install

# print3d-app
cd ../print3d-app
npm install
```

### Run for Development

```bash
# Terminal 1: Backend
cd online-slicer/backend
npm start
# Server running at http://localhost:3000

# Terminal 2: Frontend
cd online-slicer/frontend
npm run dev
# App at http://localhost:5173

# Terminal 3 (optional): print3d-app
cd online-slicer/print3d-app
npm run dev
# At http://localhost:5174
```

### Production Build

```bash
# Build frontend
cd online-slicer/frontend
npm run build
# Output in dist/ folder

# Backend runs directly (Node.js doesn't need building)
cd online-slicer/backend
npm start
```

### Environment Variables

Create `online-slicer/backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/slicer
UPLOAD_DIR=./uploads
```

---

## Troubleshooting

### OctoPrint Won't Start

```bash
# View logs
journalctl -u octoprint -n 100

# Common causes:

# 1. Port 5000 in use — check
ss -tlnp | grep 5000

# 2. Broken virtual environment — recreate
rm -rf ~/oprint
python3 -m venv ~/oprint
source ~/oprint/bin/activate
pip install OctoPrint
```

---

### Klipper Can't Find Printer MCU

```bash
# Check all serial ports
ls /dev/ttyUSB* /dev/ttyACM* /dev/serial/by-id/

# If nothing — cable not connected or MCU not flashed
# If present — add pi to dialout group
sudo usermod -a -G dialout pi
sudo reboot

# Verify port in printer.cfg
nano ~/printer_data/config/printer.cfg
# Find [mcu] → serial:
```

---

### Klipper: "mcu 'mcu': Unable to connect"

**Cause 1:** Wrong serial port in printer.cfg
```bash
ls /dev/serial/by-id/
# Copy exact path to [mcu] serial:
```

**Cause 2:** MCU not flashed with Klipper firmware
```bash
# Recompile and reflash (see Step 8)
cd ~/klipper
make menuconfig
make
# Copy klipper.bin to printer SD card
```

**Cause 3:** Pi not in dialout group
```bash
groups pi | grep dialout
# If no dialout:
sudo usermod -a -G dialout pi
sudo reboot
```

---

### Camera Not Working in OctoPrint

```bash
# Check camera is detected by system
ls /dev/video*
v4l2-ctl --list-devices

# Check mjpg-streamer is running
sudo systemctl status webcam

# Try running manually to see error
mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" -o "output_http.so -p 8080"

# Test stream manually
curl http://localhost:8080/?action=snapshot -o /tmp/test.jpg
ls -la /tmp/test.jpg   # if file exists — streamer works
```

Check URLs in OctoPrint Settings → Webcam:
- Stream: `http://127.0.0.1:8080/?action=stream`
- Snapshot: `http://127.0.0.1:8080/?action=snapshot`

---

### Telegram Bot Not Responding

```bash
# 1. Verify OctoPrint is running
sudo systemctl status octoprint

# 2. Check OctoPrint logs for Telegram errors
tail -f ~/.octoprint/logs/octoprint.log | grep -i telegram
```

In OctoPrint:
- Settings → Telegram → verify token is correct
- Click the Test button — bot should send a test message
- Verify your account in Users section has Admin rights

---

### Pi Zero 2 WH Overheating

```bash
# Check CPU temperature
vcgencmd measure_temp

# Above 80°C — add heatsink
# Above 85°C — Pi starts throttling (slowing down)
```

Solutions:
- Stick a copper or aluminum heatsink on the Pi chip
- Add a small 5V fan (30×30 mm)
- Make sure the Pi case is not enclosed — needs airflow

---

### Verify Everything Is Working

```bash
# All services should be active (running)
sudo systemctl status octoprint
sudo systemctl status klipper
sudo systemctl status webcam

# Pi CPU temperature
vcgencmd measure_temp

# RAM usage (on Zero 2 should have > 100 MB free)
free -h

# SD card free space
df -h /
```
