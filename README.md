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
- Authenticated support tickets, ticket conversations, and instructor applications with administrator review.
- Moderator-managed course drafts, lesson materials, and administrator-controlled publication.
- Course lesson completion, final-test scoring, completion reviews, and verifiable certificates.
- Time-limited administrator advertisements, moderator proposals, impression/click tracking, and admin overview analytics.

## API Endpoints

| Method | Path             | Auth       | Description                              |
| ------ | ---------------- | ---------- | ---------------------------------------- |
| `POST` | `/auth/register` | Public     | Register a new student account.          |
| `POST` | `/auth/login`    | Public     | Login and receive a JWT access token.    |
| `GET`  | `/auth/profile`  | Bearer JWT | Return the current authenticated user.   |
| `GET`  | `/users/me`      | Bearer JWT | Return the authenticated user's profile. |
| `GET`  | `/health`        | Public     | Return service health status.            |

## Support Ticket Workflow

Authenticated users can submit a support ticket or instructor application. Ticket categories include technical issues, course questions, suggestions, feedback, and other requests. Instructor applications collect a specialty, relevant experience, and a proposed course.

Users can only access their own tickets. Administrators can review instructor applications and update their status; moderators can access regular support tickets but cannot view instructor applications. A staff reply closes a regular ticket. For an instructor application, the administrator can request more information; the applicant's reply returns it to review. Approving an application grants the `MODERATOR` role; the user must sign out and sign in again to refresh their session.

## Instructor and Course Workflow

Moderators can create and edit their own draft courses, add ordered lesson text, YouTube video links, and Google Drive resource links, then submit a complete course for administrator review. Native file uploads are not configured.

Administrators can approve a submitted course, return it for changes with feedback, and publish an approved course as a separate action. Only published courses appear in the public course list. Lesson text and resource links are returned only to enrolled learners.

Course management endpoints are under `/courses/manage`: staff can list manageable courses, moderators can create/edit/submit drafts, and administrators can update review status. Public course detail is available at `GET /courses/:slug`; enrolled course lessons are available at `GET /courses/:slug/content`.

### Course Completion and Certificates

Moderators can configure an optional final test and its passing score while creating a course. An enrolled learner completes every lesson before submitting the final test. Free courses issue a certificate automatically when the learner passes, or when all lessons are complete if there is no final test. Paid-course completion remains subject to the course moderator's approval; paid enrollment and payment processing are not enabled yet.

Learners can list their certificates at `GET /certificates/mine`, and anyone can verify a certificate using `GET /certificates/verify/:code`. Moderators review paid-course completion requests at `/courses/reviews/completions` and paid final-test attempts at `/courses/reviews/final-tests`.

For the legacy `rest-api-basics` course, learners whose existing `mission1` completion flag is true when this migration runs receive a certificate automatically. Their enrollment is marked completed as part of the backfill. Since the legacy flow did not store the mission completion timestamp, the certificate issue date is the migration date.

Certificates save the recipient name at issue time so later profile edits do not silently change the issued document. Learners can open the certificate from their account and use **PDF sifatida saqlash**; the browser print dialog lets them save an A4 landscape PDF. Its QR code opens the public certificate verification page.

### Advertisements and Analytics

Administrators can create active advertisements with an image URL, destination URL, and duration. Moderators can submit proposals that remain hidden until an administrator approves them. Active advertisements are listed at `GET /ads/active`; the frontend reports impressions and clicks to `POST /ads/:id/events`. Expired advertisements are removed from the active list and marked expired when the active-ad or staff-management endpoints are queried.

Administrators manage advertisements at `/ads/manage`, approve or reject moderator proposals at `/ads/manage/:id/review`, and see campaign impression/click totals in the admin overview. The administrator overview also includes course publication/completion, ticket status, and certificate totals.

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
