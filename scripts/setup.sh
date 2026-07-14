#!/bin/bash
# 3D Printer Control — Interactive Setup Script
# Installs OctoPrint + Klipper + Camera + Telegram Bot on Raspberry Pi
#
# Usage: bash setup.sh
# Run as regular user (pi), NOT as root

set -e

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Helpers ──────────────────────────────────────────────────────────────────
step()    { echo -e "\n${BLUE}${BOLD}━━━ $1 ━━━${NC}"; }
ok()      { echo -e "${GREEN}✓  $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $1${NC}"; }
info()    { echo -e "${CYAN}ℹ  $1${NC}"; }
err()     { echo -e "${RED}✗  $1${NC}"; exit 1; }

ask() {
    echo -e -n "${CYAN}?  $1: ${NC}"
    read -r REPLY
    echo "$REPLY"
}

ask_default() {
    # ask_default "Question" "default_value"
    echo -e -n "${CYAN}?  $1 [${2}]: ${NC}"
    read -r REPLY
    echo "${REPLY:-$2}"
}

ask_yn() {
    while true; do
        echo -e -n "${CYAN}?  $1 [y/n]: ${NC}"
        read -r REPLY
        case "$REPLY" in
            [Yy]*) return 0 ;;
            [Nn]*) return 1 ;;
            *)     warn "Введи y или n" ;;
        esac
    done
}

ask_choice() {
    # ask_choice "Question" option1 option2 ...
    local question="$1"; shift
    local i=1
    echo -e "${CYAN}?  $question${NC}"
    for opt in "$@"; do
        echo "   $i) $opt"
        ((i++))
    done
    while true; do
        echo -e -n "${CYAN}   Выбор (1-$(($#))): ${NC}"
        read -r REPLY
        if [[ "$REPLY" =~ ^[0-9]+$ ]] && [ "$REPLY" -ge 1 ] && [ "$REPLY" -le "$#" ]; then
            return "$((REPLY - 1))"
        fi
        warn "Введи число от 1 до $#"
    done
}

# ─── Header ───────────────────────────────────────────────────────────────────
clear
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     3D Printer Control — Interactive Setup       ║${NC}"
echo -e "${BOLD}║     OctoPrint + Klipper + Camera + Telegram      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""
info "Скрипт задаст несколько вопросов, затем выполнит полную установку."
info "Время: ~30–50 минут (зависит от интернета)."
echo ""

# ─── Checks ───────────────────────────────────────────────────────────────────
if [ "$(id -u)" -eq 0 ]; then
    err "Не запускай от root! Запусти как обычный пользователь (pi): bash setup.sh"
fi

if ! grep -qi "raspberry pi" /proc/cpuinfo 2>/dev/null; then
    warn "Не распознан Raspberry Pi. Скрипт рассчитан на Raspberry Pi OS."
    ask_yn "Продолжить всё равно?" || exit 1
fi

# ─── QUESTIONS ────────────────────────────────────────────────────────────────
step "1/7 Принтер"

ask_choice "Модель принтера" \
    "Creality Ender 5 S1 (готовый конфиг)" \
    "Другой принтер (базовый шаблон)"
PRINTER_CHOICE=$?

if [ "$PRINTER_CHOICE" -eq 0 ]; then
    PRINTER_NAME="Creality Ender 5 S1"
    BED_X=220; BED_Y=220; BED_Z=280
    ok "Принтер: $PRINTER_NAME"
else
    PRINTER_NAME=$(ask "Название принтера (для конфига)")
    BED_X=$(ask_default "Ширина стола X (мм)" "220")
    BED_Y=$(ask_default "Глубина стола Y (мм)" "220")
    BED_Z=$(ask_default "Высота Z (мм)" "250")
fi

echo ""
info "Подключи принтер к Pi по USB, потом нажми Enter..."
read -r _

FOUND_PORTS=$(ls /dev/serial/by-id/ 2>/dev/null)
if [ -n "$FOUND_PORTS" ]; then
    echo ""
    ok "Найдены серийные порты:"
    ls /dev/serial/by-id/ | while read -r p; do echo "   → /dev/serial/by-id/$p"; done
    echo ""
    SERIAL_PORT=$(ask_default "Полный путь к порту принтера" "/dev/serial/by-id/$(ls /dev/serial/by-id/ | head -1)")
else
    warn "Серийный порт не найден. Укажи вручную."
    SERIAL_PORT=$(ask_default "Серийный порт" "/dev/ttyUSB0")
fi

# ─────────────────────────────────────────────────────────────────────────────
step "2/7 Telegram бот"

info "Создай бота у @BotFather в Telegram если ещё не сделал."
info "  /newbot → имя → username_bot → получишь токен вида 7123456:AAH..."
echo ""
TELEGRAM_TOKEN=$(ask "Telegram Bot Token")

if [ -z "$TELEGRAM_TOKEN" ]; then
    warn "Токен не указан. Telegram будет настроен вручную позже."
fi

# ─────────────────────────────────────────────────────────────────────────────
step "3/7 Камера"

ask_choice "Тип камеры" \
    "Logitech USB (mjpg-streamer)" \
    "Raspberry Pi Camera Module (camera-streamer)" \
    "Без камеры"
CAMERA_CHOICE=$?

if [ "$CAMERA_CHOICE" -eq 0 ]; then
    CAMERA_DEVICE=$(ask_default "Устройство камеры" "/dev/video0")
    CAMERA_RES=$(ask_default "Разрешение" "640x480")
    CAMERA_FPS=$(ask_default "FPS" "15")
fi

# ─────────────────────────────────────────────────────────────────────────────
step "4/7 Управление питанием"

RELAY_ENABLED=false
if ask_yn "Используешь GPIO реле для включения/выключения принтера?"; then
    RELAY_ENABLED=true
    GPIO_PIN=$(ask_default "GPIO пин (BCM нумерация)" "17")
    ok "Реле на GPIO$GPIO_PIN"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "5/7 AI мониторинг дефектов"

ask_choice "AI мониторинг (обнаружение сбоев печати)" \
    "OctoEverywhere — облако, бесплатно 1 принтер (рекомендуется)" \
    "Obico — самохостинг, полностью бесплатно (нужен Docker)" \
    "PrintWatch — требует API ключ" \
    "Без AI мониторинга"
AI_CHOICE=$?

if [ "$AI_CHOICE" -eq 1 ]; then
    OBICO_SERVER=$(ask_default "Адрес Obico сервера" "http://192.168.1.100:3334")
fi

# ─────────────────────────────────────────────────────────────────────────────
step "6/7 Input Shaper"

ADXL_ENABLED=false
info "Input Shaper устраняет 'призраки' на углах, позволяет печатать быстрее."
info "Требует ADXL345 акселерометр (~\$3), подключённый к Pi по SPI."
if ask_yn "Установить поддержку ADXL345 для Input Shaper?"; then
    ADXL_ENABLED=true
fi

# ─────────────────────────────────────────────────────────────────────────────
step "7/7 Подтверждение"

echo ""
echo -e "${BOLD}Итоговая конфигурация:${NC}"
echo "  Принтер:      $PRINTER_NAME (${BED_X}x${BED_Y}x${BED_Z} мм)"
echo "  Серийный порт: $SERIAL_PORT"
if [ -n "$TELEGRAM_TOKEN" ]; then
    echo "  Telegram:     токен указан"
else
    echo "  Telegram:     настроить вручную"
fi
case $CAMERA_CHOICE in
    0) echo "  Камера:       Logitech USB ($CAMERA_RES @ ${CAMERA_FPS}fps)";;
    1) echo "  Камера:       Raspberry Pi Camera";;
    2) echo "  Камера:       Нет";;
esac
[ "$RELAY_ENABLED" = "true" ] && echo "  Реле:         GPIO$GPIO_PIN" || echo "  Реле:         Нет"
case $AI_CHOICE in
    0) echo "  AI:           OctoEverywhere";;
    1) echo "  AI:           Obico ($OBICO_SERVER)";;
    2) echo "  AI:           PrintWatch";;
    3) echo "  AI:           Нет";;
esac
[ "$ADXL_ENABLED" = "true" ] && echo "  Input Shaper: ADXL345 (SPI)" || echo "  Input Shaper: Нет"
echo ""

ask_yn "Всё верно? Начать установку?" || { echo "Отменено."; exit 0; }

# ═══════════════════════════════════════════════════════════════════════════════
# INSTALLATION
# ═══════════════════════════════════════════════════════════════════════════════

step "Установка [1/8] — Обновление системы"
sudo apt-get update -qq && sudo apt-get upgrade -y -qq
ok "Система обновлена"

step "Установка [2/8] — Зависимости"
sudo apt-get install -y \
    git python3 python3-pip python3-venv virtualenv cmake \
    libjpeg62-turbo-dev libavformat-dev libavcodec-dev libswscale-dev \
    libv4l-dev v4l-utils build-essential pkg-config \
    libffi-dev libssl-dev libyaml-dev curl wget unzip
ok "Зависимости установлены"

step "Установка [3/8] — OctoPrint"
python3 -m venv ~/oprint
source ~/oprint/bin/activate
pip install --upgrade pip -q
pip install OctoPrint -q
deactivate

sudo tee /etc/systemd/system/octoprint.service > /dev/null <<SERVICE
[Unit]
Description=The snappy web interface for your 3D printer
After=network-online.target
Wants=network-online.target

[Service]
Environment="LC_ALL=C.UTF-8"
Environment="LANG=C.UTF-8"
Type=simple
User=$USER
ExecStart=/home/$USER/oprint/bin/octoprint serve --iface=0.0.0.0
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable octoprint
sudo systemctl start octoprint
ok "OctoPrint установлен → http://$(hostname -I | awk '{print $1}'):5000"

step "Установка [4/8] — Klipper"
cd ~
git clone --quiet https://github.com/Klipper3d/klipper.git
~/klipper/scripts/install-octopi.sh
sudo usermod -a -G dialout "$USER"
ok "Klipper установлен"

step "Установка [5/8] — Конфигурация Klipper (printer.cfg)"
mkdir -p ~/printer_data/config

# Generate printer.cfg
PROBE_X=$((BED_X / 2))
PROBE_Y=$((BED_Y / 2))

if [ "$PRINTER_CHOICE" -eq 0 ] && [ -f ~/3d-printer-control/klipper/printer.cfg ]; then
    cp ~/3d-printer-control/klipper/printer.cfg ~/printer_data/config/printer.cfg
    # Update serial port in the copy
    sed -i "s|serial:.*|serial: $SERIAL_PORT|" ~/printer_data/config/printer.cfg
    ok "Скопирован Ender 5 S1 конфиг, серийный порт: $SERIAL_PORT"
else
    cat > ~/printer_data/config/printer.cfg <<CFG
# Generated by setup.sh for $PRINTER_NAME

[mcu]
serial: $SERIAL_PORT

[printer]
kinematics: cartesian
max_velocity: 300
max_accel: 3000
max_z_velocity: 5
max_z_accel: 100
square_corner_velocity: 5.0

[stepper_x]
step_pin: PC2
dir_pin: PB9
enable_pin: !PC3
microsteps: 16
rotation_distance: 40
endstop_pin: ^PA5
position_endstop: 0
position_max: $BED_X
homing_speed: 50

[stepper_y]
step_pin: PB8
dir_pin: PB7
enable_pin: !PC3
microsteps: 16
rotation_distance: 40
endstop_pin: ^PA6
position_endstop: 0
position_max: $BED_Y
homing_speed: 50

[stepper_z]
step_pin: PB6
dir_pin: !PB5
enable_pin: !PC3
microsteps: 16
rotation_distance: 8
endstop_pin: probe:z_virtual_endstop
position_min: -5
position_max: $BED_Z
homing_speed: 4

[extruder]
step_pin: PB4
dir_pin: PB3
enable_pin: !PC3
microsteps: 16
rotation_distance: 7.5
nozzle_diameter: 0.400
filament_diameter: 1.750
heater_pin: PA1
sensor_type: EPCOS 100K B57560G104F
sensor_pin: PC5
control: pid
pid_Kp: 21.527
pid_Ki: 1.063
pid_Kd: 108.982
min_temp: 0
max_temp: 300
min_extrude_temp: 170
pressure_advance: 0.0

[heater_bed]
heater_pin: PA15
sensor_type: EPCOS 100K B57560G104F
sensor_pin: PC4
control: pid
pid_Kp: 54.027
pid_Ki: 0.770
pid_Kd: 948.182
min_temp: 0
max_temp: 120

[fan]
pin: PA0

[virtual_sdcard]
path: ~/printer_data/gcodes

[display_status]
[pause_resume]

[gcode_macro PREHEAT_PLA]
gcode:
    M140 S60
    M104 S210
    M109 S210

[gcode_macro PREHEAT_PETG]
gcode:
    M140 S85
    M104 S225
    M109 S225
CFG
    ok "Сгенерирован базовый printer.cfg"
fi

# Append ADXL345 config if needed
if [ "$ADXL_ENABLED" = "true" ]; then
    cat >> ~/printer_data/config/printer.cfg <<ADXL

# ── Input Shaper (ADXL345) ──────────────────────────────
[mcu rpi]
serial: /tmp/klipper_host_mcu

[adxl345]
cs_pin: rpi:None

[resonance_tester]
accel_chip: adxl345
probe_points:
    $PROBE_X, $PROBE_Y, 20
ADXL
    ok "ADXL345 конфиг добавлен"
fi

step "Установка [6/8] — Плагины OctoPrint"
source ~/oprint/bin/activate

pip install -q https://github.com/fabianonline/OctoPrint-Telegram/archive/stable.zip
pip install -q "https://github.com/kantlivelong/OctoPrint-PSUControl/archive/master.zip"
pip install -q https://github.com/NillerMedDild/Octoprint-SlicerEstimator/archive/master.zip
pip install -q https://github.com/LazeMSS/OctoPrint-UICustomizer/archive/main.zip

case $AI_CHOICE in
    0) pip install -q https://github.com/QuinnDamerell/OctoPrint-OctoEverywhere/archive/main.zip;;
    1) pip install -q https://github.com/TheSpaghettiDetective/OctoPrint-Obico/archive/master.zip;;
    2) pip install -q https://github.com/printpal-io/OctoPrint-PrintWatch/archive/main.zip;;
esac

if [ "$ADXL_ENABLED" = "true" ]; then
    pip install -q numpy
fi

deactivate
ok "Плагины установлены"

step "Установка [7/8] — Камера"

if [ "$CAMERA_CHOICE" -eq 0 ]; then
    # Logitech USB — mjpg-streamer
    sudo apt-get install -y cmake libjpeg62-turbo-dev libv4l-dev > /dev/null
    cd ~
    git clone --quiet https://github.com/jacksonliam/mjpg-streamer.git
    cd mjpg-streamer/mjpg-streamer-experimental
    make -s
    sudo make install -s
    cd ~

    sudo tee /etc/systemd/system/webcam.service > /dev/null <<WEB
[Unit]
Description=mjpg-streamer webcam
After=network.target

[Service]
User=$USER
ExecStart=/usr/local/bin/mjpg_streamer \
  -i "input_uvc.so -d $CAMERA_DEVICE -r $CAMERA_RES -f $CAMERA_FPS" \
  -o "output_http.so -p 8080 -w /usr/local/share/mjpg-streamer/www"
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
WEB

    sudo systemctl daemon-reload
    sudo systemctl enable webcam
    sudo systemctl start webcam
    ok "mjpg-streamer запущен → http://$(hostname -I | awk '{print $1}'):8080/?action=stream"

elif [ "$CAMERA_CHOICE" -eq 1 ]; then
    # Pi Camera — camera-streamer
    sudo apt-get install -y libcamera-dev liblivemedia-dev libboost-dev > /dev/null
    cd ~
    git clone --quiet https://github.com/ayufan/camera-streamer.git
    cd camera-streamer
    make -s
    sudo make install -s
    cd ~

    sudo tee /etc/systemd/system/webcam.service > /dev/null <<PICAM
[Unit]
Description=camera-streamer Pi Camera
After=network.target

[Service]
User=$USER
ExecStart=/usr/local/bin/camera-streamer \
  --camera-type=libcamera \
  --http-port=8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
PICAM

    sudo systemctl daemon-reload
    sudo systemctl enable webcam
    sudo systemctl start webcam
    ok "camera-streamer установлен → http://$(hostname -I | awk '{print $1}'):8080/?action=stream"

else
    ok "Камера пропущена"
fi

step "Установка [8/8] — Input Shaper (Klipper Host MCU)"

if [ "$ADXL_ENABLED" = "true" ]; then
    cd ~/klipper
    # Build for Linux process (host MCU)
    cat > /tmp/klipper_mcu.config <<MCUCFG
CONFIG_LOW_LEVEL_OPTIONS=y
CONFIG_MACH_LINUX=y
MCUCFG
    make KCONFIG_CONFIG=/tmp/klipper_mcu.config -s
    sudo make flash KCONFIG_CONFIG=/tmp/klipper_mcu.config -s
    sudo cp scripts/klipper-mcu.service /etc/systemd/system/ 2>/dev/null || true
    sudo systemctl enable klipper-mcu 2>/dev/null || true
    sudo systemctl start klipper-mcu 2>/dev/null || true
    ok "Klipper Host MCU установлен (для ADXL345)"
fi

# Restart all services
sudo systemctl restart klipper
sudo systemctl restart octoprint

# ═══════════════════════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════════════════════
PI_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║          Установка завершена успешно!            ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Что готово:${NC}"
echo "  ✓ OctoPrint    → http://$PI_IP:5000"
echo "  ✓ Klipper      → ~/printer_data/config/printer.cfg"
[ "$CAMERA_CHOICE" -ne 2 ] && echo "  ✓ Камера       → http://$PI_IP:8080/?action=stream"
[ "$RELAY_ENABLED" = "true" ] && echo "  ✓ Реле         → GPIO$GPIO_PIN (настрой в OctoPrint → PSU Control)"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo ""
echo "  1. ПРОШЕЙ MCU принтера с Klipper firmware (инструкция в README Шаг 8)"
echo ""
echo "  2. Подключи OctoPrint к Klipper:"
echo "     OctoPrint → Settings → Serial Connection"
echo "     Порт: /tmp/printer  |  Baudrate: 250000  →  Connect"
echo ""
if [ -n "$TELEGRAM_TOKEN" ]; then
    echo "  3. Настрой Telegram бот:"
    echo "     OctoPrint → Settings → Telegram → вставь токен"
    echo "     Открой бота → /start → разреши доступ в OctoPrint"
fi
echo ""
case $AI_CHOICE in
    0) echo "  4. Активируй OctoEverywhere: Settings → OctoEverywhere → регистрация";;
    1) echo "  4. Подключи к Obico: Settings → Obico → Server: $OBICO_SERVER";;
    2) echo "  4. Настрой PrintWatch: Settings → PrintWatch → вставь API ключ";;
esac
echo ""
if [ "$ADXL_ENABLED" = "true" ]; then
    echo "  5. Подключи ADXL345 по схеме из README (раздел Input Shaper)"
    echo "     Проверь: ACCELEROMETER_QUERY"
    echo "     Запусти: SHAPER_CALIBRATE  →  SAVE_CONFIG"
    echo ""
fi
echo -e "${RED}  ⚠ ВАЖНО: Перелогинься в SSH чтобы применились права dialout!${NC}"
echo "     exit  →  ssh pi@$PI_IP"
echo ""
echo "  → Полная документация: https://github.com/Mukller/3d-printer-control"
echo ""
