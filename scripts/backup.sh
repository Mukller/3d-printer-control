#!/bin/bash
# Backup OctoPrint config + printer.cfg + plugins list
# Usage: bash backup.sh [--tg]   (--tg = send archive to Telegram)

set -e

BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/3dprinter}"
DATE=$(date +%Y-%m-%d_%H-%M)
ARCHIVE="$BACKUP_DIR/backup_$DATE.tar.gz"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓  $1${NC}"; }
info() { echo -e "${YELLOW}ℹ  $1${NC}"; }
err()  { echo -e "${RED}✗  $1${NC}"; exit 1; }

# ── Collect sources ────────────────────────────────────────────────────────────
SOURCES=()

# printer.cfg (Klipper)
[ -d "$HOME/printer_data/config" ]    && SOURCES+=("$HOME/printer_data/config")
[ -d "$HOME/klipper_config" ]         && SOURCES+=("$HOME/klipper_config")

# OctoPrint config
[ -d "$HOME/.octoprint" ]             && SOURCES+=("$HOME/.octoprint")

# This repo's klipper dir
[ -d "$HOME/3d-printer-control/klipper" ] && SOURCES+=("$HOME/3d-printer-control/klipper")

if [ ${#SOURCES[@]} -eq 0 ]; then
    err "Nothing found to back up. Are you on the Pi?"
fi

# ── Create archive ─────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
info "Creating backup: $ARCHIVE"

# Dump installed OctoPrint plugins
if [ -f "$HOME/oprint/bin/pip" ]; then
    "$HOME/oprint/bin/pip" freeze > /tmp/octoprint_plugins.txt 2>/dev/null
    SOURCES+=("/tmp/octoprint_plugins.txt")
fi

tar -czf "$ARCHIVE" "${SOURCES[@]}" 2>/dev/null
ok "Backup created: $ARCHIVE ($(du -sh "$ARCHIVE" | cut -f1))"

# ── Keep only last 7 backups ───────────────────────────────────────────────────
ls -t "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null | tail -n +8 | while read -r old; do
    rm -f "$old"
    info "Removed old backup: $(basename "$old")"
done

# ── Optional: send to Telegram ────────────────────────────────────────────────
if [[ "$1" == "--tg" ]]; then
    if [ -z "$TELEGRAM_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
        err "Set TELEGRAM_TOKEN and TELEGRAM_CHAT_ID env vars to send to Telegram."
    fi
    info "Sending to Telegram..."
    curl -s -F document=@"$ARCHIVE" \
        -F caption="🖨 3D Printer backup $DATE" \
        "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument?chat_id=${TELEGRAM_CHAT_ID}" \
        > /dev/null
    ok "Sent to Telegram"
fi

echo ""
echo "  Backup location: $BACKUP_DIR"
echo "  To restore printer.cfg:"
echo "    tar -xzf $ARCHIVE -C / --wildcards '*/printer_data/config/*'"
echo ""
