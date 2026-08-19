# SprintBoard API

Backend for **SprintBoard**, a mini-Jira to manage projects, sprints and tickets.
NestJS + TypeORM + PostgreSQL, with a hexagonal architecture. Firebase Auth is used
only to verify the caller's ID token; the `users` table mirrors the Firebase user.

## Architecture

```
src/
├── application/                # framework-agnostic core
│   ├── entities/               # domain entities, DTOs (nestjs-zod) and ports (gateways)
│   ├── services/               # cross-cutting services (Firebase)
│   └── usecases/               # one class per operation
├── infrastructure/
│   ├── data-access/persistence # TypeORM ORM entities + repository implementations
│   └── interfaces/http         # controllers + auth guards/decorators
├── modules/                    # NestJS feature modules (controller + its use cases)
├── config/                     # env schema (zod) and keys
├── app.module.ts
└── main.ts
```

Use cases depend on repository **ports** (`IUserRepository`, ...) injected via the
`RepositoryName.*` tokens. `PersistenceModule` binds each token to its TypeORM
implementation, so the core never imports TypeORM.

## Roles

| Action                                   | superadmin | pm | dev / qa |
| ---------------------------------------- | :--------: | :-: | :------: |
| Ticket CRUD (create/edit/move/delete)    |     ✅     | ✅ |    ✅    |
| Sprint management (create/update/delete) |     ✅     | ✅ |    ❌    |
| Create / update projects                 |     ✅     | ✅ |    ❌    |
| Delete projects · manage user roles      |     ✅     | ❌ |    ❌    |

The **first user to sync becomes `superadmin`**; everyone else starts as `dev`.

## HTTP routes (prefix `/api`)

| Method | Path | Access |
| --- | --- | --- |
| POST | `/users/me` | any authenticated Firebase user (profile sync) |
| GET | `/users/me` | any member |
| GET | `/users` | any member |
| PATCH | `/users/:id/role` | superadmin |
| GET | `/projects` · `/projects/:id` | any member |
| POST | `/projects` · PATCH `/projects/:id` | pm / superadmin |
| DELETE | `/projects/:id` | superadmin |
| GET | `/projects/:projectId/sprints` | any member |
| POST | `/projects/:projectId/sprints` | pm / superadmin |
| PATCH / DELETE | `/sprints/:id` | pm / superadmin |
| GET | `/projects/:projectId/tickets` (filters: `sprintId`, `status`, `assigneeId`) | any member |
| POST | `/projects/:projectId/tickets` | any member |
| GET / PATCH / DELETE | `/tickets/:id` | any member |

## Getting started

```bash
npm install
docker compose up -d          # PostgreSQL on localhost:5432
cp .env.example .env          # fill in the Firebase service-account values
npm run start:dev             # http://localhost:4000/api — Swagger at /docs
```

### Environment

See `.env.example`. You need a Firebase **service account** (Project settings →
Service accounts → Generate new private key) for `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`. Keep `DB_SYNCHRONIZE=true` only
in development (TypeORM auto-creates the schema from the entities).
