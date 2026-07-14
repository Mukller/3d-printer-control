<div align="center">

**English** • [Русский](README.md)

</div>

# 3D Printer Control 🖨️

**Full 3D printer management stack: OctoPrint + Klipper + Telegram bot + Raspberry Pi image builder**

This repository contains configs, scripts, and documentation for setting up and maintaining a home 3D printer management system on Raspberry Pi. Printer: **Creality Ender 5 S1**.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red)
![OctoPrint](https://img.shields.io/badge/OctoPrint-1.9+-orange)

---

## 🌟 What's included

- **OctoPrint** — web-based printer management interface
- **Klipper** — advanced printer firmware
- **Telegram bot** — remote control via Telegram (OctoTelegram plugin)
- **Plugin configs** — PSU Control, PrintWatch, SlicerEstimator, UI Customizer and more
- **Setup scripts** — automated fresh system configuration
- **Raspberry Pi image** — ready-to-use image (coming later)

---

## 🤖 Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/status` | Current printer status + camera photo |
| `/print` | Start printing selected file |
| `/togglepause` | Pause / resume print |
| `/abort` | Emergency stop 🆘 |
| `/files` | List available files |
| `/upload` | Upload G-code file |
| `/filament` | Filament information |
| `/ctrl` | Printer control commands |
| `/tune` | Tune settings during print |
| `/sys` | System information |
| `/con` | Connection status |
| `/settings` | Notification settings |
| `/gif` | GIF from 20 camera frames |
| `/supergif` | GIF from 60 camera frames |
| `/shutup` | Mute notifications |
| `/dontshutup` | Unmute notifications |
| `/help` | Help |

---

## 🔌 Installed OctoPrint Plugins

| Plugin | Purpose |
|--------|---------|
| [OctoTelegram](https://plugins.octoprint.org/plugins/telegram/) | Telegram bot control — **main** |
| [PSU Control eWeLink](https://plugins.octoprint.org/plugins/psucontrol_ewelink/) | Printer power control via eWeLink/Sonoff |
| [PrintWatch](https://plugins.octoprint.org/plugins/printwatch/) | AI print quality monitoring |
| [SlicerEstimator](https://plugins.octoprint.org/plugins/SlicerEstimator/) | Accurate print time estimation |
| [UI Customizer](https://plugins.octoprint.org/plugins/uicustomizer/) | OctoPrint interface customization |
| [Bit-Bang SPI](https://plugins.octoprint.org/plugins/bitbang/) | Additional GPIO control |
| OctoEverywhere | Remote access to OctoPrint from anywhere |

---

## 🌐 Online-Slicer (web module)

The [`online-slicer/`](online-slicer/) subfolder contains a separate web module — an online platform for viewing and slicing 3D models (STL) right in the browser: Node.js/Express backend + React/Three.js frontend + a standalone print app. Full docs in [online-slicer/README.md](online-slicer/README_EN.md).

---

## 🚀 Quick Start

**1. Flash Raspberry Pi OS Lite to SD card**

**2. Clone this repo on the Pi:**
```bash
git clone https://github.com/Mukller/3d-printer-control.git
cd 3d-printer-control
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
```

Full guide: [docs/SETUP.md](docs/SETUP.md)

---

## 📝 License

MIT — see [LICENSE.md](LICENSE.md)

---

## 👤 Author

**Mukller** — [GitHub](https://github.com/Mukller)
