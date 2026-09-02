# Развёртывание PWA «Кофейня Дукати»

Сайт: **https://vitaliytaranyuk.github.io/Ducati/**

Код: [github.com/VitaliyTaranyuk/Ducati](https://github.com/VitaliyTaranyuk/Ducati)

GitHub Pages отдаёт клиентское PWA (меню, корзина, установка на телефон). Приём заказов, кабинет бариста и база данных работают при запуске backend через Docker — см. Production ниже.

PWA кофейни **Дукати**: cream `#F5F1E8` / chocolate `#3C3028` / taupe `#6D5B5E`.
Микрокопирайт: «🐾 в честь нашей Дукати 🐾», «Лучший кофе для лучших моментов!»

## Меню (seed)

Категории: **Классика** (горячие, включая бывший спешл) · **Айс**. Размеры в UI — в миллилитрах.

| Категория | Напитки | Объёмы |
|-----------|---------|--------|
| Классика | Капучино (классика / крем), Раф (классика + халва / цитрус / арахис / медовик), Латте (классика / тыква / орхидея), Флэт Уайт, Американо (без 450 мл), Эспрессо (36 мл / 120 ₽), Матча GREEN, Сырный раф (**NEW**), Горячий шоколад/Какао, Чай (250 мл) | 250 / 350 / 450 мл |
| Айс | Бамбл, Эспрессо-тоник, Айс-латте | 400 мл |

Допы: сироп **+40 ₽**, альтернативное молоко **+60 ₽**.

Seed идемпотентен: `upsert` по `name + category`, старые stub-напитки деактивируются.

## Быстрый старт (разработка)

### Требования
- Node.js 20+
- PostgreSQL 15+ (или Docker)
- npm

### 1. База данных

```bash
docker run -d --name ducati-pg \
  -e POSTGRES_USER=coffee \
  -e POSTGRES_PASSWORD=coffee_secret \
  -e POSTGRES_DB=ducati_coffee \
  -p 5432:5432 postgres:15-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

API: http://localhost:3001

**Тестовые аккаунты:**
- Владелец: `owner@ducati.coffee` / `owner123`
- Бариста: `barista@ducati.coffee` / `barista123`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение: http://localhost:5173

### 4. VAPID ключи (Push-уведомления)

```bash
npx web-push generate-vapid-keys
```

Добавьте ключи в `backend/.env`:
```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## Production (Docker Compose)

### 1. Подготовка SSL (Let's Encrypt)

```bash
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

### 2. Переменные окружения

Создайте `.env` в корне:

```env
JWT_ACCESS_SECRET=<random-32-chars>
JWT_REFRESH_SECRET=<random-32-chars>
CSRF_SECRET=<random-32-chars>
CORS_ORIGIN=https://your-domain.com
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

### 3. Запуск

```bash
docker compose up -d --build
```

### 4. Seed данных

```bash
docker compose exec backend npx tsx prisma/seed.ts
```

---

## Мониторинг

### Sentry
```env
# frontend/.env
VITE_SENTRY_DSN=https://...@sentry.io/...
```

### Google Analytics
```env
VITE_GA_ID=G-XXXXXXXXXX
```

---

## Lighthouse PWA Audit

```bash
cd frontend
npm run build && npm run preview
npx lighthouse http://localhost:4173 --view --preset=desktop
```

Целевой score: **≥ 90** в категории PWA.

---

## Установка на устройство

### iOS (Safari 16.4+)
1. Откройте сайт в **Safari**
2. Нажмите **Поделиться** → **На экран «Домой»**
3. Push-уведомления работают только в standalone-режиме

### Android (Chrome 120+)
1. Откройте сайт в Chrome
2. Меню → **Установить приложение** / **Добавить на главный экран**
3. Push-уведомления работают после установки

---

## Тестирование офлайн-режима

1. Откройте приложение онлайн (меню кэшируется)
2. DevTools → Network → **Offline**
3. Меню должно отображаться из кэша
4. Создайте заказ — он сохранится в IndexedDB
5. Включите сеть → заказ синхронизируется автоматически
6. Или нажмите кнопку **«Синхронизировать»**

---

## Структура API

| Метод | Путь | Роль | Описание |
|-------|------|------|----------|
| POST | /api/auth/login | — | Вход |
| POST | /api/auth/refresh | — | Обновление токена |
| GET | /api/drinks | — | Меню (`?category=`) |
| GET | /api/modifiers | — | Активные допы |
| POST | /api/orders | — | Создать заказ (items.modifiers, items.flavor) |
| GET | /api/orders | barista/owner | Активные заказы |
| PATCH | /api/orders/:id/status | barista/owner | Смена статуса |
| GET | /api/stats | owner | Статистика |
| GET | /api/stats/export | owner | CSV отчёт |

Полная документация: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
