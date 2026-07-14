# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.0.0] - 2026-07-14

### Added
- **Interactive setup script** (`scripts/setup.sh`) — asks step-by-step: printer model, serial port, Telegram token, camera type, GPIO relay, AI monitoring, ADXL345; then installs the full stack automatically
- **Backup script** (`scripts/backup.sh`) — archives printer.cfg + OctoPrint config + plugins list; optional Telegram delivery; auto-prunes old backups (keeps last 7)
- **Update script** (`scripts/update.sh`) — updates OctoPrint, all plugins, Klipper, camera services in one command
- **Health check script** (`scripts/health_check.sh`) — verifies all services (OctoPrint, Klipper, webcam, host MCU), disk space, RAM, CPU temperature; sends Telegram alert on issues; cron-ready
- **Obico docker-compose** (`docker-compose.yml`) — ready-to-use self-hosted AI defect detector (Obico / The Spaghetti Detective)
- **GitHub issue templates** (`.github/ISSUE_TEMPLATE/`) — Bug Report and Feature Request templates
- **Input Shaper guide** in README.md and README_EN.md — full ADXL345 wiring table, SPI setup, printer.cfg additions, SHAPER_CALIBRATE walkthrough, shaper types comparison
- **OctoPrint and Telegram screenshots** in both READMEs
- **Obico plugin section** in both READMEs — install, configure, comparison table vs OctoEverywhere/PrintWatch
- **3D Print Defect Reference** in both READMEs — 21 defects with photos in 4 categories
- **Calibration resources** from k3d.tech — temperature reference tables per material
- **Pi OS Lite explanation** and `Ctrl+Shift+X` Raspberry Pi Imager shortcut in both READMEs
- **Raspberry Pi Zero 2 WH pinout photo** in GPIO relay sections

### Changed
- README.md and README_EN.md fully expanded to production-quality documentation

## [0.1.0] - 2026-07-10

### Added
- Initial repository structure
- OctoPrint plugin list and configs
- Klipper printer.cfg template for Creality Ender 5 S1
- Telegram bot configuration template (OctoTelegram plugin)
- Setup scripts for fresh Raspberry Pi installation
- Documentation: SETUP.md, PLUGINS.md, KLIPPER.md
- Telegram chat export archive (September–October 2024 bot history)
- Standard repo files: README (RU/EN), LICENSE, CONTRIBUTING, CODE_OF_CONDUCT
