# Development Guide (Гайд разработки)

Полное руководство для локальной разработки Online-Slicer.

---

## 📋 Оглавление

- [Предварительные требования](#предварительные-требования)
- [Установка](#установка)
- [Структура проекта](#структура-проекта)
- [Запуск проекта](#запуск-проекта)
- [Команды разработки](#команды-разработки)
- [Дебаггинг](#дебаггинг)
- [Тестирование](#тестирование)
- [Трабблшутинг](#трабблшутинг)

---

## Предварительные требования

### Обязательные

- **Git** — система контроля версий
  ```bash
  git --version
  # git version 2.x.x
  ```

- **Node.js 18.x или выше**
  ```bash
  node --version
  # v18.16.0 или выше
  
  npm --version
  # 9.5.0 или выше
  ```

- **MongoDB 5.0 или выше**
  ```bash
  # Локально или облачный сервис (MongoDB Atlas)
  mongo --version
  ```

### Рекомендуемые

- **Visual Studio Code** — редактор кода
  - Расширения:
    - ES7+ React/Redux/React-Native snippets
    - Prettier - Code formatter
    - ESLint
    - Thunder Client (для тестирования API)

- **Postman** или **Thunder Client** — для тестирования API

- **MongoDB Compass** — GUI для MongoDB

- **Git GUI** — GitHub Desktop или SourceTree

---

## Установка

### 1️⃣ Форк и клон репозитория

```bash
# На GitHub нажми "Fork"
# Затем клонируй свою копию

git clone https://github.com/YOUR_USERNAME/Online-slicer.git
cd Online-slicer

# Добавь upstream для синхронизации
git remote add upstream https://github.com/Mukller/Online-slicer.git
```

### 2️⃣ Проверь Node.js и npm

```bash
node --version  # v18.x.x или выше
npm --version   # 9.x.x или выше
npm update -g   # Обновить npm (опционально)
```

### 3️⃣ Создай файл .env

**Backend:**
```bash
cd backend
touch .env
```

Содержание `backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/online-slicer
# Или облачный сервис:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/online-slicer

# API
CORS_ORIGIN=http://localhost:5173
API_URL=http://localhost:5000

# File Upload
MAX_FILE_SIZE=100000000 # 100MB
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=debug
```

**Frontend:**
```bash
cd ../frontend
touch .env.local
```

Содержание `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
```

### 4️⃣ Установи зависимости

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Print3D App
cd ../print3d-app
npm install

# Вернись в корень
cd ..
```

### 5️⃣ Подготовь MongoDB

```bash
# Опция 1: Локально (если установлен MongoDB)
mongod

# Опция 2: Docker контейнер
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Опция 3: MongoDB Atlas (облако)
# Зарегистрируйся на https://www.mongodb.com/cloud/atlas
# Скопируй URI в .env файл
```

---

## Структура проекта

```
Online-slicer/
│
├── backend/                    # Node.js + Express
│   ├── server.js              # Точка входа
│   ├── package.json
│   ├── .env.example           # Пример переменных
│   ├── routes/                # API маршруты
│   ├── models/                # Mongoose схемы
│   ├── controllers/           # Бизнес логика
│   ├── middleware/            # Express middleware
│   ├── utils/                 # Утилиты
│   └── uploads/               # Загруженные файлы
│
├── frontend/                  # React + Vite
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .eslintrc.js
│   ├── src/
│   │   ├── App.jsx           # Главный компонент
│   │   ├── main.jsx          # Точка входа
│   │   ├── components/       # React компоненты
│   │   │   ├── Viewer3D.jsx
│   │   │   ├── ModelUpload.jsx
│   │   │   ├── Slicer.jsx
│   │   │   └── ...
│   │   ├── pages/            # Страницы приложения
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API сервисы
│   │   │   └── api.js        # Axios конфиг
│   │   ├── utils/            # Утилиты
│   │   ├── styles/           # Глобальные стили
│   │   └── assets/           # Изображения, иконки
│   └── public/               # Статические файлы
│
├── print3d-app/              # Отдельное приложение
│   ├── package.json
│   └── src/
│
├── docs/                     # Документация (планируется)
├── .gitignore
├── README.md
├── CONTRIBUTING.md
├── LICENSE.md
├── CHANGELOG.md
└── ...
```

---

## Запуск проекта

### Способ 1: Три терминала (рекомендуется для разработки)

**Терминал 1 — MongoDB:**
```bash
# Если используешь локальный MongoDB
mongod

# Или Docker
docker-compose up mongodb
```

**Терминал 2 — Backend:**
```bash
cd backend
npm start
# или для автоперезагрузки
npm install -g nodemon
nodemon server.js
```

Output:
```
Server running on http://localhost:5000
Connected to MongoDB
```

**Терминал 3 — Frontend:**
```bash
cd frontend
npm run dev
```

Output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Способ 2: Docker Compose (для production-подобной среды)

```bash
# Убедись, что у тебя установлен Docker и Docker Compose
docker-compose up

# Приложение будет доступно на http://localhost:3000
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/online-slicer

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

---

## Команды разработки

### Backend

```bash
cd backend

# Запуск сервера
npm start

# Запуск с автоперезагрузкой
npm run dev

# Проверка кода (ESLint)
npm run lint

# Исправление лinting ошибок
npm run lint:fix

# Запуск тестов (когда будут добавлены)
npm test

# Запуск тестов в watch режиме
npm run test:watch
```

### Frontend

```bash
cd frontend

# Запуск dev сервера
npm run dev

# Production build
npm run build

# Preview сборки
npm run preview

# ESLint проверка
npm run lint

# Исправление lint ошибок
npm run lint --fix
```

### Print3D App

```bash
cd print3d-app

# Запуск dev сервера
npm run dev

# Production build
npm run build

# Preview сборки
npm run preview
```

---

## Дебаггинг

### Chrome DevTools

```javascript
// В браузере
F12 или Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (macOS)
```

**Что смотреть:**
- **Console** — логи и ошибки
- **Network** — API запросы
- **Application** — localStorage, cookies
- **Sources** — дебаггинг кода

### VS Code Debugger для Backend

Создай `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Backend",
      "program": "${workspaceFolder}/backend/server.js",
      "restart": true,
      "runtimeArgs": ["--nolazy"],
      "port": 9229,
      "console": "integratedTerminal"
    }
  ]
}
```

Запуск:
```bash
cd backend
node --inspect-brk server.js
```

Затем нажми F5 в VS Code.

### Логирование

**Backend:**
```javascript
// server.js
const debug = require('debug')('app:*');

debug('Server started'); // Появится в консоли, если DEBUG=app:*
```

Запуск с логами:
```bash
DEBUG=app:* npm start
```

**Frontend:**
```javascript
// components/Viewer3D.jsx
console.log('3D Model loaded:', model);
console.error('Error loading model:', error);
console.warn('Warning: Model is large');
```

### Browser Debugger для React

```bash
cd frontend
npm install -D @vitejs/plugin-react-refresh
```

Используй React DevTools браузера:
- [Chrome Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

---

## Тестирование

### API тестирование (Thunder Client)

В VS Code:
1. Установи расширение Thunder Client
2. Создай коллекцию запросов
3. Сохрани в `backend/tests/thunder-collection.json`

**Пример запроса:**
```
GET http://localhost:5000/api/models
Content-Type: application/json

Authorization: Bearer {token}
```

### Unit тестирование (планируется)

```bash
cd backend
npm install --save-dev jest

# package.json
"test": "jest",
"test:watch": "jest --watch"
```

**Пример теста:**
```javascript
// models.test.js
describe('Model API', () => {
  test('should load model by ID', async () => {
    const response = await request(app)
      .get('/api/models/123')
      .expect(200);
    
    expect(response.body).toHaveProperty('name');
  });
});
```

### Запуск тестов

```bash
npm test           # Запустить один раз
npm run test:watch # Запустить в watch режиме
npm run test:coverage # С покрытием кода
```

---

## Трабблшутинг

### Проблема: Port 5000 уже в использовании

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

Или изменить port в `.env`:
```env
PORT=5001
```

### Проблема: MongoDB connection error

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Решение:**
```bash
# Проверить, запущена ли MongoDB
# Windows: Services → MongoDB
# macOS: brew services list
# Linux: sudo systemctl status mongod

# Или запустить Docker контейнер
docker run -d -p 27017:27017 mongo:latest
```

### Проблема: CORS ошибка

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Решение:**
```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Проблема: npm install зависает

```bash
# Очистить кэш
npm cache clean --force

# Попробовать снова
npm install

# Или используй yarn
yarn install
```

### Проблема: Изменения в коде не применяются

**Frontend:**
```bash
# Перезагрузить страницу
Ctrl+Shift+R (полная перезагрузка)
```

**Backend:**
```bash
# Убедись, что используешь nodemon
npm run dev

# Или перезагрузи вручную
# Ctrl+C и затем npm start
```

---

## Полезные ссылки

### Документация
- [Node.js docs](https://nodejs.org/docs/)
- [Express.js guide](https://expressjs.com/en/starter/basic-routing.html)
- [React docs](https://react.dev/)
- [Vite docs](https://vitejs.dev/)
- [MongoDB docs](https://docs.mongodb.com/)
- [Three.js docs](https://threejs.org/docs/)

### Инструменты
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Git Guide](https://git-scm.com/doc)

### Сообщества
- [Stack Overflow](https://stackoverflow.com/)
- [Dev.to](https://dev.to/)
- [CSS-Tricks](https://css-tricks.com/)

---

## Чек-лист перед коммитом

- [ ] Код запускается без ошибок
- [ ] `npm run lint` проходит без ошибок
- [ ] Тесты проходят (если есть)
- [ ] Нет console.log в production коде
- [ ] .env файл не закоммитлен
- [ ] Commit message информативен
- [ ] Изменения в CHANGELOG.md добавлены

---

## Контакты и помощь

- 📖 [CONTRIBUTING.md](./CONTRIBUTING.md) — гайд контрибьютора
- 🐛 [GitHub Issues](https://github.com/Mukller/Online-slicer/issues) — сообщить об ошибке
- 💬 [GitHub Discussions](https://github.com/Mukller/Online-slicer/discussions) — обсудить идею
- 🛡️ [SECURITY.md](./SECURITY.md) — отчет об уязвимостях

---

**Happy coding!** 💻✨

Последнее обновление: 2025-05-14
