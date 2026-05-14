# Руководство по участию (Contributing Guide)

Большое спасибо за интерес к Online-Slicer! 🎉 

Этот документ содержит набор рекомендаций и инструкций для внесения вклада в проект.

---

## Table of Contents / Оглавление

- [Кодекс поведения](#кодекс-поведения)
- [Как начать](#как-начать)
- [Сообщение об ошибках](#сообщение-об-ошибках)
- [Предложение функций](#предложение-функций)
- [Pull Request процесс](#pull-request-процесс)
- [Стиль кода](#стиль-кода)
- [Соглашение о коммитах](#соглашение-о-коммитах)

---

## Кодекс поведения

Этот проект и все участники, вносящие вклад, управляются нашим [Кодексом поведения](./CODE_OF_CONDUCT.md). Участвуя, вы обязуемся соблюдать его положения. Пожалуйста, сообщайте о неприемлемом поведении сопровождающим проекта.

---

## Как начать

### Предварительные условия

- **Node.js** 18.x или выше
- **npm** 9.x или выше
- **Git** для управления версиями
- **MongoDB** для локального тестирования (опционально)

### Настройка локального окружения

```bash
# 1. Форк и клон репозитория
git clone https://github.com/YOUR_USERNAME/Online-slicer.git
cd Online-slicer

# 2. Добавь upstream
git remote add upstream https://github.com/Mukller/Online-slicer.git

# 3. Установи зависимости всех частей
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd print3d-app && npm install && cd ..

# 4. Создай новую ветку для работы
git checkout -b feature/your-feature-name
```

### Запуск проекта локально

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Print3D App (опционально)
cd print3d-app
npm run dev
```

---

## Сообщение об ошибках

### Перед открытием Issue

- Проверьте существующие issues, может быть уже есть проблема с описанием вашей ошибки
- Обновите локальный репозиторий до последней версии

### Как сообщить об ошибке

Откройте [GitHub Issue](https://github.com/Mukller/Online-slicer/issues/new) с информацией:

```markdown
## Описание проблемы
[Четкое и краткое описание того, в чем проблема]

## Шаги воспроизведения
1. Перейди на...
2. Нажми на...
3. Поверни...
4. Увидишь ошибку

## Ожидаемое поведение
[Описание того, что должно произойти]

## Фактическое поведение
[Описание того, что на самом деле произошло]

## Окружение
- OS: [e.g., Windows 11, macOS Ventura]
- Node.js: [e.g., 18.16.0]
- npm: [e.g., 9.5.0]
- Браузер: [e.g., Chrome 113]

## Скриншоты или видео
[Если применимо]

## Дополнительный контекст
[Любая другая релевантная информация]
```

---

## Предложение функций

### Перед предложением

- Проверьте дорожную карту в [README.md](./README.md#-дорожная-карта)
- Прочитайте существующие issues и discussions

### Как предложить функцию

Откройте [GitHub Discussion](https://github.com/Mukller/Online-slicer/discussions) или Issue:

```markdown
## Описание функции
[Четкое описание желаемой функции]

## Мотивация
[Почему эта функция полезна?]

## Пример использования
[Как бы вы использовали эту функцию?]

## Возможные реализации
[Идеи по реализации, если есть]

## Дополнительный контекст
[Что-нибудь еще, что мы должны знать?]
```

---

## Pull Request процесс

### Перед созданием PR

1. **Обновите вашу ветку** до последней версии `develop`:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Запустите linting**:
   ```bash
   npm run lint
   ```

3. **Тестируйте ваши изменения** локально в всех браузерах

4. **Обновите документацию** если необходимо

### Создание Pull Request

1. Убедитесь, что ваш код следует стилю проекта
2. Убедитесь, что `commit messages` информативны (см. ниже)
3. Заполните PR template полностью
4. Свяжите related issues в PR description
5. Обновите [CHANGELOG.md](./CHANGELOG.md) в Unreleased секции

### PR Template

```markdown
## Описание
[Краткое описание изменений]

## Тип изменения
- [ ] Bug fix (исправление ошибки)
- [ ] New feature (новая функция)
- [ ] Breaking change (несовместимое изменение)
- [ ] Documentation update (обновление документации)

## Связанные Issues
Closes #(issue number)

## Как тестировать?
[Шаги для тестирования изменений]

## Чек-лист
- [ ] Мой код следует стилю проекта
- [ ] Я обновил документацию
- [ ] Я добавил тесты для новых функций
- [ ] Все тесты пройдены локально
- [ ] Я обновил CHANGELOG.md
```

### После создания PR

- Отвечайте на комментарии рецензентов в течение 48 часов
- Запрашивайте review, если нет активности в течение недели
- Поддерживайте конструктивный диалог

---

## Стиль кода

### JavaScript/React

```javascript
// ✅ Правильно
const handleModelUpload = (file) => {
  if (!file) return;
  
  const processFile = async () => {
    try {
      const result = await uploadModel(file);
      setModel(result);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  processFile();
};

// ❌ Неправильно
function uploadFile(f){
var r = uploadModel(f);
model = r;
}
```

### Правила

- **Используй const/let**, не var
- **Стрелочные функции** `() => {}` вместо `function(){}`
- **Async/await** вместо `.then()` chains
- **Деструктуризация** где возможно
- **Информативные имена** переменных и функций
- **Комментарии** только для сложной логики
- **Максимум 80 символов** на линию (мягкий лимит)

### CSS/Tailwind

```jsx
// ✅ Правильно
<button className="px-4 py-2 bg-blue-500 hover:bg-blue--600 rounded-lg text-white">
  Upload Model
</button>

// ❌ Неправильно
<button className="p-10 m-20 bg-color-xyz">Upload</button>
```

### Форматирование

- **2 пробела** для отступов
- **Нет точек с запятой** в конце строк (опционально)
- **Одинарные кавычки** `'string'` в JS

---

## Соглашение о коммитах

Используй [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Примеры

```bash
# Новая функция
git commit -m "feat(viewer): add model rotation controls"

# Исправление ошибки
git commit -m "fix(api): resolve file upload timeout issue"

# Документация
git commit -m "docs: update installation instructions"

# Рефакторинг
git commit -m "refactor(components): simplify model loader"

# С телом описания
git commit -m "feat(slicer): integrate Kimi Moto engine

- Add slicing parameters configuration
- Support multiple material presets
- Improve g-code generation speed

Closes #123"
```

### Типы коммитов

- `feat` — новая функция
- `fix` — исправление ошибки
- `docs` — документация
- `style` — форматирование кода
- `refactor` — перестройка кода без изменения функциональности
- `perf` — улучшение производительности
- `test` — добавление или обновление тестов
- `chore` — обновление зависимостей, инструментов и т.д.
- `ci` — изменения в CI/CD

### Области (scope)

- `api` — API endpoints
- `viewer` — 3D viewer
- `slicer` — slicing engine
- `auth` — authentication
- `ui` — user interface
- `db` — database
- `docs` — documentation

---

## Процесс Review

### Что ожидать

1. **Автоматические проверки** (linting, tests)
2. **Code review** от одного или более мейнтейнеров
3. **Обсуждение и улучшения**
4. **Одобрение** и merge

### Сроки

- Review обычно происходит в течение **3-7 дней**
- Ответ на комментарии — в течение **48 часов**

---

## Дополнительная помощь

- 📖 Прочитайте [README](./README.md)
- 💬 Участвуйте в [GitHub Discussions](https://github.com/Mukller/Online-slicer/discussions)
- ❓ Задавайте вопросы в Issues
- 🐛 Сообщайте об ошибках в Issues

---

## Спасибо! 🙏

Твой вклад делает Online-Slicer лучше для всех. Спасибо за помощь! 

**Happy coding!** 💻✨
