# OctoPrint Plugins

Documentation for all installed plugins.

---

## OctoTelegram (Main)

**Repo:** https://github.com/fabianonline/OctoPrint-Telegram  
**Install:** `pip install https://github.com/fabianonline/OctoPrint-Telegram/archive/stable.zip`

The core plugin that enables full printer control via Telegram. Sends progress photos with temperature data automatically.

### Supported commands
| Command | Function |
|---------|----------|
| `/status` | Status + camera photo |
| `/print` | Start printing a file |
| `/togglepause` | Pause/resume |
| `/abort` | Emergency stop |
| `/files` | List uploaded files |
| `/upload` | Send file to upload it |
| `/filament` | Filament info |
| `/ctrl` | Control panel |
| `/tune` | Print tuning |
| `/sys` | System info |
| `/gif` | 20-frame camera GIF |
| `/supergif` | 60-frame camera GIF |
| `/settings` | Notification settings |

### Auto-notifications
- Print started (with photo)
- Z-height changes every N mm (with photo + temperatures + time remaining)
- Print done
- Print failed/cancelled

---

## PSU Control eWeLink

**Repo:** https://github.com/airens/OctoPrint-PSUControl-eWeLink  
**Purpose:** Control a Sonoff smart plug to power the printer on/off remotely

### Setup
1. Set up a Sonoff plug with the eWeLink app
2. Install this plugin
3. In OctoPrint → Settings → PSU Control eWeLink:
   - Enter eWeLink username/password
   - Select your device

---

## PrintWatch

**Repo:** https://github.com/printpal-io/OctoPrint-PrintWatch  
**Purpose:** AI-based print failure detection using camera feed

Detects spaghetti, layer shifts, and other failures. Can auto-pause or cancel the print.

### Setup
1. Requires camera working in OctoPrint
2. Register at printpal.io for API key (free tier available)
3. Configure sensitivity threshold

---

## SlicerEstimator

**Repo:** https://github.com/NillerMedDild/Octoprint-SlicerEstimator  
**Purpose:** Use slicer-estimated print times instead of OctoPrint's own (usually more accurate)

Works by reading M73 progress commands embedded in G-code by Cura, PrusaSlicer, Bambu Studio etc.

---

## UI Customizer

**Repo:** https://github.com/LazeMSS/OctoPrint-UICustomizer  
**Purpose:** Dark theme and layout customization for OctoPrint web UI

---

## OctoEverywhere

**Website:** https://octoeverywhere.com  
**Purpose:** Encrypted tunnel for remote access without opening ports

Free tier: 1 printer, limited bandwidth  
No dynamic DNS or port forwarding required.

---

## Bit-Bang SPI

**Repo:** https://github.com/RoboMagus/OctoPrint-Bit-Bang  
**Purpose:** Additional GPIO/SPI hardware control from OctoPrint

---

## Plugin Installation via CLI

```bash
# Activate OctoPrint virtualenv
source ~/oprint/bin/activate

# Install all plugins
cd ~/3d-printer-control
./octoprint/scripts/install-plugins.sh

# Restart OctoPrint
sudo systemctl restart octoprint
```
