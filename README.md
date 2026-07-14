<div align="center">

[English](README_EN.md) • **Русский**

</div>

# 3D Printer Control 🖨️

<p align="center">
  <a href="https://github.com/Mukller">
    <img src="https://img.shields.io/badge/Anton%20Petnitsky-Developer-0d1117?style=for-the-badge&logo=github&logoColor=white&labelColor=0d1117&color=58a6ff" alt="Anton Petnitsky" />
  </a>
</p>

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Raspberry%20Pi-red)
![OctoPrint](https://img.shields.io/badge/OctoPrint-1.9+-orange)

**Полный стек управления 3D-принтером: OctoPrint + Klipper + Telegram-бот + сборка образа для Raspberry Pi**

Этот репозиторий содержит конфиги, скрипты и документацию для восстановления и поддержания работоспособности домашней системы управления 3D-принтером на базе Raspberry Pi. Принтер — **Creality Ender 5 S1**.

---

## 🌟 Что включено

- **OctoPrint** — веб-интерфейс управления принтером
- **Klipper** — прошивка принтера с расширенными возможностями
- **Telegram-бот** — дистанционное управление через Telegram (плагин OctoTelegram)
- **Конфиги плагинов** — PSU Control, PrintWatch, SlicerEstimator, UI Customizer и другие
- **Скрипты установки** — автоматическая настройка чистой системы
- **Образ Raspberry Pi** — готовый образ (будет добавлен позже)

---

## 🤖 Команды Telegram-бота

| Команда | Описание |
|---------|----------|
| `/status` | Текущее состояние принтера + фото с камеры |
| `/print` | Начать печать выбранного файла |
| `/togglepause` | Пауза / продолжить печать |
| `/abort` | Экстренная остановка 🆘 |
| `/files` | Список доступных файлов |
| `/upload` | Загрузить G-code файл |
| `/filament` | Информация о филаменте |
| `/ctrl` | Контрольные команды принтера |
| `/tune` | Настройки в процессе печати |
| `/sys` | Информация о системе |
| `/con` | Состояние подключения |
| `/settings` | Настройки уведомлений |
| `/gif` | GIF из 20 фото с камеры |
| `/supergif` | GIF из 60 фото с камеры |
| `/shutup` | Замолчать (мут уведомлений) |
| `/dontshutup` | Размут уведомлений |
| `/help` | Помощь |

---

## 🔌 Установленные плагины OctoPrint

| Плагин | Назначение |
|--------|-----------|
| [OctoTelegram](https://plugins.octoprint.org/plugins/telegram/) | Telegram-бот управления — **основной** |
| [PSU Control eWeLink](https://plugins.octoprint.org/plugins/psucontrol_ewelink/) | Управление питанием принтера через eWeLink/Sonoff |
| [PrintWatch](https://plugins.octoprint.org/plugins/printwatch/) | ИИ-мониторинг качества печати |
| [SlicerEstimator](https://plugins.octoprint.org/plugins/SlicerEstimator/) | Точное расчётное время печати |
| [UI Customizer](https://plugins.octoprint.org/plugins/uicustomizer/) | Кастомизация интерфейса OctoPrint |
| [Bit-Bang SPI](https://plugins.octoprint.org/plugins/bitbang/) | Дополнительный контроль GPIO |
| OctoEverywhere | Удалённый доступ к OctoPrint из интернета |

---

## 🏗️ Структура проекта

```
3d-printer-control/
├── octoprint/
│   ├── config/           # Конфигурационные шаблоны OctoPrint
│   │   └── config.yaml.example
│   ├── scripts/
│   │   └── install-plugins.sh
│   └── plugins.txt       # Список плагинов для установки
├── klipper/
│   └── printer.cfg       # Конфиг Klipper для Ender 5 S1
├── telegram-bot/
│   └── config-template.json  # Шаблон конфига Telegram-плагина
├── scripts/
│   ├── setup.sh          # Полная установка с нуля
│   └── install-octoprint.sh
├── docs/
│   ├── SETUP.md          # Гайд пошаговой установки
│   ├── PLUGINS.md        # Документация по плагинам
│   └── KLIPPER.md        # Настройка Klipper
├── chat-export/          # История Telegram-бота (сентябрь-октябрь 2024)
│   └── result.json
└── image/                # (будет позже) готовый образ для Pi
```

---

## 🌐 Online-Slicer (веб-модуль)

В подпапке [`online-slicer/`](online-slicer/) находится отдельный веб-модуль — онлайн-платформа для просмотра и слайсирования 3D-моделей (STL) прямо в браузере: Node.js/Express бэкенд + React/Three.js фронтенд + отдельное приложение печати. Полная документация — в [online-slicer/README.md](online-slicer/README.md).

---

## 🚀 Быстрый старт

### Требования

- Raspberry Pi 4 (рекомендуется 2GB+ RAM) или Pi 3B+
- microSD карта 16GB+
- Creality Ender 5 S1 (или любой другой принтер с Marlin/Klipper)
- USB-камера для прямой трансляции
- Telegram-аккаунт для создания бота

### Установка

**1. Запиши базовый образ Raspberry Pi OS Lite на SD:**
```bash
# Используй Raspberry Pi Imager
# Выбери: Raspberry Pi OS Lite (64-bit)
```

**2. Клонируй этот репозиторий на Pi:**
```bash
git clone https://github.com/Mukller/3d-printer-control.git
cd 3d-printer-control
```

**3. Запусти скрипт установки:**
```bash
chmod +x scripts/setup.sh
sudo ./scripts/setup.sh
```

Подробная инструкция: [docs/SETUP.md](docs/SETUP.md)

---

## ⚙️ Принтер

- **Модель:** Creality Ender 5 S1
- **Прошивка:** Klipper (через OctoPrint + Moonraker)
- **Материалы:** PLA (190-215°C / 60°C), PETG (220-235°C / 85°C)
- **Камера:** USB-камера (встроенная в стримлинг через OctoPrint)

---

## 📋 Документация

- [Гайд установки](docs/SETUP.md)
- [Плагины OctoPrint](docs/PLUGINS.md)
- [Настройка Klipper](docs/KLIPPER.md)
- [README на английском](README_EN.md)
- [История изменений](CHANGELOG.md)

---

## 📝 Лицензия

MIT — см. [LICENSE.md](LICENSE.md)

---

## 👤 Автор

**Mukller** — [GitHub](https://github.com/Mukller)
