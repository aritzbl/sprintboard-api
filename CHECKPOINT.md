# SprintBoard — Checkpoint (2026-08-17)

Mini-Jira para gestionar proyectos, sprints y tickets. Dos repos hermanos en
`Desktop/Proyectos/`:

- `sprintboard-api/` → **NestJS + TypeORM + PostgreSQL** (este repo)
- `sprintboard-web/` → **Next.js 15 (App Router) + Tailwind** (scaffold + pendiente)

## Decisiones tomadas

- **DB relacional: PostgreSQL** (nada de Mongo/Firestore) con **TypeORM**.
- **Auth: Firebase Auth** (Google + email/password). El front obtiene el ID token
  y lo manda como `Bearer`; el back lo verifica con `firebase-admin` en un guard.
  La tabla `users` en Postgres espeja al usuario de Firebase (`firebaseUid` + rol + perfil).
- **Arquitectura hexagonal** copiada del repo de referencia `mercantil-crypto-gateway`:
  `application/{entities,usecases,services}` + `infrastructure/{data-access/persistence, interfaces/http}`,
  repos detrás de puertos (`IBaseRepository<T>`), una use-case por operación,
  DTOs con `nestjs-zod`, Swagger, build con webpack.
- **Multi-proyecto**: cada `project` tiene su key (prefijo) y contador; tickets = `PROJ-1`, `PROJ-2`.
- **Roles**: `superadmin` (todo + gestión de usuarios), `pm` (gestiona proyectos/sprints + CRUD tickets),
  `dev`/`qa` (CRUD tickets). El **primer usuario que sincroniza queda superadmin**.
- **Código 100% en inglés.** Front adopta convenciones de `koin-dashboard`: axios + SWR + react-hook-form + zustand.
- Story points en Fibonacci (1,2,3,5,8,13,21). Estados de ticket: `todo → in_progress → qa → done`.

## Estado del backend — ✅ COMPLETO (typecheck + build en verde)

### Hecho
- Config raíz: `package.json`, `tsconfig(.build).json`, `nest-cli.json` (webpack, **sin** el plugin
  inválido `nestjs-zod`), `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `.env.example`, `compose.yml`.
- `src/config/`: `env-var.ts` (enum) + `config.ts` (validación zod de env, `validateEnv`).
- `src/application/services/`: `firebase.service.ts` (verifyIdToken) + `firebase.module.ts` (global).
- Dominio completo (entity + gateway + `*.types.ts` DTO) para `user`, `project`, `sprint`, `ticket`,
  y `shared/base-repository.gateway.ts` (`IBaseRepository`, `RepositoryName`).
- Persistencia: `base-typeorm.repository.ts`, `database.module.ts` (TypeORM forRootAsync),
  `*.orm-entity.ts` + `*.typeorm-repository.ts` por dominio, y **`persistence.module.ts`** (global:
  bindea `RepositoryName.* → *TypeOrmRepository` + `forFeature` de las 4 orm entities, exporta los tokens).
- Auth: `firebase-auth.guard.ts`, `roles.guard.ts`, `roles.decorator.ts` (`@Roles`, `@AllowUnsynced`),
  `current-user.decorator.ts` (`@CurrentUser`, `@CurrentFirebaseToken`), `authenticated-request.ts`, `auth.module.ts` (global).
- Use cases (17): user (sync/list/update-role), project (create/list/get/update/delete),
  sprint (create/list/update/delete), ticket (create/list/get/update/delete).
- **Controllers** (`infrastructure/interfaces/http/controllers/`): `users`, `projects`, `sprints`, `tickets`,
  con decoradores Swagger + guards + `@CurrentUser` (patrón de `mercantil-crypto-gateway`).
- **Feature modules** (`src/modules/`): `user`, `project`, `sprint`, `ticket` (controller + sus use cases).
- **`app.module.ts`**: ConfigModule (isGlobal + `validateEnv`), Firebase, Database, Persistence, Auth,
  4 feature modules, `APP_PIPE = ZodValidationPipe`.
- **`main.ts`**: CORS por `CORS_ORIGIN`, `setGlobalPrefix('api')`, Swagger en `/docs` (`patchNestJsSwagger()`), listen PORT.
- `README.md`.
- `npm install` OK · `npm run typecheck` → **0 errores** · `npm run build` (webpack) → **OK**.

### Smoke test de arranque — ✅ PASADO (2026-08-17)
Booteado contra un Postgres descartable + service-account key de descarte. Verificado:
`Nest application successfully started`, TypeORM crea las 4 tablas (users/projects/sprints/tickets),
y las rutas protegidas devuelven `401 {"message":"Missing bearer token"}`. Todo el entorno de prueba
(`.env`, key, containers) fue limpiado.

**2 bugs que cazó el smoke test y se corrigieron:**
1. **Guards**: `@UseGuards(FirebaseAuthGuard, RolesGuard)` a nivel controller hacía que Nest intentara
   instanciar el guard en el contexto del feature module (sin `forFeature([UserOrmEntity])`) → falla DI.
   **Fix**: registrar los guards **globalmente con `APP_GUARD`** en `auth.module.ts` (donde sí está el
   `forFeature`), y sacar los `@UseGuards` de los 4 controllers. `@Roles`/`@AllowUnsynced` se mantienen.
2. **Swagger**: `patchNestJsSwagger()` de `nestjs-zod@4.3.1` accede a un path interno de
   `@nestjs/swagger@11` que ya no se exporta → crash al bootear. **Fix**: se quitó la llamada de `main.ts`
   (Swagger funciona igual; solo se pierde el auto-schema de los DTOs zod en la UI).

### ⚠️ Nota de entorno (máquina del usuario)
Hay un **PostgreSQL 17 nativo** (`postgresql-x64-17`) escuchando en el `localhost:5432` del host, así que
la app pega contra ése (credenciales distintas) en vez del container de compose. Opciones para el usuario:
detener el servicio nativo, **o** mapear el compose a otro puerto (p.ej. `5442:5432` + `DB_PORT=5442`).

### Pendiente del backend
- Arranque real: el usuario carga credenciales **reales** de Firebase en `.env` (ver más abajo),
  resuelve el puerto de Postgres (nota de arriba) y corre `npm run start:dev`.

### Rutas HTTP (prefijo `/api`)
- `POST /users/me` (`@AllowUnsynced`) · `GET /users/me` · `GET /users` · `PATCH /users/:id/role` (superadmin)
- `GET /projects` · `GET /projects/:id` · `POST /projects` (pm/superadmin) · `PATCH /projects/:id` (pm/superadmin) · `DELETE /projects/:id` (superadmin)
- `GET|POST /projects/:projectId/sprints` (POST pm/superadmin) · `PATCH|DELETE /sprints/:id` (pm/superadmin)
- `GET|POST /projects/:projectId/tickets` (filtros: `sprintId`|`backlog`, `status`, `assigneeId`) · `GET|PATCH|DELETE /tickets/:id` (cualquier rol)

## Convenciones del frontend (a seguir, extraídas de `koin-dashboard`)
- **HTTP**: `src/services/api.ts` = `axios.create({ baseURL: NEXT_PUBLIC_GATEWAY_URL })`;
  wrapper tipado `src/services/service.ts` (`service.get/post/patch/put/delete` → `KbResponse<T>` =
  `Promise<Response<T>>`). Interceptor de request inyecta `Authorization: Bearer <Firebase ID token>`
  (via `auth.currentUser.getIdToken()`; el SDK auto-refresca, no hace falta refresh manual).
- **Servicios por dominio**: `services/<x>Service/<x>Routes.ts` (builders de rutas) + `<x>Service.ts`
  (usa `service`) + `hooks/useGetX.ts` (SWR). Config global `src/config/swrDefaultConfig.ts`.
- **Estado**: stores zustand en `src/store/` (auth/profile). **RBAC** con componente `Can` (gatea por rol/permiso).
- **Estilos**: Tailwind (NO el SCSS + `@koibanx/chain-ui` privado del dashboard). Estructura sí:
  `components/{elements,layouts,modules}`, `models/`, `utils/{hooks,parsers,helpers}`, aliases `@services/@store/@models/@utils/@config`.
- **Validación de forms**: zod + `@hookform/resolvers/zod` (consistente con el back; el dashboard usa joi).

## Estado del frontend — base HECHA y verificada (login renderiza en el dev server)
Nombre visible del producto: **Kanbio**. Paleta Rumbo (acento `#E5482D`) en Tailwind v4 (`@theme` en globals.css).
- **Cliente**: `services/api.ts` (axios + interceptor con Firebase ID token, `auth` nullable si falta `.env.local`),
  `services/service.ts` (wrapper tipado). `config/appConfig.ts`, `config/swrConfig.ts`.
- **Firebase web**: `lib/firebase.ts`. **Tipos espejo**: `lib/types.ts` (+ labels + permisos). `lib/cn.ts`.
- **Auth**: `store/authStore.ts` (zustand), `components/providers/AuthProvider.tsx` (onAuthStateChanged→sync perfil),
  `app/providers.tsx` (SWRConfig+Auth), `hooks/useAuthActions.ts` (login/register/google/logout),
  `components/auth/AuthGate.tsx`. **RBAC**: `components/Can.tsx`.
- **Servicios+hooks** por dominio: user/project/sprint/ticket (`services/*Service.ts` + `hooks/use*.ts`).
- **UI**: `components/brand/Logo.tsx`, `components/ui/{Button,Spinner}.tsx`.
- **Pantallas**: `app/login/page.tsx` (email/pass + Google, estilo Kanbio) ✅ verificada; `app/page.tsx` (redirect);
  `app/projects/page.tsx` (placeholder protegido con top-bar).

### Env wired (archivos locales, gitignored) — proyecto Firebase "kanbio"
- `sprintboard-web/.env.local`: config web de Firebase + `NEXT_PUBLIC_API_URL`.
- `sprintboard-api/.env`: service account (private key **validada con `openssl rsa -check` → OK**, corregí 1 typo),
  `DB_PORT=5442`, `CORS_ORIGIN=http://localhost:3000,http://localhost:3001`.
- `compose.yml` mapea **5442:5432** (evita el PG nativo del host).
- Backend booteó con creds reales: `/docs` 200, `/api/*` 401 sin token, `Firebase Admin initialized`.

### ⬜ Pendiente del frontend (próximo)
AppShell autenticado (top-bar: selector de proyecto + "Nueva tarea" + avatar/logout), lista de proyectos con
modal de alta, **tablero Kanbio** (columnas To Do/In Progress/To Test/Done/Rejected con `@dnd-kit`), backlog,
gestión de sprints, modal de ticket (crear/editar/asignar/mover/story points/labels), admin de usuarios/roles (`Can`).
**Importante**: el primer usuario que se registre queda **superadmin** → que se registre primero el dueño.

## Lo que necesito del usuario (Firebase)
Crear el proyecto Firebase en https://console.firebase.google.com y:
1. Auth → habilitar proveedores **Google** y **Email/Password**.
2. **Service account** (Project settings → Service accounts → Generate new private key) → back (`.env`).
3. **Web app config** (Project settings → General → Your apps → Web) → front (`.env.local`).

## Comandos para retomar
```bash
# Backend
cd sprintboard-api
npm install
docker compose up -d          # Postgres en localhost:5432
cp .env.example .env          # completar credenciales reales de Firebase
npm run start:dev             # http://localhost:4000/api, Swagger en /docs

# Frontend
cd ../sprintboard-web
npm run dev                   # http://localhost:3000
```
