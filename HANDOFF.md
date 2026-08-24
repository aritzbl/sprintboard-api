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
- Tickets: drag para estado/sprint, edición rápida desde card, story points editables, adjuntos Cloudinary,
  borrado lógico con confirmación de escritura y toast.
- Comentarios de tickets: CRUD, cada comentario conserva creador y solo su creador lo puede editar/eliminar.
  **Pendiente de validación manual completa por el usuario.**
- Usuarios globales: tabla paginada, filtros y borrado lógico. Cambios de roles con toast.
- Perfil: actualización de foto propagada en la UI; opción para restaurar avatar por defecto.

## Email y enlaces

Se agregó envío SMTP con Gmail mediante `nodemailer` y plantillas HTML de Kanbio:

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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
LINK_EXPIRATION_HOURS=24
```

Las mismas variables de mail están configuradas localmente, con `WEB_URL=http://localhost:3000`.
No exponer contraseñas de aplicación ni connection strings en commits, docs o chat.

## Migraciones y despliegue

- La migración `migrations/007_email_change_requests.sql` ya se ejecutó correctamente en Neon producción.
  Crea `email_change_requests` e índice por `user_id`.
- En producción no depender de `DB_SYNCHRONIZE`; aplicar scripts en `migrations/` mediante el SQL Editor
  de Neon antes de desplegar si se agrega una tabla/columna.
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

