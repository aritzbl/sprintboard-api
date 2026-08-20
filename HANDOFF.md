# Kanbio — Backend Handoff (`sprintboard-api`)

> Estado a 2026-08-18. Este doc es para retomar en un chat nuevo sin perder contexto.
> El repo del front es `../sprintboard-web` (ver su propio `HANDOFF.md`).

**Kanbio** = mini-Jira para un equipo chico (2 devs, QA, PM). Proyectos → épicas → sprints → tickets
(bug/task/HU) con prioridad, story points, reporter/assignee, labels y **evidencia (foto/video)**.
Nombre visible del producto: **Kanbio** (los repos se llaman `sprintboard-*` por dentro).

## Stack
NestJS 11 + TypeORM 0.3 + PostgreSQL. DTOs con `nestjs-zod`. Swagger en `/docs`. Build con **webpack**
(`nest build`). Auth = **Firebase Auth**: el front manda el ID token como `Bearer`; el back lo verifica
con `firebase-admin` en un guard global. `users` en Postgres espeja al user de Firebase.

## Arquitectura (hexagonal, copiada de `Koibanx/mercantil-crypto-gateway`)
```
src/
├── application/
│   ├── entities/<dominio>/   # entity + gateway (puerto) + *.types.ts (DTOs zod)
│   ├── services/             # firebase.service, project-access.service (+ sus *.module.ts globales)
│   └── usecases/<dominio>/   # una clase por operación (execute())
├── infrastructure/
│   ├── data-access/persistence/  # base-typeorm.repo, database.module, persistence.module,
│   │                             # y por dominio: *.orm-entity.ts + *.typeorm-repository.ts
│   └── interfaces/http/
│       ├── controllers/          # users, projects, sprints, tickets, invitations
│       └── middlewares/auth/     # firebase-auth.guard, roles.guard, decorators
├── modules/                  # NestJS feature modules (controller + sus use cases)
├── config/                   # env-var.ts (enum) + config.ts (zod validate)
├── app.module.ts  ├── main.ts
```
- Use cases dependen de **puertos** (`IUserRepository`, etc.) inyectados por los tokens `RepositoryName.*`.
- `PersistenceModule` (global) bindea cada token a su repo TypeORM. Los use cases no importan TypeORM.
- `ProjectAccessService` (global, `@services/access.module`) centraliza los chequeos de membresía.

## Modelo de dominio (tablas)
- **users**: `id, firebaseUid, email, firstName, lastName, displayName, photoURL, role, createdAt`.
- **projects**: `id, name, key (prefijo único, mayúsc), description, ticketCounter, createdById`.
- **project_members**: `id, projectId, userId` (único por par). **Membresía = acceso.**
- **invitations**: `id, token, email?, role, projectIds[] (jsonb), status(pending/accepted/revoked), createdById, acceptedById?, expiresAt?`.
- **sprints**: `id, projectId, name, goal?, status(planned/active/completed), startDate?, endDate?`.
  - **Completar sprint** (`POST /sprints/:id/complete`, `CompleteSprintUseCase`): pone `status=completed`,
    deja **solo las `done`** archivadas en el sprint y **mueve el resto** (todo/in_progress/qa **y rejected**,
    que hay que rehacer) según `moveTo`: `'backlog'` (→ `sprintId=null`) o el id de otro sprint no completado
    del mismo proyecto (valida: existe, mismo proyecto, no completado, distinto del actual; sino 400).
- **epics**: `id, projectId, name, description?, createdAt, updatedAt`. Una épica agrupa tickets del
  mismo proyecto; borrarla **desasocia** sus tickets (`epicId=null`), nunca los borra.
- **tickets**: `id, projectId, key (PROJ-1), title, description?, type(bug/task/story), priority(low/medium/high/critical),
  storyPoints?, status(todo/in_progress/qa/done/rejected), reporterId, assigneeId?, sprintId?(null=backlog), epicId?,
  labels[], **attachments (jsonb)**, order`.
  - **Máquina de estados** (`TICKET_TRANSITIONS`/`canTransition` en `ticket.entity.ts`; la valida
    `UpdateTicketUseCase`, 400 si es inválida): `todo→in_progress→qa→(done|rejected)`; y `done`/`rejected`
    pueden volver a `qa` o `in_progress`. Toda tarea nace en `todo`. Mismo→mismo siempre permitido.
  - `attachments[]` = `{ id, url, storagePath, name, contentType, size, uploadedById, createdAt }`
    (metadata de archivos subidos a **Cloudinary**; el archivo NO pasa por el back).

## Roles y acceso
- Rol **global**: solo `superadmin` (todo + gestión de usuarios/proyectos + asigna miembros).
  `pm`, `dev` y `qa` son roles de `project_members`: PM gestiona ese proyecto y cualquier miembro
  puede trabajar sus tickets.
- **El primer usuario que sincroniza queda `superadmin`.** Los demás arrancan `dev` (sin acceso hasta
  que tengan una membresía de proyecto).
- **Acceso por proyecto**: registrarse NO da acceso a nada. El superadmin asigna usuarios a proyectos
  (`project_members`). **Superadmin ve todo** (bypass). El creador de un proyecto queda como miembro.
- **Onboarding por link** (sin email): superadmin crea una invitación (rol + projectIds) → comparte el
  `token` → el invitado se loguea/registra y **acepta** → queda con ese rol + membresías.
- Gating: `list-projects`, proyectos, miembros, sprints y tickets validan membresía; el acceso a una
  ruta por id siempre se evalúa contra el `projectId` real del recurso. `superadmin` es el único bypass.
  Crear, actualizar, completar o borrar sprints y actualizar un proyecto requieren PM de ese proyecto.
  Los adjuntos también chequean acceso al proyecto del ticket.
- `@Public()` (decorator) saltea auth en una ruta (se usa en `GET /invitations/:token`).

## Rutas (prefijo `/api`)
| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/users/me` | cualquier user Firebase (sync perfil, `@AllowUnsynced`) |
| PATCH | `/users/me` | usuario actual (nombre, apellido, foto de perfil) |
| GET | `/users/me` · `/users` | miembro |
| PATCH | `/users/:id/role` | superadmin |
| GET | `/projects` · `/projects/:id` | miembro (filtrado) |
| POST | `/projects` · PATCH `/projects/:id` | pm/superadmin |
| DELETE | `/projects/:id` | superadmin |
| GET/POST/DELETE | `/projects/:projectId/members[/:userId]` | GET miembro · POST/DELETE superadmin |
| POST/GET | `/invitations` | superadmin |
| GET | `/invitations/:token` | público |
| POST | `/invitations/:token/accept` | user logueado |
| DELETE | `/invitations/:id` | superadmin |
| GET/POST | `/projects/:projectId/epics` | GET miembro · POST PM/superadmin |
| PATCH/DELETE | `/epics/:id` | PM/superadmin |
| GET/POST | `/projects/:projectId/sprints` | GET miembro · POST pm/superadmin |
| PATCH/DELETE | `/sprints/:id` | pm/superadmin |
| POST | `/sprints/:id/complete` (body `{ moveTo: 'backlog' \| <sprintId> }`) | pm/superadmin |
| GET/POST | `/projects/:projectId/tickets` (filtros `sprintId`|`backlog`, `status`, `assigneeId`) | miembro |
| GET/PATCH/DELETE | `/tickets/:id` | miembro |
| POST | `/tickets/:id/attachments` | miembro |
| DELETE | `/tickets/:id/attachments/:attachmentId` | miembro |

## Límites de campos (coherentes) — pedido del usuario
Back (zod) YA aplicado: **ticket** title ≤200, description ≤1000, labels ≤20 c/u ≤40, storyPoints 0–100.
**project** name ≤80, key ≤50 (mayúsc, `[A-Z0-9_-]`, única), description ≤500.
**sprint** name ≤80, goal ≤300. **user** first/last ≤60, displayName ≤120. **invitation** expiresInDays 1–90.
**attachment** name ≤255, url ≤2048, size ≤200MB. ⚠️ Falta reflejar estos límites como `maxLength` en el FRONT.

## Cómo correrlo
```bash
docker compose up -d          # Postgres en host :5442 (mapea 5442:5432)
npm run start:dev             # http://localhost:4000/api, Swagger en /docs
```
`.env` (gitigneado) ya está cargado con el proyecto Firebase real **kanbio** + DB en 5442.
`CORS_ORIGIN` incluye `http://localhost:3000,3001,53553`.

## ⚠️ Gotchas (importantes)
1. **Postgres nativo en el host**: hay un PostgreSQL 17 **nativo** ocupando `:5432`. Por eso el compose
   mapea **`5442:5432`** y `DB_PORT=5442`. Si cambiás esto, la app pega contra el PG nativo y falla auth.
2. **DB_SYNCHRONIZE=true recrea columnas**: al **ampliar un `varchar`** en una tabla con filas, TypeORM
   sync a veces intenta drop+add y falla (`column X contains null values`). Solución usada: hacer el
   `ALTER TABLE ... ALTER COLUMN ... TYPE varchar(N)` **a mano** en psql y después arrancar (ya se hizo
   para `projects.key`→50 y `tickets.title`→200). Para prod: migraciones reales, no synchronize.
3. **Guards globales**: los guards se registran con `APP_GUARD` en `auth.module.ts` (NO `@UseGuards` por
   controller — rompía la DI). Swagger `/docs` queda público (no pasa por el router de Nest).
4. **`patchNestJsSwagger()` sacado** de `main.ts`: `nestjs-zod@4` es incompatible con `@nestjs/swagger@11`.
   Y `nestjs-zod` **no** es plugin del Nest CLI (se sacó de `nest-cli.json`).
5. `npm run typecheck` y `npm run build` (webpack) están en **verde**.

## Estado actual de la DB (dev)
1 superadmin (el dueño), 1 proyecto, 2 tickets. No borrar la DB (se pierde la cuenta superadmin).

## Lo que sigue (backend)
- ✅ **Roles por proyecto (2026-08-19, sin commit):** `ProjectMember` guarda `pm`/`dev`/`qa`; invitaciones,
  altas de miembros y el endpoint `PATCH /projects/:projectId/members/:userId/role` lo persisten. El cambio
  de rol no crea membresías inexistentes. Los PM se validan con `ProjectAccessService.assertManager` y los
  endpoints de tickets/sprints verifican acceso al recurso real. Solo superadmin puede crear proyectos.
  Los proyectos nuevos dan al creador rol PM. Typecheck y build de API y web están en verde. Tras reiniciar la
  API de desarrollo, TypeORM sincroniza la nueva columna nullable `project_members.role`; a las membresías
  existentes hay que asignarles un rol desde la pestaña Miembros (las no asignadas se tratan como `dev`).
- ✅ **Épicas (2026-08-19, sin commit):** nueva entidad, rutas y tab de UI. PM/superadmin puede crear,
  editar o borrar épicas; cualquier miembro las lista y el selector de TicketModal permite asociar o quitar la
  asociación. API valida que `epicId` pertenezca al proyecto del ticket. Al reiniciar la API, TypeORM crea
  `epics` y la columna nullable `tickets.epic_id`. Typecheck y builds de ambos repos están en verde.
- (Opcional) limpieza de archivos en Cloudinary al borrar ticket/proyecto (hoy solo se borra la
  metadata; el archivo queda huérfano en Cloudinary).
- Deploy: definir hosting del back (Vercel serverless / Railway / Cloud Run) + Postgres gestionado.
