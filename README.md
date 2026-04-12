# StaffPlatform (NestJS)

Production-ready skeleton for StaffPlatform backend with:

- NestJS + TypeScript
- PostgreSQL + Prisma
- JWT access/refresh auth
- DTO validation (`class-validator` + `class-transformer`)
- Swagger at `/docs`
- Docker + docker-compose

## 1. Project structure

```text
.
├── docker-compose.yml
├── Dockerfile
├── prisma
│   ├── migrations
│   │   └── 20260301220000_init
│   │       └── migration.sql
│   ├── migration_lock.toml
│   └── schema.prisma
├── src
│   ├── app.module.ts
│   ├── main.ts
│   ├── auth
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── dto
│   │   │   ├── auth-response.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh.dto.ts
│   │   │   └── register.dto.ts
│   │   ├── guards
│   │   │   └── jwt-auth.guard.ts
│   │   └── strategies
│   │       └── jwt.strategy.ts
│   ├── common
│   │   ├── decorators
│   │   │   └── get-current-user.decorator.ts
│   │   └── interfaces
│   │       ├── jwt-payload.interface.ts
│   │       └── request-with-user.interface.ts
│   ├── database
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   ├── health
│   │   ├── health.controller.ts
│   │   └── health.module.ts
│   └── users
│       ├── dto
│       │   └── user-response.dto.ts
│       ├── users.controller.ts
│       ├── users.module.ts
│       └── users.service.ts
├── .env.example
└── package.json
```

## 2. Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Important variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `CORS_ORIGIN=*`

## 3. Run with Docker Compose

```bash
docker compose up --build
```

API will be available at:

- `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`

Startup command inside API container:

1. `prisma generate`
2. `prisma migrate deploy`
3. `node dist/src/main.js`

## 4. Local development (without Docker)

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Useful commands:

- `npm run start:dev`
- `npm run start:prod`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run db:seed`
- `npm run prisma:studio`

Test seed data:

- user: `employee@example.com`
- password: `StrongPass123`
- jobTitle: `Barista`
- company: `Acme Staff Platform`
- store: `Acme Tverskaya`

Current access model:

- one user belongs to one company
- one user can be assigned to multiple stores within that company
- `GET /api/companies/current` returns the current user's company
- `GET /api/stores/my` returns the current user's stores

## 5. API endpoints

Global prefix: `/api`

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout` (Bearer access token)
- `GET /api/users/me` (Bearer access token)
- `PATCH /api/users/me` (Bearer access token)
- `GET /api/companies` (Bearer access token)
- `GET /api/companies/current` (Bearer access token)
- `GET /api/stores/my` (Bearer access token)
- `GET /api/schedule/month` (Bearer access token)
- `GET /api/schedule/week` (Bearer access token)
- `PUT /api/schedule/month` (Bearer access token)
- `DELETE /api/schedule/entry` (Bearer access token)
- `GET /api/health`

## 6. cURL examples

### Health

```bash
curl -X GET http://localhost:3000/api/health
```

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"StrongPass123",
    "firstName":"John",
    "lastName":"Doe",
    "birthDate":"1990-01-20"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"StrongPass123"
  }'
```

### Refresh

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken":"<REFRESH_TOKEN>"
  }'
```

### Me

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Update profile

```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"Jane",
    "lastName":"Smith",
    "birthDate":"1992-07-14",
    "avatarUrl":"https://cdn.example.com/avatars/jane.jpg",
    "jobTitle":"Barista",
    "workCity":"Moscow",
    "workAddress":"ул. Ленина, 10",
    "companyAddress":"ул. Тверская, 7, офис 12"
  }'
```

### Create store

```bash
curl -X POST http://localhost:3000/api/companies/<COMPANY_ID>/stores \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Aviapark",
    "city":"Moscow",
    "address":"Ходынский бульвар, 4",
    "activeFrom":"2026-04-01"
  }'
```

### Schedule month

```bash
curl -X GET "http://localhost:3000/api/schedule/month?storeId=<STORE_ID>&year=2026&month=4" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Schedule week

```bash
curl -X GET "http://localhost:3000/api/schedule/week?storeId=<STORE_ID>&week=2026-03-26" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

`week` accepts any date inside the requested week. The backend resolves it to a Monday-Sunday range and returns:

- `week`
- `weekStart`
- `weekEnd`
- `employees`
- `entries`

`store.activeFrom` in the response defines the earliest available schedule date for the store.

`employees` in the schedule response include:

- `userId`
- `email`
- `firstName`
- `lastName`
- `avatarUrl`
- `jobTitle`

`entries` is a flat list of employee assignments. Multiple entries can have the same `date`, `startTime`, and `endTime` as long as they belong to different `userId` values. In other words, several employees can be scheduled for the same shift window on the same day.

### Schedule entry types

```bash
curl -X GET "http://localhost:3000/api/schedule/types" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Response example:

```json
{
  "entryTypes": [
    { "value": "SHIFT", "label": "Смена" },
    { "value": "VACATION", "label": "Отпуск" },
    { "value": "ABSENCE", "label": "Отсутствие" }
  ]
}
```

### Update schedule month

```bash
curl -X PUT "http://localhost:3000/api/schedule/month" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId":"<STORE_ID>",
    "year":2026,
    "month":4,
    "entries":[
      {
        "userId":"<USER_ID_1>",
        "date":"2026-04-15",
        "type":"SHIFT",
        "startTime":"09:00",
        "endTime":"18:00",
        "comment":"Открытие смены"
      },
      {
        "userId":"<USER_ID_2>",
        "date":"2026-04-15",
        "type":"SHIFT",
        "startTime":"09:00",
        "endTime":"18:00",
        "comment":"Открытие смены второй сотрудник"
      }
    ]
  }'
```

To clear an entry through the bulk update endpoint, send `"clear": true` for the target `userId` and `date`.

### Update schedule week

```bash
curl -X PUT "http://localhost:3000/api/schedule/week" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId":"<STORE_ID>",
    "week":"2026-04-15",
    "entries":[
      {
        "userId":"<USER_ID_1>",
        "date":"2026-04-15",
        "type":"SHIFT",
        "startTime":"09:00",
        "endTime":"18:00",
        "comment":"Открытие смены"
      }
    ]
  }'
```

`week` accepts any date inside the requested week. The backend resolves it to a Monday-Sunday range and applies changes only within that week.

### Delete schedule entry

```bash
curl -X DELETE "http://localhost:3000/api/schedule/entry?storeId=<STORE_ID>&userId=<USER_ID>&date=2026-04-15" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Logout

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## 7. Behavior and security

- Password min length: 8 symbols
- Email validation enabled
- `register` returns `409` if email already used
- `login` returns `401` for invalid credentials
- `refresh` returns `401` for invalid/expired token
- Refresh token is stored in DB as bcrypt hash (`refreshTokenHash`)
- `logout` invalidates session by clearing `refreshTokenHash`
- Global `ValidationPipe` with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
