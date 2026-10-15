# Dexa Backend

A REST API for the Dexa WFH Attendance System, built with NestJS, TypeScript, PostgreSQL, and Prisma. It provides authentication, employee profile management, attendance tracking, and HR administration for the employee and HR web applications.

## Features

- **Authentication and authorization** — JWT-based authentication with employee and HR roles.
- **Employee management** — Retrieve employee profiles, update profile information, and change passwords.
- **Attendance management** — Check-in and check-out, retrieve daily attendance, view paginated attendance history, and retrieve monthly summaries.
- **HR administration** — Employee administration and attendance reporting for authorized HR users.
- **Notifications** — Notification retrieval and read-state management for HR.
- **API documentation** — Interactive Swagger UI with documented request and response schemas and Bearer authentication.
- **Input validation** — Request validation and transformation using NestJS validation pipes, `class-validator`, and `class-transformer`.
- **Automated testing** — Unit tests, end-to-end tests, and coverage reporting using Vitest and Supertest.
- **Database management** — PostgreSQL persistence and schema migrations using Prisma ORM.
- **Event integration** — RabbitMQ configuration for integration with the wider Dexa system.

## Technology Stack

| Technology | Purpose |
|---|---|
| NestJS 12 | Backend framework |
| TypeScript | Application language |
| PostgreSQL | Relational database |
| Prisma ORM 7 | Database access and migrations |
| `@prisma/adapter-pg` | PostgreSQL driver adapter |
| Passport and JWT | Authentication |
| `bcryptjs` | Password hashing |
| `class-validator` and `class-transformer` | Request validation |
| Swagger / OpenAPI | Interactive API documentation |
| Vitest and Supertest | Automated testing |
| RabbitMQ | Message-based integration |

## Related repositories

The backend is part of a four-repository project:

- [dexa-employees](https://github.com/AdriAntoriV2/dexa-employees) — Employee-facing web application.
- [dexa-hr](https://github.com/AdriAntoriV2/dexa-hr) — HR-facing web application.
- [dexa-audit](https://github.com/AdriAntoriV2/dexa-audit) — Audit application.
- **dexa-backend** — REST API and backend services.

## Getting Started

### Prerequisites

Before running the backend, ensure you have:

- Node.js and npm installed.
- Access to a PostgreSQL database.
- Access to a RabbitMQ instance if required by the enabled messaging integration.
- Git installed.

### 1. Clone the repository

```text
git clone https://github.com/AdriAntoriV2/dexa-backend.git
```

Open a terminal in the cloned repository directory.

### 2. Install dependencies

```text
npm install
```

### 3. Configure environment variables

Create a local `.env` file based on the provided `.env.example`.

```text
cp .env.example .env
```

Configure the variables with values for your local environment.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL used by the application. |
| `DIRECT_URL` | Direct PostgreSQL connection URL used by Prisma tooling. |
| `JWT_SECRET` | Secret used to sign and verify JWTs. |
| `JWT_EXPIRES_IN` | JWT expiration duration. |
| `HR_EMAIL` | Email for the initial HR account. |
| `HR_PASSWORD` | Password for the initial HR account. |
| `HR_FULL_NAME` | Full name for the initial HR account. |
| `HR_POSITION` | Position for the initial HR account. |
| `RABBITMQ_URL` | RabbitMQ connection URL. |
| `CORS_HR` | Allowed origin for the HR frontend. |
| `CORS_EMPLOYEES` | Allowed origin for the employee frontend. |
| `PORT` | Optional server port; defaults to `3000`. |

Use valid connection URLs and frontend origins for your setup. For local development, the frontend origins should match the addresses where the two web applications are running.

**Security:** Never commit your actual `.env` file, database credentials, JWT secret, or HR account password. Use strong secrets and dedicated credentials outside local development.

### 4. Generate the Prisma client

```text
npx prisma generate
```

### 5. Apply database migrations

For a local development database, apply migrations with:

```text
npx prisma migrate dev
```

To seed the database using the configured Prisma seed command:

```text
npx prisma db seed
```

The seed process uses the project's configured seed script. Review its implementation before running it against any database containing important data.

For a deployed environment, use the appropriate production migration workflow rather than development migrations.

### 6. Start the application

Start the backend in watch mode:

```text
npm run start:dev
```

By default, the API listens on:

```text
http://localhost:3000
```

## API Documentation

The backend provides interactive Swagger documentation.

Once the application is running, open:

**[http://localhost:3000/docs](http://localhost:3000/docs)**

Swagger allows you to explore the available endpoints, inspect request and response schemas, review validation requirements, and send API requests directly from the browser.

For protected endpoints, use the Swagger **Authorize** control to provide a valid Bearer token.

The Swagger specification is the primary reference for the complete endpoint list and its detailed request and response contracts.

## API Overview

The API supports the following functional areas:

| Area | Capabilities |
|---|---|
| Authentication | Login and retrieve the authenticated user's identity. |
| Employee profiles | Retrieve and update the current employee's profile and change their password. |
| Employee administration | HR-only employee management. |
| Attendance | Check-in, check-out, retrieve today's attendance, view history, and retrieve monthly summaries. |
| HR reporting | Cross-employee attendance history, summaries, and overview reporting. |
| Notifications | Retrieve HR notifications and manage their read state. |

Examples of core routes include:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/login` | Authenticate an account. |
| `GET` | `/auth/me` | Retrieve the authenticated user's identity. |
| `GET` | `/employees/me` | Retrieve the current employee profile. |
| `PATCH` | `/employees/me` | Update permitted profile fields. |
| `PATCH` | `/employees/me/password` | Change the current user's password. |
| `POST` | `/attendance/check-in` | Record a check-in. |
| `POST` | `/attendance/check-out` | Record a check-out. |
| `GET` | `/attendance/me/today` | Retrieve today's attendance status. |
| `GET` | `/attendance/me/history` | Retrieve paginated attendance history. |
| `GET` | `/attendance/me/summary` | Retrieve a monthly attendance summary. |

Some endpoints require authentication and specific roles. Refer to Swagger for the complete route list, authorization requirements, query parameters, and error responses.

## Authentication and Authorization

The API uses JWT Bearer authentication for protected routes.

The system defines two primary roles:

- `EMPLOYEE` — Access to permitted employee-facing functionality, including personal profile and attendance operations.
- `HR` — Access to authorized HR administration, employee management, and cross-employee attendance reporting.

Access is enforced by the backend. Frontend route restrictions are not a substitute for API-side authorization.

## Testing

Automated tests are run with Vitest. End-to-end tests use the separate Vitest E2E configuration and can exercise HTTP behavior through Supertest.

Run the unit and specification tests:

```text
npm run test
```

Run tests in watch mode:

```text
npm run test:watch
```

Run end-to-end tests:

```text
npm run test:e2e
```

Generate a test coverage report:

```text
npm run test:cov
```

Run the code linter:

```text
npm run lint
```

Format source and test files:

```text
npm run format
```

Build the application:

```text
npm run build
```

## Production Build

Compile the application:

```text
npm run build
```

Start the compiled application:

```text
npm run start:prod
```

Before deploying, configure production environment variables, verify database connectivity, apply the appropriate database migrations, and configure the exact allowed frontend origins through `CORS_HR` and `CORS_EMPLOYEES`.

Keep secrets in your hosting provider's environment configuration rather than in source control.

## Audit Integration

The backend integrates with the separate Dexa Audit application through RabbitMQ, using asynchronous events to communicate employee profile changes.

### Employee Profile Change Events

When an employee profile is updated, the backend can publish an `employee.profile.changed` event containing:

| Field | Description |
|---|---|
| `eventId` | Unique event identifier generated using UUID. |
| `eventType` | Event type: `employee.profile.changed`. |
| `employeeId` | ID of the employee whose profile changed. |
| `changedFields` | Names of the fields that changed. |
| `occurredAt` | Event timestamp in ISO 8601 format. |

Events are published to the `employee.profile.changed` RabbitMQ queue as JSON messages. The publisher uses a durable queue, persistent messages, and publisher confirmations to improve delivery reliability.

### Dead-Letter Queue

The integration declares a dead-letter queue named `employee.profile.changed.dead`. Messages rejected or dead-lettered according to RabbitMQ's queue behavior can be routed there for further inspection.

### Configuration

Configure `RABBITMQ_URL` to point to the RabbitMQ instance shared by the backend and the relevant consumer.

The Dexa Audit application can consume these events to support its audit-recording workflow. The backend publishes profile-change events; audit-record persistence and event consumption are handled by the audit integration.

This integration keeps audit-event communication separate from the main REST API request flow while providing a structured event contract for downstream processing.

## License

This repository is currently marked `UNLICENSED` in its package metadata. Contact the repository owner for permission and licensing details before redistributing or reusing the code.
