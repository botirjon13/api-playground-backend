# API Playground Backend

Production-ready Sprint 0 backend foundation for the **API Playground Platform**. This service helps developers practice REST APIs, Swagger/OpenAPI, authentication, validation, CRUD patterns, pagination, and integrations through future challenge modules.

> Sprint 0 intentionally implements only the backend foundation: authentication, users, health checks, Prisma/PostgreSQL, Swagger, Docker, logging, and code quality setup.

## Project Structure

```text
api-playground-backend/
├── prisma/
│   ├── migrations/
│   │   └── 20260101000000_init/
│   │       └── migration.sql
│   └── schema.prisma
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── interfaces/
│   │   └── strategies/
│   ├── common/
│   │   ├── decorators/
│   │   └── middleware/
│   ├── config/
│   ├── health/
│   ├── prisma/
│   ├── users/
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Features

- NestJS + TypeScript backend with strict compiler settings.
- Prisma ORM configured for PostgreSQL and Neon-compatible connection URLs.
- JWT authentication with Passport.
- Password hashing with bcrypt.
- Global request validation using `class-validator` and `class-transformer`.
- Helmet and CORS security middleware.
- Request logging middleware.
- Swagger/OpenAPI documentation at `/api/docs` with bearer authentication.
- Docker and Docker Compose setup for local PostgreSQL + backend.
- Render deployment-friendly production start command.

## API Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Public | Register a new student account. |
| `POST` | `/auth/login` | Public | Login and receive a JWT access token. |
| `GET` | `/auth/profile` | Bearer JWT | Return the current authenticated user. |
| `GET` | `/users/me` | Bearer JWT | Return the authenticated user's profile. |
| `GET` | `/health` | Public | Return service health status. |

## Installation

```bash
npm install
```

## Environment Setup

Copy the example environment file and update values for your machine or hosting provider:

```bash
cp .env.example .env
```

Required variables:

```dotenv
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/api_playground?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="1d"
```

Use a long random value for `JWT_SECRET` in production.

## Prisma Migration

Generate the Prisma client:

```bash
npm run prisma:generate
```

Apply migrations during local development:

```bash
npm run prisma:migrate
```

For production or CI/CD environments, deploy existing migrations only:

```bash
npm run prisma:deploy
```

## Run Locally

Start a local PostgreSQL database or provide a hosted PostgreSQL `DATABASE_URL`, then run:

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

## Run with Docker

Build and run the backend with PostgreSQL:

```bash
docker compose up
```

This starts:

- PostgreSQL on `localhost:5432`
- Backend API on `localhost:3000`

The backend container runs Prisma migrations before starting the compiled NestJS application.

## Swagger Access

Swagger/OpenAPI documentation is available at:

```text
http://localhost:3000/api/docs
```

Use the **Authorize** button with a token from `/auth/login`:

```text
Bearer <access_token>
```

## Authentication Examples

Register:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'
```

Login:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'
```

Profile:

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

## Neon PostgreSQL Configuration

1. Create a Neon project and PostgreSQL database.
2. Copy the pooled or direct connection string from Neon.
3. Set `DATABASE_URL` to the Neon connection string. Keep the `?schema=public` suffix unless your project uses a different schema.
4. Run migrations against Neon:

```bash
npm run prisma:deploy
```

For Render, store the Neon connection string as a protected environment variable.

## Render Deployment Notes

Recommended Render Web Service settings:

- **Environment**: Node
- **Build Command**: `npm install && npm run prisma:generate && npm run build`
- **Start Command**: `npm run prisma:deploy && npm run start:prod`
- **Health Check Path**: `/health`

Required Render environment variables:

```dotenv
DATABASE_URL=<neon-postgres-connection-string>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=1d
PORT=3000
```

Render injects its own `PORT` for web services. If Render provides a `PORT`, prefer that value.

## Code Quality

Run linting and formatting:

```bash
npm run lint
npm run format
```

Build the project:

```bash
npm run build
```
