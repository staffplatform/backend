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
3. `node dist/main`

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
- `npm run prisma:studio`

## 5. API endpoints

Global prefix: `/api`

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout` (Bearer access token)
- `GET /api/users/me` (Bearer access token)
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
    "lastName":"Doe"
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
