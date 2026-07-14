#!/bin/bash
# Health check: verifies all 3D printer services are running
# Usage: bash health_check.sh
#        TELEGRAM_TOKEN=xxx TELEGRAM_CHAT_ID=yyy bash health_check.sh
#
# For cron every 5 minutes:
#   */5 * * * * TELEGRAM_TOKEN=xxx TELEGRAM_CHAT_ID=yyy /home/pi/3d-printer-control/scripts/health_check.sh

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

ok()   { echo -e "${GREEN}✓  $1${NC}"; }
fail() { echo -e "${RED}✗  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠  $1${NC}"; }

PI_IP=$(hostname -I | awk '{print $1}')
ISSUES=()
REPORT=""

# ── Check systemd services ────────────────────────────────────────────────────
check_service() {
    local name="$1"
    local label="${2:-$1}"
    if systemctl is-active --quiet "$name" 2>/dev/null; then
        ok "$label is running"
        REPORT+="✅ $label\n"
    else
        fail "$label is DOWN"
        ISSUES+=("$label is not running")
        REPORT+="❌ $label — not running\n"
    fi
}

echo ""
echo "=== 3D Printer Health Check ==="
echo "  Host: $PI_IP"
echo ""

check_service octoprint  "OctoPrint"
check_service klipper    "Klipper"

# webcam is optional — warn only
if systemctl list-units --all | grep -q "webcam.service"; then
    check_service webcam "Camera (webcam)"
fi

if systemctl list-units --all | grep -q "klipper-mcu.service"; then
    check_service klipper-mcu "Klipper Host MCU (ADXL345)"
fi

# ── Check OctoPrint HTTP ──────────────────────────────────────────────────────
if curl -sf --max-time 5 "http://localhost:5000" > /dev/null 2>&1; then
    ok "OctoPrint HTTP responding"
    REPORT+="✅ OctoPrint HTTP ok\n"
else
    fail "OctoPrint HTTP not responding on :5000"
    ISSUES+=("OctoPrint HTTP not responding")
    REPORT+="❌ OctoPrint HTTP — not responding\n"
fi

# ── Check disk space ──────────────────────────────────────────────────────────
DISK_USE=$(df / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USE" -ge 90 ]; then
    fail "Disk usage critical: ${DISK_USE}%"
    ISSUES+=("Disk usage critical: ${DISK_USE}%")
    REPORT+="❌ Disk: ${DISK_USE}% used — CRITICAL\n"
elif [ "$DISK_USE" -ge 80 ]; then
    warn "Disk usage high: ${DISK_USE}%"
    REPORT+="⚠️ Disk: ${DISK_USE}% used — high\n"
else
    ok "Disk usage: ${DISK_USE}%"
    REPORT+="✅ Disk: ${DISK_USE}% used\n"
fi

# ── Check RAM ────────────────────────────────────────────────────────────────
MEM_FREE=$(free -m | awk 'NR==2 {print $4}')
if [ "$MEM_FREE" -lt 50 ]; then
    warn "Low RAM: ${MEM_FREE}MB free"
    ISSUES+=("Low RAM: ${MEM_FREE}MB free")
    REPORT+="⚠️ RAM free: ${MEM_FREE}MB — low\n"
else
    ok "RAM free: ${MEM_FREE}MB"
    REPORT+="✅ RAM free: ${MEM_FREE}MB\n"
fi

# ── CPU temperature ──────────────────────────────────────────────────────────
if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    CPU_TEMP=$(( $(cat /sys/class/thermal/thermal_zone0/temp) / 1000 ))
    if [ "$CPU_TEMP" -ge 75 ]; then
        warn "CPU temperature high: ${CPU_TEMP}°C"
        REPORT+="⚠️ CPU temp: ${CPU_TEMP}°C — high\n"
    else
        ok "CPU temperature: ${CPU_TEMP}°C"
        REPORT+="✅ CPU temp: ${CPU_TEMP}°C\n"
    fi
fi

echo ""

# ── Telegram notification on issues ──────────────────────────────────────────
if [ "${#ISSUES[@]}" -gt 0 ] && [ -n "$TELEGRAM_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    MSG="🖨 <b>3D Printer Alert</b> — $PI_IP%0A%0A"
    MSG+="$(printf '%s\n' "${ISSUES[@]}" | while read -r l; do echo "• $l"; done | sed 's/ /%20/g; s/&/%26/g')"
    MSG+="%0A%0A$(echo -e "$REPORT" | sed 's/ /%20/g; s/&/%26/g; s/\n/%0A/g')"

    curl -s "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
        --data-urlencode "chat_id=$TELEGRAM_CHAT_ID" \
        --data-urlencode "parse_mode=HTML" \
        --data-urlencode "text=🖨 3D Printer Alert — $PI_IP

$(printf '%s\n' "${ISSUES[@]}" | while read -r l; do echo "• $l"; done)

$REPORT" \
        > /dev/null 2>&1 && echo "Telegram alert sent."
elif [ "${#ISSUES[@]}" -gt 0 ]; then
    echo "Issues found. Set TELEGRAM_TOKEN + TELEGRAM_CHAT_ID to get alerts."
else
    echo "All systems nominal."
fi

echo ""

# Exit non-zero if issues found (useful for cron/monitoring)
[ "${#ISSUES[@]}" -eq 0 ]
