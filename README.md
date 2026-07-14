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

Система работает на **Raspberry Pi Zero 2 WH** с принтером **Creality Ender 5 S1**. Управление через Telegram в реальном времени: фото с температурами каждые 2 мм, старт/стоп/пауза, загрузка файлов прямо в чат.

---

## Содержание

- [Оборудование](#оборудование)
- [Архитектура](#архитектура)
- [Установка](#установка)
- [Klipper](#klipper)
- [Плагины OctoPrint](#плагины-octoprint)
- [Telegram-бот](#telegram-бот)
- [Команды бота](#команды-бота)
- [Камера](#камера)
- [Управление питанием](#управление-питанием)
- [Калибровки](#калибровки)
- [Онлайн-слайсер](#онлайн-слайсер)
- [Troubleshooting](#troubleshooting)

---

## Оборудование

| Компонент | Модель |
|-----------|--------|
| Принтер | Creality Ender 5 S1 |
| MCU принтера | STM32F401 |
| Одноплатник | Raspberry Pi Zero 2 WH |
| Камера | Logitech USB-камера (ранее Pi Camera Module) |
| Управление питанием | Реле-модуль (GPIO) |
| Слайсер | Orca Slicer |

> **Важно:** Pi Zero 2 WH (512 MB RAM, 1 GHz) — минимальные требования для OctoPrint + Klipper. Рекомендуется Pi 3B+ или Pi 4 для комфортной работы.

---

## Архитектура

```
Telegram
   │
   ▼
OctoTelegram plugin
   │
   ▼
OctoPrint (порт 5000)
   │
   ├── Klipper (klippy.py)
   │      │
   │      ▼
   │   STM32F401 (MCU принтера) → моторы, нагрев, датчики
   │
   └── mjpg-streamer (порт 8080) → Logitech камера
```

---

## Установка

### Шаг 1: Прошивка Raspberry Pi OS

1. Скачай [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Выбери: **Raspberry Pi OS Lite (64-bit)**
3. В расширенных настройках (⚙️):
   - Включи SSH
   - Задай имя пользователя: `pi`
   - Пропиши Wi-Fi
   - Имя хоста: `raspberrypi`
4. Запиши на SD карту

### Шаг 2: Первое подключение

```bash
ssh pi@raspberrypi.local

# Клонировать репо
git clone https://github.com/Mukller/3d-printer-control.git
cd 3d-printer-control

# Запустить установку
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
```

### Шаг 3: Установка OctoPrint

```bash
# Создать виртуальное окружение
python3 -m venv ~/oprint
source ~/oprint/bin/activate

# Установить OctoPrint
pip install OctoPrint

# Создать systemd сервис
sudo nano /etc/systemd/system/octoprint.service
```

Содержимое файла сервиса:

```ini
[Unit]
Description=OctoPrint
After=network.target

[Service]
User=pi
ExecStart=/home/pi/oprint/bin/octoprint serve
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable octoprint
sudo systemctl start octoprint
```

### Шаг 4: Установка Klipper

```bash
cd ~
git clone https://github.com/Klipper3d/klipper
./klipper/scripts/install-octopi.sh
```

### Шаг 5: Прошивка MCU принтера (STM32F401)

Это обязательный шаг — без него Klipper не подключится к принтеру.

```bash
cd ~/klipper
make menuconfig
```

Настройки для Ender 5 S1:

| Параметр | Значение |
|----------|----------|
| Micro-controller | STM32 |
| Processor model | STM32F401 |
| Bootloader offset | 32KiB bootloader |
| Communication interface | Serial (USART1 PA10/PA9) |
| Baud rate | 250000 |

```bash
make

# Скопировать прошивку на SD карту принтера
cp out/klipper.bin /media/pi/SDCARD/firmware.bin
```

Вставь SD карту в принтер и сделай перезагрузку питанием. Принтер автоматически прошьётся.

### Шаг 6: Настройка serial-порта

```bash
# Найти порт принтера
ls /dev/serial/by-id/
# Пример: usb-1a86_USB_Serial-if00-port0
```

Прописать в `klipper/printer.cfg`:

```ini
[mcu]
serial: /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0
```

### Шаг 7: Установка плагинов OctoPrint

```bash
source ~/oprint/bin/activate
cd ~/3d-printer-control
./octoprint/scripts/install-plugins.sh
sudo systemctl restart octoprint
```

### Шаг 8: Настройка Telegram-бота

1. Напиши [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot` → задай имя и username
3. Скопируй токен

В OctoPrint → Settings → Telegram:
- Вставь токен
- Напиши боту `/start`
- Выдай себе доступ в настройках плагина

### Шаг 9: Z-offset калибровка

```gcode
G28
PROBE_CALIBRATE
ACCEPT
SAVE_CONFIG
```

---

## Klipper

### Что такое Klipper

Klipper — прошивка принтера, которая работает на Raspberry Pi. В отличие от Marlin (стандартная прошивка Ender 5 S1), Klipper переносит вычисления с MCU принтера на Pi — это даёт:

- **Input Shaping** — компенсация вибраций, лучшее качество на высоких скоростях
- **Pressure Advance** — улучшение углов и переходов
- **Live config** — изменение настроек без перепрошивки
- Более точное управление температурами

### Архитектура

```
[Raspberry Pi]  ←USB→  [STM32F401 на Ender 5 S1]
    Klippy (Python)
    OctoPrint
```

### Конфиг printer.cfg

Конфиг находится в `klipper/printer.cfg`. Основные параметры для Ender 5 S1:

```ini
[mcu]
serial: /dev/serial/by-id/usb-1a86_USB_Serial-if00-port0

[printer]
kinematics: cartesian
max_velocity: 300
max_accel: 3000
max_z_velocity: 5
max_z_accel: 100
```

### Макросы

Макросы — это кастомные G-code команды. `PAUSE`/`RESUME`/`CANCEL_PRINT` обязательны для корректной работы кнопок в OctoPrint.

```ini
[gcode_macro PAUSE]
rename_existing: BASE_PAUSE
gcode:
  BASE_PAUSE
  G91
  G1 Z10 F300
  G90

[gcode_macro RESUME]
rename_existing: BASE_RESUME
gcode:
  BASE_RESUME

[gcode_macro CANCEL_PRINT]
rename_existing: BASE_CANCEL_PRINT
gcode:
  BASE_CANCEL_PRINT
  G28 X Y

[gcode_macro PREHEAT_PLA]
gcode:
  M140 S60
  M104 S210
  M117 Preheating PLA...

[gcode_macro PREHEAT_PETG]
gcode:
  M140 S85
  M104 S225
  M117 Preheating PETG...
```

### Полезные команды Klipper

```gcode
FIRMWARE_RESTART      ; перезапуск Klipper
G28                   ; парковка всех осей
M119                  ; состояние концевиков
GET_POSITION          ; текущая позиция
BED_MESH_OUTPUT       ; показать текущую сетку
STATUS                ; состояние принтера
PREHEAT_PLA           ; разогрев под PLA
PREHEAT_PETG          ; разогрев под PETG
```

---

## Плагины OctoPrint

### OctoTelegram (основной)

**Repo:** https://github.com/fabianonline/OctoPrint-Telegram

Главный плагин — управление принтером через Telegram. Присылает фото с температурами автоматически каждые 2 мм Z-высоты.

```bash
pip install https://github.com/fabianonline/OctoPrint-Telegram/archive/stable.zip
```

### PSU Control + GPIO реле

**Repo:** https://github.com/kantlivelong/OctoPrint-PSUControl

Управление питанием принтера через GPIO pin Raspberry Pi → реле-модуль → провод питания принтера.

Настройки в OctoPrint → Settings → PSU Control:
- Switching method: GPIO
- GPIO Pin: `17` (замените на свой свободный пин)
- Active Low: зависит от вашего реле

> **Альтернатива:** Sonoff умная розетка + [PSU Control eWeLink](https://github.com/airens/OctoPrint-PSUControl-eWeLink)

### OctoEverywhere ⭐ Рекомендуется

**Сайт:** https://octoeverywhere.com

Зашифрованный туннель для удалённого доступа к OctoPrint без проброса портов. Встроенный AI-мониторинг дефектов печати (функция **Gadget**) — автоматически обнаруживает спагетти, сдвиги слоёв и другие дефекты.

Бесплатный тир: 1 принтер.

### PrintWatch (альтернатива OctoEverywhere Gadget)

**Repo:** https://github.com/printpal-io/OctoPrint-PrintWatch

AI-детектор дефектов печати. Требует API ключ с printpal.io.

> **Используй одно из двух:** OctoEverywhere Gadget **или** PrintWatch. Не запускай оба одновременно.

### SlicerEstimator

**Repo:** https://github.com/NillerMedDild/Octoprint-SlicerEstimator

Точное время печати из метаданных слайсера (M73 команды). Работает с Orca Slicer, Cura, PrusaSlicer, Bambu Studio.

Включи в Orca Slicer: Printer Settings → Machine G-code → добавь `M73 P[layer_num]` в layer change G-code.

### UI Customizer

**Repo:** https://github.com/LazeMSS/OctoPrint-UICustomizer

Тёмная тема и настройка раскладки веб-интерфейса OctoPrint.

### Bit-Bang SPI

**Repo:** https://github.com/RoboMagus/OctoPrint-Bit-Bang

Дополнительное управление GPIO/SPI с OctoPrint.

---

## Telegram-бот

Бот работает через плагин **OctoTelegram**. При запуске OctoPrint бот присылает:

```
🚀 Hello. I'm online and ready to receive your commands.
```

При выключении:

```
🐙 💤 Shutting down. Goodbye.
```

### Автоматические уведомления

| Событие | Сообщение |
|---------|-----------|
| Подключение принтера | `🔗 Printer Connected` |
| Отключение принтера | `💔 Printer Disconnected` |
| Ошибка принтера | `⚠ ⚠ ⚠Printer Error {message}` |
| Начало печати | `Started printing {file}.` + фото |
| Конец печати | `Finished printing {file}.` + фото |
| Каждые 2 мм Z | Фото + температуры + прогресс |
| Парковка (G28) | `🏠 Printer received home command \nBed {t}/{target}, Extruder {t}/{target}` |

Формат сообщений о прогрессе:

```
Printing at Z=3.2.
Bed 86.39/86.0, Extruder 225.03/225.0.
00:31:11, 25% done, 00:40:26 remaining.
Completed time 15:41:14.
```

### Профили температур

| Материал | Стол | Экструдер |
|----------|------|-----------|
| PLA | 60°C | 210°C |
| PETG | 85–86°C | 224–225°C |

---

## Команды бота

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
| `/gcode` | Отправить G-code команду |

### Ответы бота на команды

```
/on  → ❓ Turn on the Printer?  [✅ Yes] [❌ No]
      → ✅ Command executed.
      → ⚠Printer has already been turned on.

/off → ✅ Shutdown Command executed.
      → ⚠Printer has already been turned off.

/upload → ℹ To upload a gcode file (also accept zip file), just send it to me.
          The file will be stored in 'TelegramPlugin' folder.

# После отправки файла:
→ 📥 I've successfully saved the file you sent me as TelegramPlugin/{filename}.

/print (без файлов) → Maybe next time.
/print (файл есть)  → 🚀 Started the print job.

# Неизвестная команда:
→ I do not understand you! 😖
```

---

## Камера

### Logitech USB-камера (mjpg-streamer)

```bash
sudo apt-get install -y cmake libjpeg62-turbo-dev
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer/mjpg-streamer-experimental
make
sudo make install

# Запуск
mjpg_streamer \
  -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" \
  -o "output_http.so -p 8080 -w /usr/local/share/mjpg-streamer/www"
```

Systemd сервис (`/etc/systemd/system/webcam.service`):

```ini
[Unit]
Description=mjpg-streamer webcam
After=network.target

[Service]
User=pi
ExecStart=/usr/local/bin/mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 640x480 -f 15" -o "output_http.so -p 8080"
Restart=always

[Install]
WantedBy=multi-user.target
```

URL стрима: `http://raspberrypi.local:8080/?action=stream`
URL снапшота: `http://raspberrypi.local:8080/?action=snapshot`

В OctoPrint → Settings → Webcam:
- Stream URL: `http://127.0.0.1:8080/?action=stream`
- Snapshot URL: `http://127.0.0.1:8080/?action=snapshot`

### Pi Camera Module (camera-streamer)

```bash
sudo apt-get install -y libcamera-dev liblivemedia-dev
git clone https://github.com/ayufan/camera-streamer.git
cd camera-streamer
make
sudo make install

# Запуск для Pi Camera
camera-streamer \
  --camera-path=/base/soc/i2c0mux/i2c@1/imx219@10 \
  --camera-type=libcamera \
  --http-port=8080
```

---

## Управление питанием

### Схема с GPIO реле (оригинальная)

```
Pi GPIO17 → Реле-модуль → разрыв в проводе 220V принтера
```

Реле-модуль подключается:
- VCC → Pi 5V
- GND → Pi GND
- IN → Pi GPIO17 (или другой свободный пин)

Настройка PSU Control плагина:
- Switching method: **GPIO**
- GPIO Pin: `17` ← замените на свой пин
- Active Low: `True` (для большинства реле-модулей с оптопарой)

### Схема с Sonoff (альтернатива)

1. Купи Sonoff S26 или Sonoff Basic
2. Подключи принтер через Sonoff
3. Настрой в приложении eWeLink
4. Установи плагин [PSU Control eWeLink](https://github.com/airens/OctoPrint-PSUControl-eWeLink)
5. OctoPrint → Settings → PSU Control eWeLink → введи логин/пароль eWeLink → выбери устройство

### HAProxy (опционально)

Если хочешь единый URL без портов:

```bash
sudo apt-get install haproxy
sudo nano /etc/haproxy/haproxy.cfg
```

```
frontend octoprint
    bind *:80
    acl is_webcam path_beg /webcam/
    use_backend webcam if is_webcam
    default_backend octoprint

backend octoprint
    server octoprint 127.0.0.1:5000

backend webcam
    server webcam 127.0.0.1:8080
```

После этого: `http://raspberrypi.local/` → OctoPrint, `http://raspberrypi.local/webcam/` → камера.

> На Pi Zero 2 WH HAProxy создаёт дополнительную нагрузку. Без него: OctoPrint на `:5000`, камера на `:8080`.

---

## Калибровки

### Слайсер

Основной слайсер — **Orca Slicer** (отличная поддержка Klipper, готовые профили для Ender 5 S1).
Альтернатива — Creality Print (родной слайсер, профиль CE5S1 из коробки).

В Orca Slicer включи M73 прогресс для SlicerEstimator: Printer Settings → Machine G-code.

### PID калибровка (обязательно после настройки)

```gcode
# Экструдер (PETG)
PID_CALIBRATE HEATER=extruder TARGET=225
# Экструдер (PLA)
PID_CALIBRATE HEATER=extruder TARGET=210
# Стол
PID_CALIBRATE HEATER=heater_bed TARGET=85
SAVE_CONFIG
```

### E-steps (калибровка экструдера)

```gcode
G91
M83
G1 E100 F50
# Измерить фактически выдавленное, рассчитать:
# new_rotation_distance = old * actual / commanded
```

### Z-Offset (CR Touch)

```gcode
G28
PROBE_CALIBRATE
# Используй бумажный тест: TESTZ Z=-0.1 / TESTZ Z=+0.1
ACCEPT
SAVE_CONFIG
```

### Bed Mesh

```gcode
G28
BED_MESH_CALIBRATE
SAVE_CONFIG
```

### Pressure Advance

```gcode
SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY=1 ACCEL=500
TUNING_TOWER COMMAND=SET_PRESSURE_ADVANCE PARAMETER=ADVANCE START=0 FACTOR=.005
# Найди оптимальный слой, рассчитай:
# pressure_advance = START + height * FACTOR
```

### Полезные ресурсы по калибровке

- [k3d.tech/calibrations](https://k3d.tech/calibrations/) — калибровки для Klipper
- [3dpt.ru FAQ](https://3dpt.ru/page/faq) — частые вопросы по 3D печати
- [3dtool.ru — дефекты FDM](https://3dtool.ru/stati/defekty-3d-pechati-osnovnye-problemy-i-resheniya-v-fdm-tekhnologii/) — дефекты и решения
- [3d-diy.ru — проблемы печати](https://3d-diy.ru/blog/osnovnye-problemy-3d-pechati-sposoby-ih-resheniya/) — основные проблемы и решения
- [Klipper Config Reference](https://www.klipper3d.org/Config_Reference.html) — официальная документация

---

## Онлайн-слайсер

Веб-приложение для просмотра и слайсинга STL файлов прямо в браузере, без установки программ.

**Путь:** `online-slicer/`

### Стек

| Часть | Технологии |
|-------|-----------|
| Frontend | React 19, Vite, Three.js, @react-three/fiber, TailwindCSS, Framer Motion |
| Backend | Node.js, Express 5, Multer (загрузка файлов), Mongoose |
| 3D рендеринг | Three.js + @react-three/drei |

### Структура

```
online-slicer/
├── frontend/          # React приложение
│   └── src/
│       ├── components/
│       │   ├── STLViewer.jsx    # 3D просмотр модели
│       │   ├── Header.jsx
│       │   ├── Hero.jsx
│       │   ├── Services.jsx
│       │   ├── Portfolio.jsx
│       │   └── CalculatorForm.jsx
│       ├── pages/
│       │   └── Home.jsx
│       └── api/
│           └── api.js           # запросы к backend
├── backend/           # Express сервер
│   └── server.js      # API + загрузка файлов
└── print3d-app/       # дополнительное React приложение
```

### Запуск

```bash
# Backend
cd online-slicer/backend
npm install
npm start
# Сервер на http://localhost:3000

# Frontend
cd online-slicer/frontend
npm install
npm run dev
# Приложение на http://localhost:5173
```

---

## Troubleshooting

**OctoPrint не запускается:**
```bash
journalctl -u octoprint -n 50
```

**Klipper не видит MCU:**
```bash
ls /dev/ttyUSB* /dev/ttyACM*
sudo usermod -a -G dialout pi
# Проверить serial в printer.cfg
```

**Камера не определяется:**
```bash
v4l2-ctl --list-devices
# Убедись что /dev/video0 существует
ls /dev/video*
```

**Бот не отвечает:**
- Проверь токен в OctoPrint → Settings → Telegram
- Убедись что OctoPrint работает: `sudo systemctl status octoprint`
- Проверь что выдал себе доступ в настройках плагина

**Klipper: "mcu 'mcu': Unable to connect":**
```bash
ls /dev/serial/by-id/
# Обновить путь в printer.cfg → [mcu] serial:
```

**Перегрев Pi Zero 2 WH:**
```bash
# Проверить температуру CPU
vcgencmd measure_temp
# Добавить радиатор или небольшой кулер
```
