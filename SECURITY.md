# Security Policy (Политика безопасности)

## 🛡️ Безопасность Online-Slicer

Безопасность — приоритет для проекта Online-Slicer. Этот документ объясняет, как мы обрабатываем проблемы безопасности и как вы можете помочь.

---

## Поддерживаемые версии

| Версия | Статус | Поддержка безопасности |
|--------|--------|----------------------|
| 1.x | LTS | ✅ До 2027 |
| 0.x | Old | ✅ До конца 2025 |
| < 0.0.1 | EOL | ❌ Без поддержки |

---

## Сообщение об уязвимостях

**⚠️ ВАЖНО:** Не открывайте public Issues для уязвимостей безопасности!

### Как сообщить об уязвимости

1. **GitHub Security Advisory (рекомендуется)**
   - Перейти в репозиторий
   - GitHub → Security → Advisories
   - Нажать "Report a vulnerability"
   - Заполнить форму

2. **Приватное сообщение (альтернатива)**
   - Создать GitHub Issue (draft mode)
   - Отметить как "security"
   - Описать уязвимость

3. **Email (для критических)**
   - Напишите на email мейнтейнера (когда будет определен)

### Информация для включения

```markdown
## Тип уязвимости
- [ ] Remote Code Execution (RCE)
- [ ] SQL Injection
- [ ] XSS (Cross-Site Scripting)
- [ ] CSRF (Cross-Site Request Forgery)
- [ ] Authentication Bypass
- [ ] Privilege Escalation
- [ ] Information Disclosure
- [ ] Denial of Service (DoS)
- [ ] Другое: ___________

## Описание
[Четкое описание уязвимости]

## Затронутые компоненты
- Backend
- Frontend
- Database
- API
- Другое

## Версии
- Online-Slicer: v0.0.1
- Node.js: 18.x
- MongoDB: 5.0

## Проверка воспроизведения
1. ...
2. ...
3. ...

## Влияние
[Какое влияние имеет эта уязвимость?]

## Предложение по исправлению
[Если есть идеи]
```

---

## Процесс обработки

### Временная шкала

1. **День 1-2** — Подтверждение получения
2. **День 3-7** — Оценка серьезности
3. **День 8-30** — Разработка исправления
4. **День 31-45** — Тестирование и выпуск патча
5. **День 46** — Публикация раскрытия

### Уровни серьезности

#### 🔴 Critical (Критическая)
- **Оценка:** 9.0-10.0 (CVSS)
- **Пример:** RCE на сервере
- **Сроки:** Патч в течение 7 дней
- **Действие:** Срочный релиз

#### 🟠 High (Высокая)
- **Оценка:** 7.0-8.9
- **Пример:** Authentication Bypass
- **Сроки:** Патч в течение 14 дней
- **Действие:** Ускоренный релиз

#### 🟡 Medium (Средняя)
- **Оценка:** 4.0-6.9
- **Пример:** XSS в UI
- **Сроки:** Патч в течение 30 дней
- **Действие:** Обычный релиз

#### 🟢 Low (Низкая)
- **Оценка:** 0.1-3.9
- **Пример:** Информационное раскрытие
- **Сроки:** Патч в следующем релизе
- **Действие:** Включить в обычное обновление

---

## Лучшие практики безопасности

### Для разработчиков

```javascript
// ❌ Неправильно
app.post('/api/models', (req, res) => {
  const id = req.body.id; // Не валидирована!
  const model = db.findOne({ _id: id });
  res.json(model);
});

// ✅ Правильно
const { body, validationResult } = require('express-validator');

app.post('/api/models', 
  body('id').isMongoId(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors });
    }
    
    const id = req.body.id;
    const model = db.findOne({ _id: id });
    res.json(model);
  }
);
```

### Правила кодирования

1. **Всегда валидируйте входные данные**
   ```javascript
   const { body, validationResult } = require('express-validator');
   body('field').trim().escape();
   ```

2. **Используйте HTTPS в production**
   ```javascript
   // .env
   HTTPS=true
   SSL_CERT=/path/to/cert
   ```

3. **Защищайте чувствительные данные**
   ```javascript
   // ❌ Неправильно
   console.log(password); // Логирование паролей!
   
   // ✅ Правильно
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

4. **Использ неt параметризованные запросы**
   ```javascript
   // ❌ Уязвимо к инъекциям
   db.find({ userId: req.query.id });
   
   // ✅ Безопасно (Mongoose)
   db.findById(req.query.id);
   ```

5. **Установите правильные CORS заголовки**
   ```javascript
   const cors = require('cors');
   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(','),
     credentials: true
   }));
   ```

---

## Проверка безопасности

### npm Security Audit

```bash
# Проверить уязвимости в зависимостях
npm audit

# Автоматически исправить
npm audit fix

# Проверить после обновления
npm audit --audit-level=moderate
```

### Инструменты для проверки

```bash
# OWASP Dependency Check
npm install -g snyk
snyk test

# npm-check-updates
npm install -g npm-check-updates
ncu

# ESLint Security плагин
npm install --save-dev eslint-plugin-security
```

---

## Переменные окружения

**Никогда** не коммитьте .env файлы!

```bash
# ✅ .gitignore
.env
.env.local
.env.*.local
```

### Критические переменные

```env
# Database
MONGODB_URI=mongodb+srv://...
DB_PASSWORD=... # НИКОГДА не коммитьте!

# API Keys
JWT_SECRET=... # Генерируйте сильный ключ
API_KEY=...

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT=100 # requests per 15 minutes

# SSL/TLS
SSL_CERT=/path/to/cert.pem
SSL_KEY=/path/to/key.pem
```

---

## Headers безопасности

### Express Helmet

```javascript
const helmet = require('helmet');

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
}));
```

### Рекомендуемые headers

```javascript
// Strict-Transport-Security
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// X-Content-Type-Options
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// X-Frame-Options
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

---

## Аутентификация и авторизация

### Пароли

```javascript
const bcrypt = require('bcrypt');

// Хеширование пароля
const hashedPassword = await bcrypt.hash(password, 10);

// Проверка пароля
const isValid = await bcrypt.compare(password, hashedPassword);
```

### JWT токены

```javascript
const jwt = require('jsonwebtoken');

// Создание токена
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Верификация токена
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.post('/api/login', limiter, (req, res) => {
  // Handle login
});
```

---

## Логирование и мониторинг

### Безопасное логирование

```javascript
// ❌ Неправильно
logger.info('User logged in:', { user, password, token });

// ✅ Правильно
logger.info('User logged in', { 
  userId: user._id, 
  username: user.username 
});
```

### Monitoring

```javascript
// Используйте инструменты для мониторинга
// - New Relic
// - DataDog
// - Sentry
// - LogRocket

const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## Чек-лист перед каждым релизом

- [ ] Запустить `npm audit`
- [ ] Обновить все зависимости
- [ ] Проверить OWASP Top 10
- [ ] Убедиться, что .env не закоммитили
- [ ] Проверить CORS настройки
- [ ] Включить HTTPS в production
- [ ] Установить rate limiting
- [ ] Настроить логирование
- [ ] Включить helmet middleware
- [ ] Провести security review кода

---

## Ресурсы

### Документация
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

### Инструменты
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [ESLint Security](https://github.com/nodesecurity/eslint-plugin-security)

### Сообщества
- [npm Security](https://www.npmjs.com/advisories)
- [CVE Database](https://cve.mitre.org/)
- [GitHub Security Advisories](https://github.com/advisories)

---

## Контакты

- 📧 GitHub Security Advisories (рекомендуется)
- 🐛 GitHub Issues (только для публичных проблем)
- 💬 GitHub Discussions (для вопросов)

---

**Спасибо за помощь в обеспечении безопасности Online-Slicer!** 🛡️

Последнее обновление: 2025-05-14
