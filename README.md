<div align="center">

[English](README_EN.md) • **Русский**

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

**Полный стек управления 3D-принтером: OctoPrint + Klipper + Telegram-бот + онлайн-слайсер**

Эта документация содержит абсолютно всё необходимое для настройки системы с нуля. Никаких других инструкций не понадобится.

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

## Содержание

- [Оборудование](#оборудование)
- [Архитектура системы](#архитектура-системы)
- [Установка](#установка)
- [Klipper — конфигурация принтера](#klipper--конфигурация-принтера)
- [Плагины OctoPrint](#плагины-octoprint)
  - [OctoTelegram](#ocotelegram--управление-принтером-через-telegram)
  - [PSU Control (GPIO реле)](#psu-control--управление-питанием-принтера)
  - [OctoEverywhere](#octoeverywhere--удалённый-доступ--ai-детектор)
  - [PrintWatch](#printwatch--альтернативный-ai-детектор-дефектов)
  - [Obico (опенсорс AI)](#obico--опенсорс-ai-детектор-с-самохостингом)
- [Telegram-бот](#telegram-бот)
- [Команды бота](#команды-бота)
- [Камера](#камера)
- [Управление питанием](#управление-питанием)
- [Калибровки](#калибровки)
  - [Input Shaper (ADXL345)](#input-shaper--adxl345-акселерометр)
  - [Справочник дефектов](#справочник-дефектов-3d-печати)
- [Скрипты обслуживания](#скрипты-обслуживания)
- [Онлайн-слайсер](#онлайн-слайсер)
- [Troubleshooting](#troubleshooting)

---

## Оборудование

### Что нужно для сборки

| Компонент | Модель / Описание |
|-----------|-------------------|
| 3D-принтер | Creality Ender 5 S1 |
| MCU принтера | STM32F401 (встроен в плату принтера) |
| Одноплатный компьютер | Raspberry Pi Zero 2 WH |
| Камера (вариант 1) | Logitech USB-камера (любая модель с UVC-поддержкой) |
| Камера (вариант 2) | Raspberry Pi Camera Module (любое поколение) |
| Управление питанием | Реле-модуль 5V (с оптопарой, активный LOW) |
| Кабель | USB-A → micro-USB (для подключения Pi к принтеру) |
| SD карта | microSD 16 GB+ (Class 10 / A1) |
| Питание Pi | Блок питания 5V 2.5A micro-USB |
| Слайсер | Orca Slicer (бесплатный) |

> **Важно про Pi Zero 2 WH:** 512 MB RAM и 1 GHz — это минимум для работы OctoPrint + Klipper одновременно. Система работает, но интерфейс загружается медленно (10–20 сек). Для комфортной работы рекомендуется Pi 3B+ (1 GB) или Pi 4 (2 GB+). Pi Zero 2 WH вполне достаточно если ты управляешь через Telegram — веб-интерфейс открываешь редко.

> **Про кабель:** Для Pi Zero нужен кабель USB-A (в принтер) → micro-USB (в Pi). Именно через этот кабель Klipper общается с MCU принтера по серийному порту.

---

## Архитектура системы

### Как всё связано

```
┌─────────────────────────────────────────────────┐
│                    Telegram                      │
│         (твой телефон / любое устройство)        │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS (интернет)
                       ▼
┌─────────────────────────────────────────────────┐
│            Raspberry Pi Zero 2 WH               │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  OctoPrint (порт 5000)                  │   │
│  │  ├── OctoTelegram plugin                │   │
│  │  ├── PSU Control (GPIO17 → реле)        │   │
│  │  ├── OctoEverywhere                     │   │
│  │  ├── SlicerEstimator                    │   │
│  │  └── UI Customizer                      │   │
│  └────────────────┬────────────────────────┘   │
│                   │ G-code через /tmp/printer   │
│  ┌────────────────▼────────────────────────┐   │
│  │  Klipper (klippy.py)                    │   │
│  │  Читает printer.cfg                     │   │
│  └────────────────┬────────────────────────┘   │
│                   │ USB Serial (/dev/ttyUSB0)   │
│  ┌────────────────▼────────────────────────┐   │
│  │  mjpg-streamer (порт 8080)              │   │
│  │  Logitech USB → MJPEG stream            │   │
│  └─────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │ USB
                       ▼
┌─────────────────────────────────────────────────┐
│         Creality Ender 5 S1                     │
│         STM32F401 MCU                           │
│         Моторы / Нагрев / Датчики / CR Touch    │
└─────────────────────────────────────────────────┘
```

### Роль каждого компонента

**OctoPrint** — веб-сервер на Pi. Принимает команды от плагинов и передаёт G-code в Klipper. Предоставляет веб-интерфейс на `http://raspberrypi.local:5000`.

**Klipper** — прошивка принтера, запущенная на Pi. Получает G-code от OctoPrint через Unix socket (`/tmp/printer`), переводит в сигналы для шаговых моторов и нагревателей. MCU принтера в режиме Klipper — просто исполнитель команд от Pi.

**OctoTelegram** — плагин OctoPrint. Слушает события (начало/конец печати, смена Z-высоты, ошибки) и отправляет уведомления в Telegram. Принимает команды от тебя и передаёт в OctoPrint.

**mjpg-streamer** — программа для трансляции видео с USB-камеры по HTTP в формате MJPEG. OctoPrint берёт снапшоты с него и вставляет в сообщения Telegram.

---

## Установка

### Шаг 1: Запись образа на SD карту

#### Почему Raspberry Pi OS Lite (64-bit), а не обычный Linux?

Можно было бы поставить Ubuntu Server или другой ARM-дистрибутив — технически это возможно. Но **Raspberry Pi OS** рекомендуется по нескольким причинам:

- **Оптимизированное под железо ядро** — Pi использует VideoCore GPU и кастомный ARM SoC. Pi OS поставляется с ядром, настроенным именно под этот чип
- **GPIO из коробки** — библиотеки `RPi.GPIO`, `lgpio`, `gpiod` предустановлены. Нам нужны для управления реле через GPIO. На Ubuntu пришлось бы устанавливать отдельно и разбираться с совместимостью
- **Утилита `raspi-config`** — одной командой включаешь камеру, SPI, I2C, SSH, расширяешь файловую систему, безопасно разгоняешь Pi
- **Поддержка камеры** — Raspberry Pi Camera Module требует `libcamera`, которая в Pi OS уже настроена. На других дистрибутивах нужно разбираться руками
- **Lite = без рабочего стола** — "Lite" означает, что нет GNOME/KDE/XFCE. Это освобождает ~400 MB RAM и значительную CPU-нагрузку. GUI нам не нужен — OctoPrint работает в браузере, всё управление через SSH и Telegram
- **Лучшая поддержка сообщества** — сообщества OctoPrint, Klipper, mjpg-streamer пишут документацию под Pi OS. Любая проблема — есть решение именно под неё

**Коротко:** Raspberry Pi OS Lite (64-bit) даёт лёгкую, совместимую с железом базу, которая работает без борьбы с драйверами.

#### Запись образа

1. Скачай **Raspberry Pi Imager** с официального сайта: https://www.raspberrypi.com/software/

2. Вставь microSD карту в компьютер

3. В Raspberry Pi Imager:
   - **Choose Device** → выбери `Raspberry Pi Zero 2 W`
   - **Choose OS** → `Raspberry Pi OS (other)` → `Raspberry Pi OS Lite (64-bit)` — выбирай именно Lite, без рабочего стола, он нам не нужен и только тратит ресурсы
   - **Choose Storage** → выбери свою SD карту

4. Прежде чем нажать Write, настрой всё сразу с помощью горячих клавиш:

   > **Нажми `Ctrl + Shift + X`** (Windows/Linux) или **`Cmd + Shift + X`** (Mac) — откроется панель **Advanced Options**. В новых версиях Raspberry Pi Imager (1.8+) это окно появляется автоматически после нажатия Next как **"Use OS customisation?"**.

   Заполни:
   - **Set hostname:** `raspberrypi`
   - **Enable SSH:** поставь галочку → `Use password authentication`
   - **Set username and password:** username `pi`, придумай пароль
   - **Configure wireless LAN:** введи название своей Wi-Fi сети и пароль
   - **Wireless LAN country:** выбери свою страну (важно для правильных частот Wi-Fi)
   - **Set locale settings:** свой часовой пояс

   Это избавит тебя от необходимости подключать к Pi клавиатуру и монитор — всё уже настроено на SD карте до первой загрузки.

5. Нажми **Save**, затем **Write**. Ждёшь ~5 минут.

6. Вставь карту в Pi, подключи питание.

### Шаг 2: Первое подключение по SSH

Подожди ~60 секунд после подачи питания — Pi загружается и подключается к Wi-Fi.

Открой терминал (на Windows: PowerShell или PuTTY) и выполни:

```bash
ssh pi@raspberrypi.local
```

Если не находит по имени — найди IP-адрес в настройках роутера (раздел "подключённые устройства") и подключись напрямую:

```bash
ssh pi@192.168.X.X
```

При первом подключении появится вопрос про fingerprint — напечатай `yes` и нажми Enter.

Введи свой пароль (символы не отображаются — это нормально).

### Шаг 3: Обновление системы

После входа выполни обновление. Это обязательно — без актуальных пакетов некоторые зависимости не установятся.

```bash
sudo apt update && sudo apt upgrade -y
```

Ждёшь 5–15 минут, зависит от скорости интернета. После завершения:

```bash
sudo reboot
```

Снова подключись через SSH после перезагрузки (подожди ~30 сек).

### Шаг 4: Установка зависимостей

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

### Шаг 5: Клонирование этого репозитория

```bash
cd ~
git clone https://github.com/Mukller/3d-printer-control.git
```

### Шаг 6: Установка OctoPrint

OctoPrint устанавливается в изолированное виртуальное окружение Python (`~/oprint`), чтобы не конфликтовать с системными пакетами.

```bash
# Создаём виртуальное окружение
python3 -m venv ~/oprint

# Активируем его
source ~/oprint/bin/activate

# Обновляем pip
pip install --upgrade pip

# Устанавливаем OctoPrint
pip install OctoPrint

# Выходим из виртуального окружения
deactivate
```

Создаём systemd сервис для автозапуска OctoPrint при старте Pi:

```bash
sudo nano /etc/systemd/system/octoprint.service
```

Вставляем следующее содержимое (Ctrl+Shift+V для вставки в большинстве терминалов):

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

Сохраняем: Ctrl+O, Enter, Ctrl+X.

```bash
# Перечитываем конфиги systemd
sudo systemctl daemon-reload

# Включаем автозапуск
sudo systemctl enable octoprint

# Запускаем прямо сейчас
sudo systemctl start octoprint

# Проверяем что запустился
sudo systemctl status octoprint
```

Должно появиться `Active: active (running)`. Если нет — смотри раздел [Troubleshooting](#troubleshooting).

Теперь OctoPrint доступен в браузере: `http://raspberrypi.local:5000`

При первом открытии запустится мастер настройки. Пройди его, создай аккаунт. API ключ потом найдёшь в Settings → API.

### Шаг 7: Установка Klipper

```bash
cd ~
git clone https://github.com/Klipper3d/klipper.git

# Устанавливаем зависимости Klipper
~/klipper/scripts/install-octopi.sh
```

Скрипт установит все нужные пакеты и зарегистрирует `klipper` как systemd сервис.

Проверяем:

```bash
sudo systemctl status klipper
```

Сейчас статус будет `failed` или `inactive` — это нормально, Klipper не запустится пока нет `printer.cfg`. Настроим его в следующих шагах.

### Шаг 8: Прошивка MCU принтера (STM32F401)

**Это обязательный шаг.** Klipper работает как пара: программа на Pi (klippy) и маленькая прошивка на MCU принтера. Стандартная прошивка Marlin не совместима — нужно перепрошить MCU прошивкой Klipper.

#### Сборка прошивки

```bash
cd ~/klipper
make menuconfig
```

Откроется текстовый интерфейс настройки. Используй стрелки и Enter для навигации. Установи следующие параметры:

```
[*] Enable extra low-level configuration options

    Micro-controller Architecture ---> STM32

    Processor model ---> STM32F401

    Bootloader offset ---> 32KiB bootloader

    Clock Reference ---> 8 MHz crystal

    Communication interface ---> Serial (on USART1 PA10/PA9)

    Baud rate for serial port ---> 250000
```

Выход: нажми `Q`, затем `Y` для сохранения.

```bash
# Собираем прошивку
make

# Файл прошивки будет здесь:
ls -la out/klipper.bin
```

#### Запись прошивки на принтер

Прошивка записывается через SD карту принтера:

1. Возьми любую FAT32 micro-SD карту (можно ту же, что уже в принтере)
2. Скопируй `out/klipper.bin` на карту:

```bash
# Вставь SD карту принтера в Pi через адаптер (или скопируй файл на компьютер)
# Предположим карта смонтировалась как /media/pi/SDCARD
cp ~/klipper/out/klipper.bin /media/pi/SDCARD/firmware.bin
sync
# Отключи карту
sudo umount /media/pi/SDCARD
```

Если Pi не может смонтировать карту напрямую — скопируй `klipper.bin` с Pi на компьютер через SCP:

```bash
# На своём компьютере (не на Pi):
scp pi@raspberrypi.local:~/klipper/out/klipper.bin ./
```

Переименуй файл в `firmware.bin` и запиши в корень SD карты принтера.

3. Вставь карту в принтер (слот снизу или сзади)
4. Выключи принтер полностью (не просто усыпи)
5. Включи снова

Принтер автоматически найдёт `firmware.bin`, прошьёт себя (~10 сек) и переименует файл в `FIRMWARE.CUR`. Если переименование произошло — прошивка успешна.

### Шаг 9: Подключение Pi к принтеру по USB

Соедини Pi и принтер кабелем USB-A (в принтер) → micro-USB (в Pi).

Найди серийный порт:

```bash
ls /dev/serial/by-id/
```

Ты увидишь что-то вроде:
```
usb-1a86_USB_Serial-if00-port0
```

Запомни этот путь — он понадобится для `printer.cfg`.

Добавь пользователя `pi` в группу `dialout`, чтобы OctoPrint/Klipper мог читать этот порт:

```bash
sudo usermod -a -G dialout pi
sudo reboot
```

### Шаг 10: Конфигурация printer.cfg

После перезагрузки скопируй конфиг из этого репозитория:

```bash
cp ~/3d-printer-control/klipper/printer.cfg ~/printer_data/config/printer.cfg
```

Открой его и замени серийный порт на свой (из шага 9):

```bash
nano ~/printer_data/config/printer.cfg
```

Найди строку `serial:` в секции `[mcu]` и замени на свой путь.

Сохрани и запусти Klipper:

```bash
sudo systemctl start klipper
sudo systemctl status klipper
```

Теперь Klipper должен быть `Active: active (running)`.

### Шаг 11: Подключение OctoPrint к Klipper

В браузере открой `http://raspberrypi.local:5000`

Зайди в Settings → Serial Connection:

- **Serial Port:** `/tmp/printer` (именно так — не USB порт, а Unix socket который создаёт Klipper)
- **Baudrate:** `250000`

Нажми Connect в главном интерфейсе. Если всё правильно — принтер подключится и ты увидишь температуры.

### Шаг 12: Установка плагинов OctoPrint

```bash
source ~/oprint/bin/activate

# OctoTelegram — управление через Telegram
pip install https://github.com/fabianonline/OctoPrint-Telegram/archive/stable.zip

# PSU Control — управление питанием через GPIO
pip install "https://github.com/kantlivelong/OctoPrint-PSUControl/archive/master.zip"

# SlicerEstimator — точное время из данных слайсера
pip install https://github.com/NillerMedDild/Octoprint-SlicerEstimator/archive/master.zip

# UI Customizer — тёмная тема
pip install https://github.com/LazeMSS/OctoPrint-UICustomizer/archive/main.zip

# OctoEverywhere — удалённый доступ + AI детектор дефектов
pip install https://github.com/QuinnDamerell/OctoPrint-OctoEverywhere/archive/main.zip

# PrintWatch — альтернативный AI детектор (используй или его, или OctoEverywhere Gadget)
pip install https://github.com/printpal-io/OctoPrint-PrintWatch/archive/main.zip

# Bit-Bang SPI — дополнительное GPIO управление
pip install https://github.com/RoboMagus/OctoPrint-Bit-Bang/archive/main.zip

deactivate

# Перезапускаем OctoPrint чтобы плагины загрузились
sudo systemctl restart octoprint
```

### Шаг 13: Настройка Telegram-бота

#### Создание бота через BotFather

1. Открой Telegram и найди [@BotFather](https://t.me/BotFather)
2. Напиши `/newbot`
3. BotFather спросит имя бота (то что видят пользователи) — например `Мой принтер`
4. Затем спросит username (должен заканчиваться на `bot`) — например `my_printer_3d_bot`
5. BotFather пришлёт токен вида: `7123456789:AAHdqTcvCH1vGWJxfSeofSs0K8F_LLL`

**Сохрани этот токен** — он нужен для настройки плагина.

#### Настройка плагина OctoTelegram

В OctoPrint → Settings → Telegram:

1. Вставь токен в поле **Telegram Token**
2. Нажми **Save**
3. Открой Telegram, найди своего бота по username и напиши ему `/start`
4. Вернись в OctoPrint → Settings → Telegram — в разделе **Users** появится твой аккаунт
5. Нажми на него и выдай **все права** (Admin/Full Access)
6. Настрой уведомления:
   - **Notify on print done:** ✓
   - **Notify on print failed:** ✓
   - **Notify on print started:** ✓
   - **Send image with notification:** ✓
   - **Height (mm) between snapshots:** `2` — фото каждые 2 мм Z-высоты
7. Нажми **Save**

Теперь напиши боту `/status` — он должен ответить фото с текущим состоянием принтера.

---

## Klipper — конфигурация принтера

### Что такое Klipper и зачем он нужен

Стандартная прошивка Ender 5 S1 — это **Marlin**. Она работает полностью на STM32F401 (MCU принтера). У MCU ограниченные вычислительные ресурсы, поэтому Marlin не может делать сложные вычисления в реальном времени.

**Klipper** переносит основные вычисления на Raspberry Pi, который в 10+ раз мощнее MCU. Это даёт:

- **Input Shaping (Resonance Compensation)** — Pi анализирует резонансные частоты принтера и компенсирует вибрации. Позволяет печатать быстрее без "призраков" (ringing) на углах деталей
- **Pressure Advance** — динамическое управление давлением в экструдере при разгоне/торможении. Углы получаются чёткими без наплывов
- **Smooth pressure advance** — сглаживание скачков давления
- **Live Config** — меняешь любой параметр в `printer.cfg` и нажимаешь `FIRMWARE_RESTART` — никакого перекомпилирования и перепрошивки
- **Точный контроль** — Pi может вычислять шаги с точностью до микросекунд

### Полный файл printer.cfg для Ender 5 S1

Файл находится в `klipper/printer.cfg`. Ниже его полное содержимое с объяснением каждой секции.

```ini
# printer.cfg для Creality Ender 5 S1
# Klipper конфигурация

# ═══════════════════════════════════════════════
# MCU — Micro-Controller Unit (STM32F401)
# ═══════════════════════════════════════════════
[mcu]
# Путь к серийному порту принтера
# Найти командой: ls /dev/serial/by-id/
serial: /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0
# Если порт не найден — попробуй:
# serial: /dev/ttyUSB0
# или: serial: /dev/ttyACM0

# ═══════════════════════════════════════════════
# PRINTER — основные параметры кинематики
# ═══════════════════════════════════════════════
[printer]
kinematics: cartesian          # Тип кинематики — декартова (Ender 5 S1 — декартова)
max_velocity: 300              # Максимальная скорость печати, мм/с
max_accel: 3000                # Максимальное ускорение, мм/с²
max_z_velocity: 5              # Максимальная скорость по Z, мм/с (медленнее — для точности)
max_z_accel: 100               # Ускорение по Z
square_corner_velocity: 5.0   # Скорость в углах (для Input Shaping уменьши до 1)

# ═══════════════════════════════════════════════
# STEPPER X — ось X
# ═══════════════════════════════════════════════
[stepper_x]
step_pin: PC2                  # Пин шага мотора X на плате
dir_pin: PB9                   # Пин направления
enable_pin: !PC3               # Пин включения (! = инверсия — активный LOW)
microsteps: 16                 # Микрошаги
rotation_distance: 40          # Мм за один оборот (для GT2 шкива 20 зубьев: 20*2=40)
endstop_pin: ^PA5              # Пин концевика X (^ = подтяжка к питанию)
position_endstop: 0            # Позиция концевика = 0 мм
position_max: 220              # Максимальная позиция X = 220 мм (рабочая зона)
homing_speed: 50               # Скорость поиска концевика, мм/с

# ═══════════════════════════════════════════════
# STEPPER Y — ось Y
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
# STEPPER Z — ось Z (вертикальная)
# ═══════════════════════════════════════════════
[stepper_z]
step_pin: PB6
dir_pin: !PB5              # ! означает что направление инвертировано
enable_pin: !PC3
microsteps: 16
rotation_distance: 8       # Для ходового винта M8 с шагом 8 мм/оборот
# Концевик Z не используется — используем CR Touch (probe)
endstop_pin: probe:z_virtual_endstop
position_min: -5           # Разрешаем небольшой отрицательный ход для z-offset
position_max: 280          # Высота рабочей зоны Ender 5 S1 = 280 мм
homing_speed: 4            # Медленно — для точности

# ═══════════════════════════════════════════════
# EXTRUDER — экструдер Sprite Pro (direct drive)
# ═══════════════════════════════════════════════
[extruder]
step_pin: PB4
dir_pin: PB3
enable_pin: !PC3
microsteps: 16
# rotation_distance нужно откалибровать (E-steps калибровка)
# Стандартное значение для Sprite Pro ≈ 7.5
# После калибровки замени это значение
rotation_distance: 7.5
nozzle_diameter: 0.400     # Диаметр сопла — стандартный 0.4 мм
filament_diameter: 1.750   # Диаметр филамента
heater_pin: PA1            # Пин нагревателя хотенда
sensor_type: EPCOS 100K B57560G104F  # Тип термистора (стандарт для Creality)
sensor_pin: PC5            # Аналоговый пин термистора
# PID коэффициенты — НУЖНО откалибровать командой PID_CALIBRATE
control: pid
pid_Kp: 21.527
pid_Ki: 1.063
pid_Kd: 108.982
min_temp: 0                # Минимальная температура (при которой нагрев работает)
max_temp: 300              # Максимальная температура
min_extrude_temp: 170      # Нельзя выдавливать пока не достигнута эта температура
max_extrude_only_distance: 500  # Максимальная длина ретракта (для загрузки филамента)
pressure_advance: 0.0      # Pressure Advance — настроить после калибровки
pressure_advance_smooth_time: 0.040

# ═══════════════════════════════════════════════
# HEATER BED — нагревательный стол
# ═══════════════════════════════════════════════
[heater_bed]
heater_pin: PA15
sensor_type: EPCOS 100K B57560G104F
sensor_pin: PC4
# PID коэффициенты стола — НУЖНО откалибровать
control: pid
pid_Kp: 54.027
pid_Ki: 0.770
pid_Kd: 948.182
min_temp: 0
max_temp: 120

# ═══════════════════════════════════════════════
# FAN — вентиляторы
# ═══════════════════════════════════════════════
[fan]
# Вентилятор обдува детали (part cooling fan)
pin: PA0

[heater_fan hotend_fan]
# Вентилятор хотенда — включается когда хотенд > 50°C
pin: PC0
heater: extruder
heater_temp: 50.0

# ═══════════════════════════════════════════════
# CR TOUCH (BLTouch совместимый) — датчик уровня стола
# ═══════════════════════════════════════════════
[bltouch]
sensor_pin: ^PC14          # Пин сигнала от датчика (^ = pullup)
control_pin: PC13          # Пин управления сервоприводом датчика
# Смещение датчика относительно сопла (измерить физически)
# x_offset: положительное = датчик правее сопла
# y_offset: положительное = датчик дальше сопла (к задней стенке)
x_offset: -31.8
y_offset: -40.5
z_offset: 0                # Z-offset устанавливается командой PROBE_CALIBRATE
speed: 4                   # Скорость опускания при замере
lift_speed: 10
samples: 2                 # Количество замеров в каждой точке (среднее)
sample_retract_dist: 5

[safe_z_home]
# Координаты для безопасной парковки Z (обычно центр стола)
home_xy_position: 141.8, 150.5   # Центр + компенсация смещения датчика
speed: 50
z_hop: 10                         # Поднять Z на 10 мм перед парковкой
z_hop_speed: 5

# ═══════════════════════════════════════════════
# BED MESH — компенсация неровности стола
# ═══════════════════════════════════════════════
[bed_mesh]
speed: 120
horizontal_move_z: 5       # Высота перемещений между точками
mesh_min: 18, 18           # Левый нижний угол сетки (с учётом смещения датчика)
mesh_max: 188, 179         # Правый верхний угол сетки
probe_count: 5, 5          # Сетка 5×5 = 25 точек
algorithm: bicubic         # Алгоритм интерполяции между точками
fade_start: 0.6            # Начало плавного отключения компенсации
fade_end: 10               # Конец — на высоте 10 мм компенсация полностью отключена

# ═══════════════════════════════════════════════
# SCREWS TILT ADJUST — помощник выравнивания стола
# ═══════════════════════════════════════════════
[screws_tilt_adjust]
# Координаты регулировочных винтов стола
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
screw_thread: CW-M4        # Направление резьбы винтов Ender 5 S1

# ═══════════════════════════════════════════════
# DISPLAY — дисплей принтера (CR-10 compatible)
# ═══════════════════════════════════════════════
[display]
lcd_type: st7920
cs_pin: PB12
sclk_pin: PB13
sid_pin: PB15
encoder_pins: ^PB14, ^PB10
click_pin: ^!PB2

# ═══════════════════════════════════════════════
# MACROS — кастомные G-code команды
# ═══════════════════════════════════════════════

# PAUSE — пауза печати
# Поднимает сопло и паркует его в сторону
[gcode_macro PAUSE]
rename_existing: BASE_PAUSE
gcode:
    {% set E = params.E|default(1)|float %}    # Длина ретракта при паузе
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
    G1 E-{E} F2100          ; ретракт филамента
    G1 Z{z_safe} F900       ; поднять сопло
    G90
    G1 X{x_park} Y{y_park} F6000   ; переместить в угол
    G91

# RESUME — продолжение после паузы
[gcode_macro RESUME]
rename_existing: BASE_RESUME
gcode:
    {% set E = params.E|default(1)|float %}
    G91
    G1 E{E} F2100           ; подача филамента обратно
    G90
    BASE_RESUME

# CANCEL_PRINT — отмена печати
[gcode_macro CANCEL_PRINT]
rename_existing: BASE_CANCEL_PRINT
gcode:
    G28 X Y                 ; парковка по X и Y
    {% set max_z = printer.toolhead.axis_maximum.z|float %}
    {% set act_z = printer.toolhead.position.z|float %}
    {% if act_z < (max_z - 2.0) %}
        G91
        G1 Z2 F300
        G90
    {% endif %}
    M104 S0                 ; выключить хотенд
    M140 S0                 ; выключить стол
    M106 S0                 ; выключить вентилятор
    BASE_CANCEL_PRINT

# PREHEAT_PLA — разогрев под PLA
[gcode_macro PREHEAT_PLA]
gcode:
    M117 Preheating PLA...
    M140 S60               ; стол 60°C
    M104 S210              ; хотенд 210°C
    M109 S210              ; ждём пока хотенд нагреется

# PREHEAT_PETG — разогрев под PETG
[gcode_macro PREHEAT_PETG]
gcode:
    M117 Preheating PETG...
    M140 S85               ; стол 85°C
    M104 S225              ; хотенд 225°C
    M109 S225              ; ждём пока хотенд нагреется

# LOAD_FILAMENT — загрузка филамента
[gcode_macro LOAD_FILAMENT]
gcode:
    {% set speed = params.SPEED|default(300)|float %}
    G91
    G1 E50 F{speed}        ; быстрая подача
    G1 E30 F150            ; медленная подача (выдавливание)
    G90

# UNLOAD_FILAMENT — выгрузка филамента
[gcode_macro UNLOAD_FILAMENT]
gcode:
    {% set speed = params.SPEED|default(300)|float %}
    G91
    G1 E10 F150            ; немного вперёд чтобы отжать
    G1 E-80 F{speed}       ; быстрая выгрузка
    G90

# START_PRINT — вызывается из слайсера в начале каждого принта
# В Orca Slicer добавь это в Machine G-code → Start G-code:
# START_PRINT BED_TEMP={first_layer_bed_temperature} EXTRUDER_TEMP={first_layer_temperature}
[gcode_macro START_PRINT]
gcode:
    {% set BED_TEMP = params.BED_TEMP|default(60)|float %}
    {% set EXTRUDER_TEMP = params.EXTRUDER_TEMP|default(210)|float %}
    M117 Heating...
    M140 S{BED_TEMP}
    M109 S{EXTRUDER_TEMP}
    M190 S{BED_TEMP}
    G28                    ; парковка
    BED_MESH_CALIBRATE     ; сетка стола
    G1 X0 Y0 Z0.3 F5000   ; переместиться в начальную позицию
    G92 E0                 ; сброс экструдера
    G1 X60 E9 F1000        ; начальная линия прочистки
    G1 X100 E12.5 F1000
    G92 E0
    M117 Printing...

# END_PRINT — вызывается из слайсера в конце принта
[gcode_macro END_PRINT]
gcode:
    G91
    G1 E-3 F300            ; ретракт
    G1 Z5 F300             ; поднять сопло
    G90
    G28 X Y                ; парковка по X и Y
    M104 S0                ; выключить хотенд
    M140 S0                ; выключить стол
    M106 S0                ; выключить обдув
    M84                    ; выключить моторы
    M117 Print done!

# ═══════════════════════════════════════════════
# BED SCREWS — ручное выравнивание стола
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
# VIRTUAL SD CARD — виртуальная SD карта
# Позволяет OctoPrint передавать G-code файлы
# ═══════════════════════════════════════════════
[virtual_sdcard]
path: ~/printer_data/gcodes

# ═══════════════════════════════════════════════
# DISPLAY STATUS — отображение статуса на дисплее
# ═══════════════════════════════════════════════
[display_status]

# ═══════════════════════════════════════════════
# PAUSE RESUME — встроенная поддержка паузы
# ═══════════════════════════════════════════════
[pause_resume]
```

### Справочник команд Klipper

Вводятся в терминале OctoPrint (вкладка Terminal):

| Команда | Что делает |
|---------|-----------|
| `FIRMWARE_RESTART` | Перезапускает Klipper (применяет изменения в printer.cfg) |
| `G28` | Парковка всех осей (поиск концевиков) |
| `G28 X Y` | Парковка только X и Y |
| `M119` | Показывает состояние концевиков (OPEN/TRIGGERED) |
| `GET_POSITION` | Текущие координаты всех осей |
| `BED_MESH_CALIBRATE` | Замер сетки стола (25 точек) |
| `BED_MESH_OUTPUT` | Показывает текущую сетку |
| `PROBE` | Один замер датчиком CR Touch |
| `PROBE_CALIBRATE` | Интерактивная калибровка Z-offset |
| `SCREWS_TILT_CALCULATE` | Вычисляет сколько надо повернуть каждый винт стола |
| `PID_CALIBRATE HEATER=extruder TARGET=225` | PID-калибровка хотенда |
| `PID_CALIBRATE HEATER=heater_bed TARGET=85` | PID-калибровка стола |
| `SAVE_CONFIG` | Сохраняет результаты калибровок в printer.cfg |
| `STATUS` | Состояние принтера |
| `PREHEAT_PLA` | Разогрев под PLA (60°C стол / 210°C хотенд) |
| `PREHEAT_PETG` | Разогрев под PETG (85°C стол / 225°C хотенд) |
| `LOAD_FILAMENT` | Загрузить филамент |
| `UNLOAD_FILAMENT` | Выгрузить филамент |

---

## Плагины OctoPrint

### OctoTelegram — управление принтером через Telegram

**Репозиторий:** https://github.com/fabianonline/OctoPrint-Telegram

Это главный плагин всей системы. Он:
- Отправляет уведомления о начале/конце/ошибке печати
- Слушает команды от тебя в Telegram
- Делает снапшот с камеры каждые 2 мм Z-высоты и отправляет с температурами
- Позволяет управлять всеми функциями OctoPrint из чата

**Установка:**
```bash
source ~/oprint/bin/activate
pip install https://github.com/fabianonline/OctoPrint-Telegram/archive/stable.zip
deactivate
sudo systemctl restart octoprint
```

**Полная настройка:**

Зайди в OctoPrint → Settings → Telegram:

1. **Token** — вставь токен от BotFather
2. Нажми **Save**, подожди 10 секунд
3. Открой бота в Telegram, напиши `/start`
4. Вернись в настройки — в разделе **Users** появится твой аккаунт
5. Кликни на аккаунт → установи **Trust level: Admin**
6. В разделе **Notifications** настрой:
   - ✓ `Notify on print done`
   - ✓ `Notify on print failed`
   - ✓ `Notify on print started`
   - ✓ `Notify on print cancelled`
   - ✓ `Notify on firmware error`
   - ✓ `Notify on octoprint startup`
   - ✓ `Send image with every notification`
   - **Height (mm):** `2` — снапшот каждые 2 мм
7. Нажми **Save**

**Проверка работы:**
Напиши боту `/status` — он должен прислать фото с температурами.

---

### PSU Control — управление питанием принтера

**Репозиторий:** https://github.com/kantlivelong/OctoPrint-PSUControl

Плагин позволяет включать/выключать принтер через Telegram команды `/on` и `/off`. Работает через GPIO пин Raspberry Pi, который управляет реле-модулем.

#### Схема подключения реле

```
Raspberry Pi Zero 2 WH          Реле-модуль 5V
┌─────────────────┐             ┌──────────────────┐
│  Pin 2 (5V)  ───┼─────────────┤ VCC              │
│  Pin 6 (GND) ───┼─────────────┤ GND              │
│  Pin 11 (GPIO17)┼─────────────┤ IN (Signal)      │
└─────────────────┘             │                  │
                                │ COM ─────────────┼──── к розетке (провод L)
                                │ NO ──────────────┼──── к принтеру (провод L)
                                └──────────────────┘
```

Провод нейтрали (N) и земля (PE) подключаются напрямую, без разрыва через реле. Разрываем только фазу (L).

> **Осторожно:** Работа с 220V опасна. Если не уверен — используй Sonoff умную розетку (вариант ниже).

**Распиновка Pi Zero 2 WH:**

```
(3.3V) 1 ● ● 2  (5V)      ← VCC реле сюда
(SDA)  3 ● ● 4  (5V)
(SCL)  5 ● ● 6  (GND)     ← GND реле сюда
(GPIO4)7 ● ● 8  (TX)
(GND)  9 ● ● 10 (RX)
(GPIO17)11 ● ● 12 (GPIO18)  ← Signal реле сюда
...
```

GPIO17 = Physical Pin 11.

**Настройка плагина:**

OctoPrint → Settings → PSU Control:

- **PSU Control** → Enable: ✓
- **Switching Method:** GPIO
- **GPIO Pin (BCM):** `17`
- **Active LOW:** ✓ (большинство реле-модулей с оптопарой — active LOW, то есть LOW = реле включено)
- **Sense Pin:** оставь пустым
- **Default PSU State:** Unchecked (выключен при старте)

Нажми Save. Теперь в OctoPrint появится кнопка питания, и команды `/on` `/off` в Telegram будут работать.

#### Альтернатива — Sonoff умная розетка (без пайки и 220V)

Если не хочешь работать с 220V напрямую:

1. Купи **Sonoff S26** (розетка с вилкой) или **Sonoff Basic** (врезная)
2. Воткни Sonoff в розетку, принтер воткни в Sonoff
3. Установи приложение **eWeLink** на телефон, создай аккаунт
4. Добавь Sonoff в eWeLink по инструкции из коробки
5. Установи плагин:

```bash
source ~/oprint/bin/activate
pip install "https://github.com/airens/OctoPrint-PSUControl-eWeLink/archive/master.zip"
deactivate
sudo systemctl restart octoprint
```

6. OctoPrint → Settings → PSU Control eWeLink:
   - **Username:** email от eWeLink
   - **Password:** пароль от eWeLink
   - **Device:** выбери свой Sonoff из списка
   - Нажми Save

---

### OctoEverywhere — удалённый доступ + AI детектор дефектов

**Сайт:** https://octoeverywhere.com

**⭐ Настоятельно рекомендуется** по двум причинам:

1. **Удалённый доступ** — зашифрованный туннель к OctoPrint откуда угодно без проброса портов и без VPN
2. **Gadget AI** — встроенный AI-детектор дефектов печати. Анализирует кадры с камеры в реальном времени и обнаруживает: спагетти (spaghetti), отслоение от стола, сдвиги слоёв. При обнаружении может автоматически поставить принт на паузу или остановить.

**Бесплатный тир:** 1 принтер, базовый Gadget

**Установка:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/QuinnDamerell/OctoPrint-OctoEverywhere/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

**Настройка:**

1. OctoPrint → Settings → OctoEverywhere → скопируй ссылку для регистрации
2. Перейди по ссылке, создай аккаунт
3. Принтер автоматически привяжется к аккаунту
4. Включи **Gadget** в настройках OctoEverywhere на сайте
5. Настрой уведомления — Gadget пришлёт алерт в Telegram при обнаружении дефекта

После регистрации получишь персональную ссылку вида `https://xxx.octoeverywhere.com` — через неё полный доступ к OctoPrint из любой точки мира.

---

### PrintWatch — альтернативный AI детектор дефектов

**Репозиторий:** https://github.com/printpal-io/OctoPrint-PrintWatch

Альтернатива OctoEverywhere Gadget для тех кто не хочет использовать OctoEverywhere для удалённого доступа, но хочет AI-мониторинг.

> **Используй или OctoEverywhere Gadget, или PrintWatch — не оба одновременно.** Два AI-сервиса параллельно дают лишнюю нагрузку и нет смысла в дублировании.

**Установка:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/printpal-io/OctoPrint-PrintWatch/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

**Настройка:**

1. Зарегистрируйся на https://www.printpal.io — там получишь API ключ (есть бесплатный тир)
2. OctoPrint → Settings → PrintWatch → вставь API ключ
3. Настрой чувствительность (порог срабатывания) — по умолчанию 50%
4. Выбери действие при обнаружении: `Pause` (пауза) или `Cancel` (отмена)

---

### Obico — опенсорс AI детектор с самохостингом

**Репозиторий:** https://github.com/TheSpaghettiDetective/obico-server  
**OctoPrint плагин:** https://github.com/TheSpaghettiDetective/OctoPrint-Obico

Obico (бывший The Spaghetti Detective) — единственный полностью открытый AI детектор дефектов 3D печати. Лицензия AGPL v3. Алгоритм обнаружил более 800 000 неудачных печатей в мировом сообществе.

**Ключевое преимущество:** при самохостинге работает полностью локально, бесплатно, с неограниченным количеством принтеров и всеми Pro-функциями без абонентской платы.

**Как это работает:**

Obico работает как отдельный сервер (можно запустить на том же Pi или на другой машине). OctoPrint плагин подключается к этому серверу. Сервер принимает кадры с камеры каждые 30–60 секунд, прогоняет через нейросеть, при превышении порога уверенности несколько кадров подряд — ставит печать на паузу или отменяет.

```
Принтер + камера → OctoPrint → Obico плагин → Obico сервер → AI модель → Пауза/Уведомление
```

**Варианты развёртывания:**

| Вариант | Стоимость | Где работает AI |
|---------|-----------|-----------------|
| Obico Cloud (облако) | Бесплатно 1 принтер / $4/мес Pro | На серверах Obico |
| Самохостинг (рекомендуем) | Бесплатно | Локально на твоём железе |

**Установка Obico сервера (самохостинг):**

```bash
# На отдельной машине (Pi 3B+/4, обычный ПК, VPS) с Docker
cd ~
git clone https://github.com/TheSpaghettiDetective/obico-server.git
cd obico-server
docker-compose up -d
```

Или используй Pi для OctoPrint+Klipper, а Obico сервер подними на VPS или домашнем ПК.

**Установка OctoPrint плагина:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/TheSpaghettiDetective/OctoPrint-Obico/archive/master.zip
deactivate
sudo systemctl restart octoprint
```

**Подключение к своему серверу:**

OctoPrint → Settings → Obico:
- **Server address:** `http://твой-сервер:3334` (адрес твоего Obico сервера)
- Нажми **Link OctoPrint** — получишь код
- На Obico сервере введи код → принтер добавлен
- **AI Failure Detection:** включи, выбери **Pause on detection**
- **Notification channels:** Telegram или email

> **Obico vs OctoEverywhere vs PrintWatch:**  
> — Obico самохостинг: бесплатно, локально, открытый код — лучший выбор при наличии второй машины  
> — OctoEverywhere Gadget: удобно, облако, платно при нескольких принтерах  
> — PrintWatch: требует API ключ с их сервисов, не полностью офлайн

---

### SlicerEstimator — точное время печати

**Репозиторий:** https://github.com/NillerMedDild/Octoprint-SlicerEstimator

OctoPrint сам считает время печати, но делает это неточно — он не знает реальных скоростей из слайсера. SlicerEstimator читает команды `M73 P[progress]` которые слайсер вставляет в G-code и показывает точное время из слайсера.

**Установка:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/NillerMedDild/Octoprint-SlicerEstimator/archive/master.zip
deactivate
sudo systemctl restart octoprint
```

**Настройка в Orca Slicer:**

В Orca Slicer → Printer Settings → Machine G-code → Layer change G-code добавь:

```gcode
M73 P[layer_num]
```

Теперь G-code файлы будут содержать данные о прогрессе и SlicerEstimator покажет точное время.

**Настройка плагина:**

OctoPrint → Settings → SlicerEstimator:
- **Slicer:** Orca Slicer / Bambu Studio
- **Use M73 progress:** ✓

---

### UI Customizer — тёмная тема OctoPrint

**Репозиторий:** https://github.com/LazeMSS/OctoPrint-UICustomizer

Меняет внешний вид OctoPrint: тёмная тема, перестановка блоков, скрытие ненужных элементов.

**Установка:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/LazeMSS/OctoPrint-UICustomizer/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

**Настройка:**

OctoPrint → Settings → UI Customizer:
- **Theme:** Dark
- Настрой раскладку по своему вкусу — перетаскивай блоки

---

### Bit-Bang SPI — дополнительное GPIO управление

**Репозиторий:** https://github.com/RoboMagus/OctoPrint-Bit-Bang

Плагин для управления дополнительными GPIO пинами Pi напрямую из OctoPrint. Полезен если нужно управлять несколькими реле или другим железом.

**Установка:**

```bash
source ~/oprint/bin/activate
pip install https://github.com/RoboMagus/OctoPrint-Bit-Bang/archive/main.zip
deactivate
sudo systemctl restart octoprint
```

---

## Telegram-бот

### Как бот реагирует на события принтера

Бот работает через плагин OctoTelegram. Когда OctoPrint получает событие от Klipper — плагин формирует сообщение и отправляет в Telegram.

**При запуске OctoPrint:**
```
🚀 Hello. I'm online and ready to receive your commands.
```

**При выключении OctoPrint:**
```
🐙 💤 Shutting down. Goodbye.
```

**При подключении принтера:**
```
🔗 Printer Connected
```

**При отключении принтера (пропало питание, кабель):**
```
💔 Printer Disconnected
```

**При ошибке принтера:**
```
⚠ ⚠ ⚠Printer Error {сообщение об ошибке}
```

**При начале печати** — приходит фото с надписью:
```
Started printing CE5S1_Dachshund.stl single colour.gcode.
```

**При завершении печати** — фото:
```
Finished printing CE5S1_Dachshund.stl single colour.gcode.
```

**Каждые 2 мм Z-высоты** — автоматическое фото с данными:
```
Printing at Z=3.2.
Bed 86.39/86.0, Extruder 225.03/225.0.
00:31:11, 25% done, 00:40:26 remaining.
Completed time 15:41:14.
```

**При команде парковки G28:**
```
🏠 Printer received home command 
Bed 86.46/86.0, Extruder 224.67/225.0
```

### Ответы бота на команды

**`/on`** — бот спрашивает подтверждение:
```
❓ Turn on the Printer?
[✅ Yes]  [❌ No]
```
После подтверждения:
```
✅ Command executed.
```
Если принтер уже включён:
```
⚠Printer has already been turned on.
```

**`/off`:**
```
✅ Shutdown Command executed.
```
Если принтер уже выключен:
```
⚠Printer has already been turned off.
```

**`/upload`:**
```
ℹ To upload a gcode file (also accept zip file), just send it to me.
The file will be stored in 'TelegramPlugin' folder.
```
После отправки файла:
```
📥 I've successfully saved the file you sent me as TelegramPlugin/filename.gcode.
```

**`/print`** (нет файлов):
```
Maybe next time.
```
**`/print`** (после загрузки файла):
```
🚀 Started the print job.
```

**Неизвестная команда:**
```
I do not understand you! 😖
```

### Профили температур (из практики)

| Материал | Стол | Экструдер |
|----------|------|-----------|
| PLA | 60°C | 210°C |
| PETG | 85–86°C | 224–225°C |

---

## Команды бота

Полный список команд с точными описаниями как в OctoTelegram:

| Команда | Описание |
|---------|----------|
| `/abort` | Экстренная остановка🆘 |
| `/shutup` | Мут бота🔕 |
| `/dontshutup` | Анмут бота🔔 |
| `/status` | Текущие состояние⛏🔨/🛏💤 |
| `/settings` | Настройки уведомлений⚙🔔 |
| `/files` | Список доступных файлов📂 |
| `/filament` | Информация о филаменте🪛🪱🧵 |
| `/print` | Начать печать✅ |
| `/togglepause` | Поставить на паузу печать⏯ |
| `/con` | Информация о подключение📲🔌 |
| `/upload` | Загрузка файлов |
| `/sys` | Система🛠 |
| `/ctrl` | Контрольные команды принтера🧰 |
| `/tune` | Настройки⚙ |
| `/user` | О пользователе🚹🚺 |
| `/help` | Помощь⚠️❓ |
| `/gif` | Отправляет гифку из 20 картинок🌇 |
| `/supergif` | Отправляет гифку из 60 картинок🏙 |
| `/on` | Включить принтер (GPIO реле) |
| `/off` | Выключить принтер (GPIO реле) |
| `/gcode` | Отправить произвольную G-code команду |

### Что делает каждая команда подробно

**`/status`** — присылает фото с текущей камеры + текст:
- Текущая температура стола и хотенда (факт/цель)
- Прогресс печати в процентах
- Оставшееся время
- Имя файла

**`/ctrl`** — открывает меню управления:
- Home (парковка)
- Motors Off (выключить моторы)
- Fan On/Off (управление вентилятором)

**`/tune`** — настройки во время печати:
- Flowrate (%) — коэффициент подачи материала
- Feedrate (%) — коэффициент скорости
- Температуры хотенда и стола

**`/sys`** — информация о системе:
- Температура CPU Raspberry Pi
- Загрузка CPU
- Использование RAM
- Uptime

**`/gif`** — делает 20 снапшотов с паузой между ними и собирает в анимированный GIF. Занимает ~30 секунд.

**`/supergif`** — то же самое но 60 кадров. Занимает ~2 минуты. Для длинных процессов.

**`/filament`** — показывает данные о текущем файле: сколько материала нужно (в граммах и метрах, если слайсер добавил эти данные в G-code).

---

## Камера

### Вариант 1: Logitech USB-камера (mjpg-streamer)

mjpg-streamer — программа для захвата видео с USB-камеры и трансляции по HTTP. OctoPrint подключается к нему и берёт снапшоты для Telegram.

#### Установка mjpg-streamer

```bash
# Зависимости
sudo apt install -y cmake libjpeg62-turbo-dev libv4l-dev

# Клонируем исходники
cd ~
git clone https://github.com/jacksonliam/mjpg-streamer.git

# Компилируем
cd mjpg-streamer/mjpg-streamer-experimental
make

# Устанавливаем
sudo make install
```

#### Проверка что камера определяется

```bash
# Вывести список устройств
v4l2-ctl --list-devices

# Должно появиться что-то типа:
# Logitech HD Webcam C270 (usb-...):
#         /dev/video0

# Проверить доступные разрешения
v4l2-ctl -d /dev/video0 --list-formats-ext
```

#### Запуск mjpg-streamer вручную (для теста)

```bash
mjpg_streamer \
  -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" \
  -o "output_http.so -p 8080 -w /usr/local/share/mjpg-streamer/www"
```

Параметры:
- `-d /dev/video0` — устройство камеры
- `-r 640x480` — разрешение (можно 1280x720 если камера поддерживает, но на Zero 2 нагрузит)
- `-f 15` — FPS (15 кадров/сек — разумный баланс для Zero 2)
- `-p 8080` — порт HTTP сервера

Открой в браузере: `http://raspberrypi.local:8080/?action=stream` — должен появиться стрим.

Останови: Ctrl+C.

#### Автозапуск mjpg-streamer через systemd

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

#### Настройка камеры в OctoPrint

OctoPrint → Settings → Webcam & Timelapse:

- **Stream URL:** `http://127.0.0.1:8080/?action=stream`
- **Snapshot URL:** `http://127.0.0.1:8080/?action=snapshot`
- **Webcam enabled:** ✓
- **Rotate 90°:** поставь если изображение перевёрнуто

Нажми Save. В главном интерфейсе OctoPrint появится вкладка с камерой.

---

### Вариант 2: Raspberry Pi Camera Module (camera-streamer)

Если используешь Pi Camera (не USB, а тот что подключается к CSI разъёму Pi), нужен другой стример — `camera-streamer`, который работает с libcamera.

#### Включение камеры в Raspberry Pi OS

```bash
sudo raspi-config
```

Перейди: `Interface Options` → `Legacy Camera` → `Enable` (для старых Camera Module v1/v2).

Для новых Camera Module 3 или HQ Camera legacy mode не нужен — libcamera работает напрямую.

```bash
sudo reboot
```

#### Установка camera-streamer

```bash
# Зависимости для libcamera
sudo apt install -y \
  libcamera-dev \
  liblivemedia-dev \
  libboost-dev \
  libssl-dev \
  pkg-config

# Клонируем и компилируем
cd ~
git clone https://github.com/ayufan/camera-streamer.git
cd camera-streamer
make

sudo make install
```

#### Запуск для теста

```bash
# Для Pi Camera Module v2 (IMX219)
camera-streamer \
  --camera-path=/base/soc/i2c0mux/i2c@1/imx219@10 \
  --camera-type=libcamera \
  --http-port=8080

# Если не знаешь путь — найди его:
cam --list-cameras
```

#### Systemd сервис для Pi Camera

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

URL стрима такой же: `http://raspberrypi.local:8080/?action=stream`

---

## Управление питанием

### Схема 1: GPIO реле (оригинальная установка)

#### Принцип работы

Raspberry Pi имеет GPIO пины — это цифровые выходы которые могут выдавать 3.3V (HIGH) или 0V (LOW). Реле-модуль следит за этим пином и замыкает/размыкает цепь 220V.

```
┌──────────────────────────────────────────────────────────────┐
│                      Реле-модуль 5V                          │
│  ┌────────────────┐                    ┌──────────────────┐  │
│  │   Оптопара     │                    │    Реле          │  │
│  │  VCC ← 5V Pi  │                    │  COM ─── Розетка │  │
│  │  GND ← GND Pi │──[Транзистор]──────│  NO  ─── Принтер│  │
│  │  IN  ← GPIO17 │                    │  NC  ─── (свобод)│  │
│  └────────────────┘                    └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**COM** (Common) — общий провод реле  
**NO** (Normally Open) — разомкнут пока реле выключено → используем  
**NC** (Normally Closed) — замкнут пока реле выключено → не используем

Подключаем фазный провод (L) от розетки в COM, из NO выходит к принтеру. При активации реле цепь замыкается — принтер получает питание.

#### Распиновка Pi Zero 2 WH (вид сверху)

```
                   USB  HDMI
                    ┌──┬──┐
              3.3V  1 ○ ○ 2  5V   ← Сюда VCC реле
               SDA  3 ○ ○ 4  5V
               SCL  5 ○ ○ 6  GND  ← Сюда GND реле
             GPIO4  7 ○ ○ 8  TX
               GND  9 ○ ○ 10 RX
           GPIO17  11 ○ ○ 12 GPIO18  ← Сюда IN реле
           GPIO27  13 ○ ○ 14 GND
           GPIO22  15 ○ ○ 16 GPIO23
             3.3V  17 ○ ○ 18 GPIO24
...
```

GPIO17 = Physical Pin 11 (BCM нумерация).

> Полная схема всех 40 пинов:

![Raspberry Pi Zero 2 WH GPIO Pinout](https://pinout-ai.s3.eu-west-2.amazonaws.com/raspberry-pi-zero-2w.png)

#### Настройка OctoPrint PSU Control

OctoPrint → Settings → PSU Control:

```
PSU Control enabled: ✓
Switching Method: GPIO
GPIO Pin (BCM): 17
Active LOW: ✓
  (большинство реле с оптопарой работают так:
   LOW на IN = реле включено, HIGH = реле выключено)
Default PSU State on startup: OFF
```

Нажми Save. В главном интерфейсе OctoPrint появится иконка питания.

Проверь:
- Нажми ON в OctoPrint — реле должно щёлкнуть
- Напиши `/on` боту — то же самое

---

### Схема 2: Sonoff умная розетка (без пайки)

Для тех кто не хочет работать с проводкой 220V.

#### Что купить

- **Sonoff S26** (розетка-переходник) — самый простой вариант, просто воткни
- **Sonoff Basic R2** — встраивается в разрыв провода, требует соединения проводов но без 220V разводки

#### Настройка

1. Установи приложение **eWeLink** (iOS/Android)
2. Зарегистрируйся
3. Добавь устройство в eWeLink по инструкции из коробки (обычно нужно зажать кнопку)
4. Проверь что можешь включать/выключать из приложения

#### Плагин PSU Control eWeLink

```bash
source ~/oprint/bin/activate
pip install "https://github.com/airens/OctoPrint-PSUControl-eWeLink/archive/master.zip"
deactivate
sudo systemctl restart octoprint
```

OctoPrint → Settings → PSU Control eWeLink:
- **Username:** email от eWeLink аккаунта
- **Password:** пароль от eWeLink
- Нажми Save — плагин загрузит список устройств
- **Device:** выбери свой Sonoff из выпадающего списка

---

### HAProxy — опционально (единый URL без портов)

По умолчанию:
- OctoPrint: `http://raspberrypi.local:5000`
- Камера: `http://raspberrypi.local:8080`

Если хочешь единый URL на порту 80:
- OctoPrint: `http://raspberrypi.local/`
- Камера: `http://raspberrypi.local/webcam/`

> **На Pi Zero 2 WH HAProxy создаёт дополнительную нагрузку**. Рекомендуется не использовать — прямые порты работают одинаково хорошо.

Если всё же хочешь:

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

## Калибровки

Калибровки нужно сделать один раз после первой установки. После этого данные сохраняются в `printer.cfg` и применяются автоматически.

### Orca Slicer — настройка слайсера

Orca Slicer — основной слайсер. Скачай с https://github.com/SoftFever/OrcaSlicer/releases

При первом запуске добавь принтер:
- Нажми `+` в разделе Printer
- Найди **Creality Ender 5 S1** — у Orca Slicer есть готовый профиль
- Выбери профили материалов: PLA и PETG
- Готово

**Настройка для Klipper:**

Printer Settings → Machine G-code:

**Start G-code:**
```gcode
START_PRINT BED_TEMP={first_layer_bed_temperature[0]} EXTRUDER_TEMP={first_layer_temperature[0]}
```

**End G-code:**
```gcode
END_PRINT
```

**Layer change G-code** (для SlicerEstimator):
```gcode
M73 P{layer_num}
```

---

### PID-калибровка хотенда

PID — алгоритм управления температурой. Без калибровки температура будет "прыгать" вместо стабильного удержания.

Нужно делать при:
- Первой установке
- Замене хотенда или термистора
- Замене вентилятора

```gcode
# В терминале OctoPrint вводи по одной команде

# Калибровка под PETG (225°C)
PID_CALIBRATE HEATER=extruder TARGET=225

# Подождать ~5 минут пока процесс завершится
# Должно появиться: PID parameters: pid_Kp=... pid_Ki=... pid_Kd=...

# Калибровка под PLA (210°C)
PID_CALIBRATE HEATER=extruder TARGET=210

# Сохранить результаты в printer.cfg
SAVE_CONFIG
```

После `SAVE_CONFIG` Klipper перезапустится и сохранит новые PID-коэффициенты.

---

### PID-калибровка стола

```gcode
# Калибровка под PETG (85°C)
PID_CALIBRATE HEATER=heater_bed TARGET=85

# Подождать ~10 минут
# Сохранить
SAVE_CONFIG
```

---

### E-steps (калибровка подачи филамента)

E-steps определяет сколько мм филамента реально подаётся за один шаг мотора. Без калибровки принтер будет недодавать или передавать материал.

```bash
# 1. Нагрей хотенд до рабочей температуры
PREHEAT_PETG
# или
PREHEAT_PLA

# 2. Загрузи филамент если не загружен

# 3. Отметь маркером 120 мм от входа в экструдер

# 4. Переключись в относительные координаты
G91
M83

# 5. Прикажи выдавить 100 мм
G1 E100 F50

# 6. Измерь сколько реально выдавилось
# Если осталось 25 мм до метки — реально выдавилось 95 мм

# 7. Рассчитай новый rotation_distance:
# new = old * commanded / actual
# new = 7.5 * 100 / 95 = 7.89

# 8. Замени значение rotation_distance в [extruder] в printer.cfg
# Затем:
FIRMWARE_RESTART
```

---

### Z-Offset (расстояние сопла до стола)

Z-Offset — расстояние между соплом и столом при срабатывании CR Touch. Нужно настроить точно — слишком высоко = плохое прилипание, слишком низко = сопло царапает стол.

```gcode
# 1. Парковка
G28

# 2. Начать калибровку
PROBE_CALIBRATE

# Принтер переедет к центру стола и опустит сопло

# 3. Используй метод бумажного листа:
# Подложи обычный лист бумаги под сопло
# Вводи команды пока бумага не начнёт слегка цепляться:
TESTZ Z=-0.1    # опустить на 0.1 мм
TESTZ Z=-0.05   # опустить на 0.05 мм
TESTZ Z=+0.05   # поднять на 0.05 мм
# Когда бумага чуть-чуть тянется — это правильное расстояние

# 4. Принять результат
ACCEPT

# 5. Сохранить
SAVE_CONFIG
```

---

### Bed Mesh — сетка выравнивания стола

Замеряет высоту стола в 25 точках (сетка 5×5) и компенсирует неровности автоматически во время печати.

```gcode
# 1. Нагрей стол до рабочей температуры (сетка меняется с температурой!)
M190 S85   # для PETG
# или
M190 S60   # для PLA

# 2. Парковка
G28

# 3. Замер сетки
BED_MESH_CALIBRATE

# Займёт ~5 минут — принтер будет тыкать датчиком в 25 точек

# 4. Сохранить
SAVE_CONFIG

# 5. Посмотреть результат
BED_MESH_OUTPUT
```

После `SAVE_CONFIG` сетка применяется автоматически при каждой печати.

---

### Screws Tilt Adjust — ручное выравнивание стола

Если сетка Bed Mesh показывает большие отклонения (>1.5 мм) — нужно сначала физически выровнять стол винтами.

```gcode
G28
SCREWS_TILT_CALCULATE
```

Принтер посчитает и скажет сколько оборотов и в какую сторону крутить каждый винт:

```
01:Front Left : x=51.8, y=69.5 --> adjust CCW 00:22 (или CW 01:38)
02:Front Right: x=221.8, y=69.5 --> adjust CW 00:05
...
```

CW = по часовой = поднять угол стола  
CCW = против часовой = опустить угол стола  
Формат `MM:SS` = обороты:доли (00:22 = четверть оборота)

После подстройки снова `G28` и `SCREWS_TILT_CALCULATE` до результата ≤0.3 мм.

---

### Pressure Advance — давление в экструдере

Компенсирует задержку экструдера при разгоне и торможении. Углы становятся чёткими.

```gcode
# 1. Нагрев
PREHEAT_PETG

# 2. Парковка
G28

# 3. Настройка для теста
SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=1 ACCEL=500

# 4. Запуск теста (печатает башню с нарастающим PA)
TUNING_TOWER COMMAND=SET_PRESSURE_ADVANCE PARAMETER=ADVANCE START=0 FACTOR=.005

# 5. Напечатай тестовую деталь (скачай из Klipper документации)

# 6. Найди слой с лучшими углами, измерь его высоту (мм)
# Рассчитай: pressure_advance = START + height * FACTOR
# Пример: оптимальный слой на 12 мм → PA = 0 + 12 * 0.005 = 0.060

# 7. Запиши в printer.cfg в секции [extruder]:
# pressure_advance: 0.060

# 8. Применить
FIRMWARE_RESTART
```

---

### Input Shaper — ADXL345 акселерометр

Input Shaper — компенсация резонансных вибраций принтера в реальном времени. Klipper измеряет частоту вибраций каждой оси и вычитает её при движении. Результат: **можно печатать значительно быстрее без «призраков»** (ringing) на углах. Для измерения нужен ADXL345 — дешёвый (≈$3) SPI-акселерометр.

#### Схема подключения ADXL345 → Pi Zero 2 WH

```
ADXL345 Pin    →   RPi Pin    →   Название
───────────────────────────────────────────
VCC (3.3V)     →   Pin  1     →   3.3V DC
GND            →   Pin  6     →   GND
CS             →   Pin 24     →   GPIO8 (SPI0_CE0)
SDO (MISO)     →   Pin 21     →   GPIO9 (SPI0_MISO)
SDA (MOSI)     →   Pin 19     →   GPIO10 (SPI0_MOSI)
SCL (SCLK)     →   Pin 23     →   GPIO11 (SPI0_SCLK)
```

> Используй короткие провода (≤20 см) или экранированную витую пару. Плохой контакт даст шум вместо графика резонансов.

#### 1. Включи SPI на Pi

```bash
sudo raspi-config
# Interface Options → SPI → Enable
sudo reboot
```

Проверь:
```bash
ls /dev/spidev*
# Должно появиться: /dev/spidev0.0
```

#### 2. Установи numpy

```bash
source ~/oprint/bin/activate
pip install numpy
deactivate

# Для Klipper Host MCU (запускает Python на самом Pi как MCU)
cd ~/klipper
make menuconfig
# Micro-controller Architecture → Linux process
# → Q → Yes
make
sudo make flash
sudo cp scripts/klipper-mcu.service /etc/systemd/system/
sudo systemctl enable klipper-mcu
sudo systemctl start klipper-mcu
```

#### 3. Добавь в printer.cfg

```ini
# Raspberry Pi как второй MCU (для ADXL345)
[mcu rpi]
serial: /tmp/klipper_host_mcu

# ADXL345 акселерометр
[adxl345]
cs_pin: rpi:None        # Используем SPI0, CE0 (Pin 24)

# Тестер резонансов
[resonance_tester]
accel_chip: adxl345
probe_points:
    110, 110, 20        # Центр стола, немного выше нуля
```

```bash
# Применить конфиг
FIRMWARE_RESTART
```

#### 4. Проверь что акселерометр работает

В терминале OctoPrint:
```
ACCELEROMETER_QUERY
```

Ответ должен быть что-то вроде:
```
adxl345 values (x, y, z): 430.1, -30.5, 9808.4
```
Если ошибка — проверь провода и что SPI включён.

#### 5. Запусти калибровку

```
SHAPER_CALIBRATE
```

Принтер сначала двигает X ось с нарастающей частотой, потом Y. Каждый замер занимает ~2 минуты. После завершения Klipper выдаст рекомендации:

```
Fitted shaper 'mzv' frequency = 38.2 Hz (vibrations = 1.2%, smoothing ~= 0.134)
Fitted shaper 'ei' frequency = 47.4 Hz (vibrations = 0.5%, smoothing ~= 0.133)
Recommended shaper is mzv @ 38.2 Hz
```

Сохрани результат:
```
SAVE_CONFIG
```

Klipper автоматически добавит в конец printer.cfg:
```ini
[input_shaper]
shaper_freq_x: 38.2
shaper_type_x: mzv
shaper_freq_y: 41.7
shaper_type_y: mzv
```

#### 6. Что означают типы шейперов

| Тип | Характеристика |
|-----|---------------|
| `zv` | Простой, быстрый, для жёстких принтеров |
| `mzv` | Модифицированный ZV — хорош для большинства |
| `ei` | Больше сглаживает, для мягких рам |
| `2hump_ei` / `3hump_ei` | Максимальное подавление, потеря скорости |

После калибровки можно поднять `max_accel` в `[printer]` до значений, рекомендованных Klipper в отчёте.

> **Ресурс:** [Klipper Input Shaper документация](https://www.klipper3d.org/Resonance_Compensation.html)

---

### Полезные ресурсы по калибровке

- **[k3d.tech/calibrations](https://k3d.tech/calibrations/)** — подробные гайды по всем калибровкам Klipper
- **[3dpt.ru FAQ](https://3dpt.ru/page/faq)** — частые вопросы, русский язык
- **[3dtool.ru — дефекты FDM](https://3dtool.ru/stati/defekty-3d-pechati-osnovnye-problemy-i-resheniya-v-fdm-tekhnologii/)** — визуальный справочник дефектов с решениями
- **[3d-diy.ru — проблемы печати](https://3d-diy.ru/blog/osnovnye-problemy-3d-pechati-sposoby-ih-resheniya/)** — основные проблемы и способы устранения
- **[Klipper Config Reference](https://www.klipper3d.org/Config_Reference.html)** — полная документация по всем параметрам printer.cfg
- **[Klipper Pressure Advance](https://www.klipper3d.org/Pressure_Advance.html)** — детальный гайд по PA
- **[Klipper Input Shaper](https://www.klipper3d.org/Resonance_Compensation.html)** — настройка компенсации вибраций (для продвинутых)

---

### Справочник дефектов 3D печати

> Источник: [3dpt.ru FAQ](https://3dpt.ru/page/faq) — изображения показывают как выглядит проблема на реальных моделях.

#### Проблемы при старте печати

| Дефект | Фото | Причины | Решение |
|--------|------|---------|---------|
| **Не экструдирует в начале** | ![](https://static.insales-cdn.com/files/1/669/1712797/original/Not-Extruding-At-Start-200.jpg) | Филамент не загружен, сломан у входа, застрял в сопле | Проверь загрузку, очисти сопло, добавь «юбку» (skirt) в слайсере для прочистки перед печатью |
| **Плохая адгезия первого слоя** | ![](https://static.insales-cdn.com/files/1/681/1712809/original/400-Print-Not-Sticking-To-Bed.jpg) | Высокий Z-offset, холодный стол, жирный стол, мокрый филамент | Откалибруй Z-offset, обезжирь стол изопропиловым спиртом, подбери температуру стола, высуши филамент |

#### Проблемы экструзии

| Дефект | Фото | Причины | Решение |
|--------|------|---------|---------|
| **Недоэкструзия** | ![](https://static.insales-cdn.com/files/1/682/1712810/original/400-Under-Extruding.jpg) | Неверный диаметр филамента в слайсере, изношенное сопло, слабый натяг привода | Измерь реальный диаметр штангенциркулем, проверь сопло, откалибруй E-steps |
| **Переэкструзия** | ![](https://static.insales-cdn.com/files/1/684/1712812/original/400-Over-Extruding-400.jpg) | Диаметр прописан меньше реального, частичный засор | Откорректируй diameter в слайсере, проверь сопло |
| **Дыры в верхних слоях** | ![](https://static.insales-cdn.com/files/1/694/1712822/original/400-Holes-Or-Gaps-In-Top-Layers.jpg) | Мало верхних сплошных слоёв, низкий infill | Увеличь solid top layers (мин. 0.5 мм), подними infill до 30–50% |
| **Стрингинг (волоски)** | ![](https://static.insales-cdn.com/files/1/695/1712823/original/400-Hairs-And-Stringing.jpg) | Слишком жидкий материал при перемещениях | Включи retraction (1–2 мм direct drive, до 6 мм bowden), снизь температуру на 5–10°C, настрой Pressure Advance |
| **Остановка в середине** | ![](https://static.insales-cdn.com/files/1/1257/1713385/original/400-Stops-Extruding-Mid-Print.jpg) | Кончился филамент, протачивание шестерёнкой, засор | Проверь бобину, осмотри привод экструдера на стружку, прочисти сопло |
| **Протачивание филамента** | ![](https://static.insales-cdn.com/files/1/1255/1713383/original/400-Grinding-Or-Stripped-Filament.jpg) | Экструдер перемалывает прут — слишком высокая скорость или засор | Снизь скорость на 50%, прочисти сопло, подними температуру на 5°C |
| **Засор экструдера** | ![](https://static.insales-cdn.com/files/1/1256/1713384/original/400-Clogged-Extruder.jpg) | Обгоревший пластик, смена материала без чистки, низкая температура | Cold pull (нагрей → вытащи пруток резко), игла для прочистки, замена сопла |

#### Проблемы качества поверхности

| Дефект | Фото | Причины | Решение |
|--------|------|---------|---------|
| **Перегрев** | ![](https://static.insales-cdn.com/files/1/696/1712824/original/400-Over-Heating.jpg) | Недостаточное охлаждение между слоями | Снизь температуру на 5°C, уменьши скорость, подними скорость вентилятора, поставь min layer time ≥10 сек |
| **Наплывы и пузыри** | ![](https://static.insales-cdn.com/files/1/1261/1713389/original/400-Blobs-And-Zits.jpg) | Давление в сопле при начале/конце периметра | Настрой retraction и restart distance, включи coasting (0.2–0.5 мм), рандомизируй точку начала шва |
| **Слабый инфил** | ![](https://static.insales-cdn.com/files/1/1258/1713386/original/400-Weak-Or-Stringy-Infill.jpg) | Слишком высокая скорость инфила | Снизь скорость инфила на 50%, смени паттерн на Grid или Gyroid |
| **Зазор между инфилом и стенкой** | ![](https://static.insales-cdn.com/files/1/1259/1713387/original/400-Gap-Between-Infill-And-Outline.jpg) | Мало перекрытия (overlap) | Увеличь outline overlap с 20% до 30%, подними extrusion multiplier |
| **Царапины на верхней поверхности** | ![](https://static.insales-cdn.com/files/1/1291/1713419/original/200-Scars-On-Top-Surface.jpg) | Сопло задевает поверхность при перемещении | Подними Z-offset, включи lift nozzle при retraction |
| **Линии на боку** | ![](https://static.insales-cdn.com/files/1/1294/1713422/original/200-Lines-On-Side-Of-Print.jpg) | Нестабильная температура, непостоянная экструзия | Стабилизируй температуру PID-калибровкой, проверь равномерность подачи |
| **Зазоры в углах** | ![](https://static.insales-cdn.com/files/1/1292/1713420/original/200-Gaps-In-Floor-Corners.jpg) | Мало верхних слоёв, слабый инфил | Увеличь solid top layers, подними infill |
| **Зазоры в тонких стенках** | ![](https://static.insales-cdn.com/files/1/1298/1713426/original/200-Gaps-In-Thin-Walls.jpg) | Толщина стенки меньше двух диаметров сопла | Включи thin wall compensation в слайсере, исправь модель |

#### Механические дефекты

| Дефект | Фото | Причины | Решение |
|--------|------|---------|---------|
| **Сдвиг слоёв** | ![](https://static.insales-cdn.com/files/1/697/1712825/original/400-Layer-Shifting.jpg) | Ускорение выше возможностей моторов, слабые ремни, механические препятствия | Снизь ускорение, проверь натяг ремней, убери препятствия в зоне движения |
| **Деформация / коробление** | ![](https://static.insales-cdn.com/files/1/1241/1713369/original/200-Curling-And-Warping.jpg) | Усадка материала при остывании | Грей стол до нужной температуры, не охлаждай первые слои, закрой принтер от сквозняков |
| **Расслоение** | ![](https://static.insales-cdn.com/files/1/1243/1713371/original/400-Layers-Splitting-Or-Cracking.jpg) | Слои не слипаются из-за низкой температуры | Подними температуру сопла на 10°C, уменьши охлаждение, проверь высоту слоя (макс 80% от диаметра сопла) |
| **Вибрации / рингинг (призраки)** | ![](https://static.insales-cdn.com/files/1/1295/1713423/original/200-Vibrations-And-Ringing.jpg) | Инерция головы при смене направления | Подтяни ремни, снизь ускорение и jerk, включи **Input Shaper** в Klipper — полностью устраняет проблему |

#### Температуры по материалам (k3d.tech)

| Материал | Сопло | Стол |
|----------|-------|------|
| PLA | 210°C | 60°C |
| PETG | 235°C | 75°C |
| ABS/ASA | 280–290°C | 110°C |
| HIPS | 270°C | 100°C |
| PC (поликарбонат) | 280–290°C | 120°C |
| PA12 (Нейлон) | 250°C | 100°C |
| ABS CF/GF | 290°C | 110°C |

> ⚠️ PTFE трубка ограничена 250°C. Для высокотемпературных материалов нужна full-metal хотенд зона.

---

## Скрипты обслуживания

В папке `scripts/` три скрипта для регулярного обслуживания системы.

### backup.sh — Резервное копирование

Архивирует `printer.cfg`, конфиг OctoPrint и список плагинов. Хранит последние 7 бэкапов.

```bash
# Локальный бэкап (в ~/backups/3dprinter/)
bash scripts/backup.sh

# Бэкап + отправка архива в Telegram
TELEGRAM_TOKEN=xxx TELEGRAM_CHAT_ID=yyy bash scripts/backup.sh --tg
```

### update.sh — Обновление системы

Обновляет OctoPrint, все плагины, Klipper и камеру одной командой.

```bash
bash scripts/update.sh
```

### health_check.sh — Мониторинг сервисов

Проверяет: OctoPrint, Klipper, webcam, ADXL345 MCU, диск, RAM, CPU-температуру.  
При проблемах — отправляет алерт в Telegram.

```bash
# Разовая проверка
bash scripts/health_check.sh

# С Telegram-алертами
TELEGRAM_TOKEN=xxx TELEGRAM_CHAT_ID=yyy bash scripts/health_check.sh
```

**Автозапуск через cron каждые 5 минут:**

```bash
crontab -e
```

Добавить строку:

```
*/5 * * * * TELEGRAM_TOKEN=<token> TELEGRAM_CHAT_ID=<chat_id> /home/pi/3d-printer-control/scripts/health_check.sh >> /home/pi/health_check.log 2>&1
```

Где взять `TELEGRAM_CHAT_ID`: напиши боту `/start`, затем открой `https://api.telegram.org/bot<TOKEN>/getUpdates` — `chat.id` в ответе.

---

## Онлайн-слайсер

Веб-приложение для просмотра STL-файлов и слайсинга прямо в браузере. Не нужно устанавливать программы — открываешь сайт, загружаешь модель, настраиваешь и получаешь G-code.

**Путь в репозитории:** `online-slicer/`

### Стек технологий

| Часть | Технологии | Назначение |
|-------|-----------|------------|
| Frontend | React 19, Vite 8 | UI фреймворк и сборщик |
| 3D движок | Three.js, @react-three/fiber, @react-three/drei | Рендеринг 3D моделей |
| UI библиотека | TailwindCSS | Стилизация |
| Анимации | Framer Motion | Плавные переходы |
| HTTP клиент | Axios | Запросы к backend |
| Backend | Node.js, Express 5 | API сервер |
| Загрузка файлов | Multer | Обработка STL загрузок |
| База данных | Mongoose (MongoDB) | Хранение истории |

### Структура проекта

```
online-slicer/
├── frontend/              # React приложение
│   ├── src/
│   │   ├── components/
│   │   │   ├── STLViewer.jsx        # 3D просмотр модели в браузере
│   │   │   ├── Header.jsx           # Шапка приложения
│   │   │   ├── Hero.jsx             # Главный экран
│   │   │   ├── Services.jsx         # Список возможностей
│   │   │   ├── Portfolio.jsx        # Примеры работ
│   │   │   └── CalculatorForm.jsx   # Калькулятор стоимости печати
│   │   ├── pages/
│   │   │   └── Home.jsx             # Главная страница
│   │   ├── api/
│   │   │   ├── api.js               # Запросы к backend
│   │   │   └── server.js            # (дублирующий файл)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Express API сервер
│   ├── server.js          # Основной файл — все маршруты
│   ├── uploads/           # Загруженные STL файлы
│   └── package.json
│
└── print3d-app/           # Дополнительное React приложение
    ├── src/
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

### Установка зависимостей

```bash
# Backend
cd online-slicer/backend
npm install

# Frontend (основной)
cd ../frontend
npm install

# print3d-app (дополнительный)
cd ../print3d-app
npm install
```

### Запуск для разработки

```bash
# Терминал 1: Backend
cd online-slicer/backend
npm start
# Сервер запущен на http://localhost:3000

# Терминал 2: Frontend
cd online-slicer/frontend
npm run dev
# Приложение открывается на http://localhost:5173

# Терминал 3 (опционально): print3d-app
cd online-slicer/print3d-app
npm run dev
# На http://localhost:5174
```

### Сборка для продакшена

```bash
# Собрать frontend
cd online-slicer/frontend
npm run build
# Результат в папке dist/

# Backend запускается напрямую (Node.js не требует сборки)
cd online-slicer/backend
npm start
```

### Переменные окружения

Создай файл `online-slicer/backend/.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/slicer
UPLOAD_DIR=./uploads
```

---

## Troubleshooting

### OctoPrint не запускается

```bash
# Посмотреть логи
journalctl -u octoprint -n 100

# Частые причины:
# 1. Порт 5000 занят — проверь
ss -tlnp | grep 5000

# 2. Виртуальное окружение повреждено — пересоздай
rm -rf ~/oprint
python3 -m venv ~/oprint
source ~/oprint/bin/activate
pip install OctoPrint
```

---

### Klipper не видит MCU принтера

```bash
# Проверить все серийные порты
ls /dev/ttyUSB* /dev/ttyACM* /dev/serial/by-id/

# Если ничего нет — кабель не подключён или MCU не прошит
# Если есть — добавить pi в группу dialout
sudo usermod -a -G dialout pi
sudo reboot

# Проверить что порт в printer.cfg правильный
nano ~/printer_data/config/printer.cfg
# Найди [mcu] → serial:
```

---

### Klipper: "mcu 'mcu': Unable to connect"

Причина 1: Неправильный серийный порт в printer.cfg
```bash
ls /dev/serial/by-id/
# Скопируй точный путь в [mcu] serial:
```

Причина 2: MCU не прошит прошивкой Klipper
```bash
# Нужно перекомпилировать и прошить (смотри Шаг 8)
cd ~/klipper
make menuconfig
make
# Скопировать klipper.bin на SD карту принтера
```

Причина 3: Pi не в группе dialout
```bash
groups pi | grep dialout
# Если нет dialout:
sudo usermod -a -G dialout pi
sudo reboot
```

---

### Камера не работает в OctoPrint

```bash
# Проверить что камера определяется системой
ls /dev/video*
v4l2-ctl --list-devices

# Проверить что mjpg-streamer запущен
sudo systemctl status webcam

# Попробовать запустить вручную и посмотреть ошибку
mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" -o "output_http.so -p 8080"

# Проверить стрим вручную
curl http://localhost:8080/?action=snapshot -o /tmp/test.jpg
ls -la /tmp/test.jpg   # если файл создался — стример работает
```

Проверь URL в OctoPrint Settings → Webcam:
- Stream: `http://127.0.0.1:8080/?action=stream`
- Snapshot: `http://127.0.0.1:8080/?action=snapshot`

---

### Telegram-бот не отвечает

```bash
# 1. Проверить что OctoPrint работает
sudo systemctl status octoprint

# 2. Посмотреть логи OctoPrint (ищи ошибки telegram)
tail -f ~/.octoprint/logs/octoprint.log | grep -i telegram
```

В OctoPrint:
- Settings → Telegram → убедись что токен правильный
- Нажми кнопку Test — бот должен прислать тестовое сообщение
- Проверь что в разделе Users есть твой аккаунт с правами Admin

---

### Принтер перегревается / Pi Zero 2 WH перегревается

```bash
# Температура CPU Pi
vcgencmd measure_temp

# Если выше 80°C — нужен радиатор
# Если выше 85°C — Pi начнёт throttling (замедление)
```

Решения:
- Приклей медный или алюминиевый радиатор на чип Pi
- Добавь небольшой 5V кулер (30×30 мм)
- Убедись что корпус Pi не закрыт — нужна вентиляция

---

### Klipper: "Unable to open config file"

```bash
# Убедись что файл существует
ls ~/printer_data/config/printer.cfg

# Если нет — создай директорию и скопируй
mkdir -p ~/printer_data/config
cp ~/3d-printer-control/klipper/printer.cfg ~/printer_data/config/
```

---

### Проверка что всё работает

```bash
# Все сервисы должны быть active (running)
sudo systemctl status octoprint
sudo systemctl status klipper
sudo systemctl status webcam

# Температуры CPU Pi
vcgencmd measure_temp

# Использование RAM (на Zero 2 должно оставаться > 100 MB свободно)
free -h

# Свободное место на SD карте
df -h /
```
