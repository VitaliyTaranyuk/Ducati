# Архитектура PWA «Кофейня Ducati»

## Обзор

Monorepo с разделением на `frontend` (React + Vite PWA) и `backend` (Express + PostgreSQL).

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (HTTPS)                        │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │  Static (Vite build)│    │  /api/* → Express :3001     │ │
│  │  Service Worker     │    │  JWT cookies, CSRF, Zod     │ │
│  └─────────────────────┘    └──────────────┬──────────────┘ │
└────────────────────────────────────────────┼────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  PostgreSQL 15  │
                                    └─────────────────┘
```

## Роли

| Роль    | Доступ |
|---------|--------|
| client  | Меню, корзина, заказы (без auth или по телефону) |
| barista | Дашборд заказов, смена статуса, push |
| owner   | CRUD меню, статистика, CSV, управление пользователями |

## Схема БД (PostgreSQL)

```sql
-- users
id UUID PK, email UNIQUE, password_hash, role ENUM(client|barista|owner),
name, phone, created_at, updated_at

-- refresh_tokens
id UUID PK, user_id FK, token_hash, expires_at, revoked_at, created_at

-- drinks
id UUID PK, name, description, image_url, is_active, sort_order,
category ENUM(classics|special|ice), badge, flavor_options TEXT[],
created_at, updated_at
UNIQUE (name, category)

-- drink_sizes
id UUID PK, drink_id FK, size ENUM(S|M|L), price DECIMAL, volume_ml INT
-- UI показывает volume_ml («250 мл»), не букву размера.
-- S/M/L: 250 / 350 / 450 мл; эспрессо 36 мл; айс 400 мл.

-- modifiers
id UUID PK, name UNIQUE, price DECIMAL, is_active, sort_order, created_at, updated_at

-- orders
id UUID PK, customer_name, customer_phone, comment, status ENUM(pending|preparing|ready|cancelled|completed),
ready_at TIMESTAMPTZ, total DECIMAL, user_id FK nullable, created_at, updated_at

-- order_items
id UUID PK, order_id FK, drink_id FK, drink_name, size, volume_ml, flavor,
quantity, unit_price, subtotal
-- subtotal = (unit_price + сумма допов) * quantity

-- order_item_modifiers
id UUID PK, order_item_id FK, modifier_id FK, name, price

-- push_subscriptions
id UUID PK, user_id FK, endpoint UNIQUE, p256dh, auth, created_at
```

## API Endpoints (REST)

### Auth
- `POST /api/auth/login` — вход (email + password)
- `POST /api/auth/refresh` — ротация refresh token
- `POST /api/auth/logout` — отзыв refresh token
- `GET /api/auth/me` — текущий пользователь

### Drinks (public read)
- `GET /api/drinks` — список активных напитков (`?category=classics|special|ice`, поля `category`, `badge`, `flavorOptions`, `grouped`)
- `GET /api/drinks/:id`
- `POST /api/drinks` — owner
- `PUT /api/drinks/:id` — owner
- `DELETE /api/drinks/:id` — owner (soft delete)

### Modifiers (допы)
- `GET /api/modifiers` — активные допы (сироп +40 ₽, альтернативное молоко +60 ₽)
- `GET /api/modifiers/admin/all` — owner
- `POST /api/modifiers` — owner
- `PUT /api/modifiers/:id` — owner
- `DELETE /api/modifiers/:id` — owner (soft delete)

### Orders
- `POST /api/orders` — создание заказа (public, rate-limited)
- `GET /api/orders` — barista/owner (фильтры: status, date)
- `GET /api/orders/history?phone=` — история по телефону
- `PATCH /api/orders/:id/status` — barista/owner

### Stats (owner)
- `GET /api/stats?period=day|week`
- `GET /api/stats/export?period=week` — CSV

### Push
- `POST /api/push/subscribe` — barista/owner
- `DELETE /api/push/unsubscribe`

### Health
- `GET /api/health`

## PWA / Offline

1. **Workbox**: cache-first для статики и изображений меню; network-first для API.
2. **IndexedDB** (`offline-queue`): очередь POST/PATCH при offline.
3. **Sync**: `navigator.onLine` + кнопка «Синхронизировать».
4. **React Query**: persist menu cache в localStorage.

## Безопасность

- JWT access (15 min) + refresh (7 days) в HttpOnly cookies
- CSRF double-submit cookie
- Helmet CSP, Zod validation, bcrypt passwords
- Rate limiting на auth и orders

## Структура папок

```
Ducati/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   │   └── index.ts
│   ├── prisma/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── lib/
│   │   └── sw/
│   └── Dockerfile
├── nginx/
├── docker-compose.yml
└── docs/
```
