#!/bin/bash
# Update OctoPrint + all plugins + Klipper
# Usage: bash update.sh

set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓  $1${NC}"; }
info() { echo -e "${CYAN}ℹ  $1${NC}"; }
step() { echo -e "\n${BOLD}━━━ $1 ━━━${NC}"; }

if [ "$(id -u)" -eq 0 ]; then
    echo "Run as regular user, not root."
    exit 1
fi

step "1/4 — System packages"
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
ok "System updated"

step "2/4 — OctoPrint"
if [ -f "$HOME/oprint/bin/pip" ]; then
    # Graceful stop
    sudo systemctl stop octoprint 2>/dev/null || true
    sleep 2

    source "$HOME/oprint/bin/activate"

    # OctoPrint itself
    OLD_VER=$(pip show OctoPrint 2>/dev/null | grep Version | cut -d' ' -f2)
    pip install --upgrade OctoPrint -q
    NEW_VER=$(pip show OctoPrint 2>/dev/null | grep Version | cut -d' ' -f2)

    if [ "$OLD_VER" != "$NEW_VER" ]; then
        ok "OctoPrint: $OLD_VER → $NEW_VER"
    else
        ok "OctoPrint: $NEW_VER (already latest)"
    fi

    # All installed plugins
    info "Updating plugins..."
    pip list --outdated --format=freeze 2>/dev/null \
        | grep -v '^\-e' \
        | cut -d= -f1 \
        | xargs -r pip install --upgrade -q
    ok "Plugins updated"

    deactivate
    sudo systemctl start octoprint
else
    info "OctoPrint venv not found at ~/oprint — skipping"
fi

step "3/4 — Klipper"
if [ -d "$HOME/klipper" ]; then
    cd "$HOME/klipper"
    git fetch origin -q
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/master 2>/dev/null || git rev-parse origin/main 2>/dev/null)

    if [ "$LOCAL" != "$REMOTE" ]; then
        sudo systemctl stop klipper 2>/dev/null || true
        git pull -q
        # Recompile host MCU if it was installed
        if systemctl is-enabled klipper-mcu &>/dev/null; then
            make -s
            sudo make flash -s
            sudo systemctl restart klipper-mcu
        fi
        sudo systemctl start klipper
        ok "Klipper updated → $(git rev-parse --short HEAD)"
    else
        ok "Klipper: already latest ($(git rev-parse --short HEAD))"
    fi
else
    info "Klipper not found at ~/klipper — skipping"
fi

step "4/4 — Camera services"
# mjpg-streamer — rebuild from source if exists
if [ -d "$HOME/mjpg-streamer" ]; then
    cd "$HOME/mjpg-streamer/mjpg-streamer-experimental"
    git pull -q 2>/dev/null || true
    make -s 2>/dev/null && sudo make install -s 2>/dev/null || true
    sudo systemctl restart webcam 2>/dev/null || true
    ok "mjpg-streamer rebuilt"
fi

# camera-streamer
if [ -d "$HOME/camera-streamer" ]; then
    cd "$HOME/camera-streamer"
    git pull -q 2>/dev/null || true
    make -s 2>/dev/null && sudo make install -s 2>/dev/null || true
    sudo systemctl restart webcam 2>/dev/null || true
    ok "camera-streamer rebuilt"
fi

echo ""
echo -e "${GREEN}Update complete.${NC} Check OctoPrint at http://$(hostname -I | awk '{print $1}'):5000"
echo ""
