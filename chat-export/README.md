# Telegram Chat Export

Archive of the Telegram bot conversation with the 3D printer control bot ("3D printer").

**Period:** September 12 – October 14, 2024  
**Printer:** Creality Ender 5 S1  
**Bot:** OctoTelegram plugin running on OctoPrint  

## Contents

| File/Folder | Description |
|-------------|-------------|
| `result.json` | Full chat history in JSON format |
| `messages.html` | Chat export part 1 (HTML viewer) |
| `messages2.html` | Chat export part 2 (HTML viewer) |
| `photos/` | ~768 printer camera photos from print sessions |
| `files/` | G-code files shared during the period |
| `css/`, `js/`, `images/` | Telegram export viewer assets |

## How to view

Open `messages.html` in a browser — it shows the full chat with inline photos.

## What this shows

The bot sent real-time updates during prints:
- Photo + temperature data + time remaining every ~5mm of Z-height
- Print start / done / failed notifications
- Responses to manual commands (/status, /abort, /gif, etc.)

## G-code files present

| File | Description |
|------|-------------|
| `CE5S1_*.gcode` | Profiles for Creality Ender 5 S1 |
| `Temperatur_Turm_PETG_*.gcode` | PETG temperature tower calibration |
| `TempTower_PLA_*.gcode` | PLA temperature tower calibration |
| `four_square_cons.stl` | STL model (four square cons) |
