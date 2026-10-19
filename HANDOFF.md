# Kanbio — Handoff backend

> Actualizado: 2026-08-24. Frontend en `../sprintboard-web`.

## Producto y stack

Kanbio es un gestor de proyectos tipo mini-Jira: proyectos, miembros por proyecto, épicas, sprints,
tickets, evidencia y comentarios. Backend: NestJS 11, TypeORM, PostgreSQL/Neon y Firebase Admin.
La API usa el prefijo `/api`; Swagger local está en `/docs`.

Producción:

- API Render: `https://kanbio-api.onrender.com`
- Base de datos Neon: proyecto `wispy-sound-06582223`, branch `br-lively-surf-acd90x5p`.
- Front: `https://kanbio.vercel.app`

Local:

- API: `http://localhost:4000/api` (verificada saludable el 2026-08-24).
- El backend local está arrancado desde `dist/main.js`; antes de probar cambios, recompilar y reiniciar.
- Front esperado: `http://localhost:3000`.

## Acceso y roles

- `superadmin` es el único rol global. Puede administrar usuarios y crear/borrar proyectos.
- `pm`, `dev` y `qa` existen exclusivamente en `project_members`.
- Registrarse no concede acceso a proyectos: el usuario debe ser miembro o superadmin.
- El primer usuario sincronizado queda como superadmin; los demás quedan sin acceso hasta recibir una
  membresía/invitación.
- Los borrados de usuarios, proyectos, tickets y épicas son lógicos. Al borrar un proyecto, también se
  realiza el borrado lógico en cadena de sus recursos asociados.

## Funcionalidad implementada

- Proyectos: crear, editar, eliminar con confirmación de escritura; la `key` se puede cambiar solo si
  aún no tiene tickets. Las keys eliminadas pueden reutilizarse.
- Épicas: crear, editar, color configurable y asociación a tickets. Solo se pueden eliminar si no tienen
  tareas asociadas. Listado paginado y buscable en el frontend.
- Sprints/backlog/histórico: completar sprint conserva `done` en el histórico y mueve el resto al backlog
  u otro sprint. Sin sprint activo no se muestran tareas finalizadas como trabajo vigente.
- Tickets: drag para estado/sprint, edición rápida desde card, story points editables, adjuntos en S3,
  borrado lógico con confirmación de escritura y toast.
- Comentarios de tickets: CRUD, cada comentario conserva creador y solo su creador lo puede editar/eliminar.
  **Pendiente de validación manual completa por el usuario.**
- Usuarios globales: tabla paginada, filtros y borrado lógico. Cambios de roles con toast.
- Perfil: actualización de foto propagada en la UI; opción para restaurar avatar por defecto.

## Almacenamiento (S3)

Reemplaza a Cloudinary para evidencias de tickets y fotos de perfil (guía: `mercantil-crypto-gateway`).
El navegador sube **directo a S3** con URLs prefirmadas; la API solo firma y valida.

- `StorageService` (`src/application/services/storage.service.ts`, global vía `StorageModule`): `newKey`,
  `uploadUrl` (PUT, 5 min), `readUrl` (GET, firmada contra el inicio de la hora y válida 2 h: misma URL
  toda la hora → el navegador cachea), `publicUrl`, `stat` (HeadObject), `remove`.
- Keys: `<S3_KEY_PREFIX>/<evidence|avatars>/<ticketId|userId>/<uuid><ext>` (nunca el nombre del usuario).
- Evidencia: `POST /tickets/:id/attachments/upload-url {contentType,size}` → `{key,uploadUrl}` → PUT →
  `POST /tickets/:id/attachments {key,name}`. Al adjuntar la API valida que la key sea de ese ticket y
  lee tipo/tamaño **de S3** (HeadObject); si no califica, borra el objeto y responde 400. Idempotente.
  Se guarda `storagePath: "s3:<key>"`, `url: ""`; `TicketPresenter` firma la URL en cada respuesta de
  tickets. Los adjuntos viejos `cloudinary:` conservan su URL pública.
- Avatar: `POST /users/me/photo/upload-url {contentType,size}` → `{uploadUrl,publicUrl}` → PUT → `PATCH /users/me {photoURL}`.
  Solo `<prefix>/avatars/*` es público (bucket policy).
- Quitar evidencia sigue siendo un archivado lógico: el objeto **no** se borra de S3.
- Local: RustFS en `compose.yml` (`docker compose up -d s3 s3-init`), consola en
  http://localhost:9001/rustfs/console/ (sprintboard / sprintboard-secret). MinIO ya no publica imágenes.
- Gotchas: (1) el SDK v3 agrega checksums CRC32 por defecto que rompen el PUT prefirmado →
  `requestChecksumCalculation: 'WHEN_REQUIRED'`. (2) El presigner deja `content-type` sin firmar por defecto →
  `signableHeaders: ['content-type','content-length']`, si no un avatar público podría ser un HTML. (3) El bucket
  necesita CORS (`docker/s3/cors.json`); sin eso el navegador bloquea el PUT.
- Pendiente opcional: subidas que nunca se adjuntan quedan huérfanas en `evidence/` (privadas).

## Email y enlaces

Envío con `nodemailer` y plantillas HTML de Kanbio (`src/application/services/mail.service.ts`).
El proveedor se elige por ENV, mismo esquema que Oxavita:

- `IS_EMAIL_MOCKED=true` → **Mailpit** (`MAILPIT_URL`, por defecto `smtp://localhost:1026`), el buzón local
  de `compose.yml` (`docker compose up -d mailpit`, UI en http://localhost:8026). No sale nada afuera.
  Puertos 1026/8026 porque Oxavita/tublood usan 1025/8025.
- Si no, `EMAIL_PROVIDER`:
  - `smtp` (default) → cualquier SMTP: Brevo (`smtp-relay.brevo.com:587`, `SMTP_SECURE=false`,
    `SMTP_STARTTLS=true`, la clave es la *SMTP key*) o Gmail (`465`, `SMTP_SECURE=true`, app password).
    Sin `SMTP_HOST` → envío no configurado (503).
  - `ses` → Amazon SES por la API (`@aws-sdk/client-sesv2` vía transporte SES de nodemailer). Credenciales
    opcionales: `SES_ACCESS_KEY_ID`+`SES_SECRET_ACCESS_KEY` (sólo pruebas), si no `SES_ROLE_ARN` (AssumeRole
    con refresh automático), si no la cadena por defecto (rol IAM de la instancia). `AWS_REGION` opcional.
- `MAIL_FROM`: remitente verificado por el proveedor. Timeout de 10 s; un fallo de envío loguea
  `mail.send_failed` (asunto sí, cuerpo no: lleva el enlace) y responde 502.
- Booleanos de mail (`IS_EMAIL_MOCKED`, `SMTP_SECURE`, `SMTP_STARTTLS`) usan `envBoolean` en `config.ts`:
  `"false"` es false (con `z.coerce.boolean()` sería true).

Flujos que mandan mail:

- Invitación por email (incluye rol y proyectos).
- Recuperación de contraseña: el enlace lo genera Firebase; su vencimiento lo controla Firebase.
- Cambio de email: se genera solicitud propia, confirmada con token de un solo uso.
- Una invitación aceptada queda formalmente vencida y no se puede reutilizar.
- Corregir el email de una invitación rota el token anterior, genera uno nuevo y reinicia el vencimiento.

Todas las invitaciones y confirmaciones de cambio de email usan `LINK_EXPIRATION_HOURS`; el valor de
producción y local es `24`. El tiempo real **y el texto de los mails** salen de esa variable, no de un
`24` hardcodeado. La recuperación de contraseña es la única excepción porque Firebase controla su TTL.

Variables de Render necesarias (sin valores secretos en este documento):

```dotenv
DATABASE_URL=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
CORS_ORIGIN=https://kanbio.vercel.app
WEB_URL=https://kanbio.vercel.app
IS_EMAIL_MOCKED=false
EMAIL_PROVIDER=smtp          # o ses
MAIL_FROM=
# smtp (Gmail hoy; Brevo: smtp-relay.brevo.com / 587 / SMTP_SECURE=false)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASSWORD=
# ses: AWS_REGION= y credenciales opcionales (ver arriba)
LINK_EXPIRATION_HOURS=24
```

Localmente: `IS_EMAIL_MOCKED=true` + Mailpit, o las mismas variables reales con `WEB_URL=http://localhost:3000`.
No exponer contraseñas de aplicación ni connection strings en commits, docs o chat.

## Migraciones y despliegue

- La migración `migrations/007_email_change_requests.sql` ya se ejecutó correctamente en Neon producción.
  Crea `email_change_requests` e índice por `user_id`.
- En producción no depender de `DB_SYNCHRONIZE`; aplicar scripts en `migrations/` mediante el SQL Editor
  de Neon antes de desplegar si se agrega una tabla/columna.
- ⚠️ Fix (2026-10-19): `SHOW_SWAGGER` y `DB_SYNCHRONIZE` usaban `z.coerce.boolean()`, que lee `"false"` como
  `true` → en prod Swagger estaba expuesto y TypeORM sincronizaba el esquema pese a `DB_SYNCHRONIZE=false`.
  Ahora usan `envBoolean`. Consecuencia: desde este deploy prod **ya no** crea columnas solo; lo que faltaba
  migración se agregó como `008_project_member_role.sql` (`project_members.role`, idempotente) → correrla en
  Neon antes de desplegar. Si aparece `column ... does not exist`, es otra columna que solo existía por el sync.
- Render compila con `npm ci && npm run build` y arranca con `npm run start:prod`.
- Render usa Node y necesita dependencias de build instaladas; `@nestjs/cli` debe seguir disponible para
  que `nest build` funcione.
- Vercel despliega el repo frontend. Verificar que la cuenta/autorización de GitHub que pushea sea miembro
  del proyecto Vercel, o hacer un redeploy manual.

## Rutas relevantes agregadas

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/users/password-reset` | Envía mail con enlace de Firebase. |
| `POST` | `/users/me/email-change` | Solicita cambio de email para el usuario actual. |
| `GET` | `/users/email-change/:token` | Estado público de la solicitud. |
| `POST` | `/users/email-change/:token/confirm` | Confirma un token de cambio de email. |
| `PATCH` | `/invitations/:id` | Corrige email, rota token y reenvía invitación. |
| CRUD | `/tickets/:id/comments` | Comentarios de ticket. |

## Próxima sesión: checklist corto

1. Probar manualmente comentarios: crear, editar como creador, intentar editar/borrar como otro miembro,
   y borrar; revisar toasts y refresco.
2. Probar producción de correo: invitación, recuperación y cambio de email. Confirmar que la invitación
   y el cambio muestran el plazo de `LINK_EXPIRATION_HOURS` configurado.
3. Correr typecheck/build de ambos repos antes de commit y revisar el árbol sucio con cuidado: hay cambios
   acumulados de varias funcionalidades, no usar reset/clean.
4. Crear commits sin trailers de coautoría, pushear y luego aplicar migraciones nuevas (si las hubiera)
   antes de actualizar Render/Vercel.

