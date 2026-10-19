# Publicación sin costo (beta interna)

Este esquema usa **Neon** para PostgreSQL, **Render** para la API y **Vercel** para la web. No requiere tarjeta, pero Render pausa la API tras 15 minutos sin uso: el siguiente acceso puede tardar alrededor de un minuto.

## 1. Base de datos

1. Crear un proyecto gratuito en Neon y copiar la cadena de conexión directa con `sslmode=require`.
2. Guardarla como `DATABASE_URL` al crear el servicio de Render.

## 2. API en Render

1. En Render, crear un **Blueprint** desde este repositorio y seleccionar `render.yaml`.
2. Completar las variables que Render pide como secretas. Copiar los valores de Firebase desde el entorno local, sin subirlos a Git.
3. Para el primer deploy, con la base de Neon recién creada y vacía, definir `DB_SYNCHRONIZE=true` para que TypeORM cree el esquema inicial.
4. Cuando el deploy responda `GET /api/health` con `{ "status": "ok" }`, cambiar `DB_SYNCHRONIZE=false` y ejecutar un deploy manual. Así los siguientes deploys no modifican el esquema de forma automática.
5. Inicialmente `CORS_ORIGIN` puede ser `*`. Se reemplaza por el dominio final de Vercel al terminar el paso siguiente.
6. Para enviar invitaciones y recuperación de contraseña, definir `WEB_URL`, `LINK_EXPIRATION_HOURS=24`, `MAIL_FROM` (remitente verificado por el proveedor), `IS_EMAIL_MOCKED=false` y `EMAIL_PROVIDER`: `smtp` (Brevo: `smtp-relay.brevo.com`, `587`, `SMTP_SECURE=false`, `SMTP_STARTTLS=true`, con la *SMTP key*; Gmail: `smtp.gmail.com`, `465`, `SMTP_SECURE=true` y una **contraseña de aplicación**, nunca la normal) más `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`; o `ses` (Amazon SES por API) con `AWS_REGION` y credenciales opcionales (`SES_ACCESS_KEY_ID`/`SES_SECRET_ACCESS_KEY`, o `SES_ROLE_ARN`; sin ninguna usa el rol IAM). Detalle en HANDOFF.md → Email y enlaces.
7. Para evidencias y fotos de perfil, definir `S3_BUCKET`, `S3_REGION`, `S3_KEY_PREFIX=prod`, `S3_PUBLIC_BASE_URL` y las claves `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` de un usuario IAM (ver «Almacenamiento en S3»). No definir `S3_ENDPOINT` ni `S3_FORCE_PATH_STYLE`: son solo para el S3 local.

### Cambios de esquema posteriores

Con `DB_SYNCHRONIZE=false`, ejecutar primero los SQL versionados en la carpeta `migrations/` desde el editor SQL de Neon y recién después desplegar la API. Cada archivo se ejecuta una sola vez y en orden; por ejemplo, el borrado lógico usa `002_soft_delete.sql`, la reutilización de keys archivadas usa `003_project_key_reuse_and_ticket_index.sql`, los índices de rendimiento usan `004_query_performance_indexes.sql`, la baja lógica de usuarios usa `005_soft_delete_users.sql`, los comentarios usan `006_ticket_comments.sql` la confirmación de cambio de email usa `007_email_change_requests.sql` y el rol por proyecto de los miembros usa `008_project_member_role.sql`.

### Almacenamiento en S3

Evidencias y fotos de perfil se suben **directo del navegador a S3** con URLs prefirmadas que firma la API: el archivo nunca pasa por Render. Las evidencias son privadas (la API firma una URL de lectura en cada respuesta); solo `prod/avatars/*` es público.

1. Crear el bucket (por ejemplo `kanbio-files`) en la región de `S3_REGION`.
2. **Block Public Access**: dejar bloqueados los ACL y desactivar solo las dos opciones de *bucket policies*, para que aplique la política de avatares.
3. **Bucket policy**, solo avatares públicos:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicProfilePhotos",
       "Effect": "Allow",
       "Principal": "*",
       "Action": ["s3:GetObject"],
       "Resource": ["arn:aws:s3:::kanbio-files/prod/avatars/*"]
     }]
   }
   ```
4. **CORS**, para el PUT del navegador:
   ```json
   [{
     "AllowedOrigins": ["https://kanbio.vercel.app"],
     "AllowedMethods": ["PUT", "GET"],
     "AllowedHeaders": ["content-type"],
     "MaxAgeSeconds": 3600
   }]
   ```
5. **Usuario IAM** para la API con esta política; sus claves van en `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::kanbio-files/prod/*"
     }]
   }
   ```
6. `S3_PUBLIC_BASE_URL=https://kanbio-files.s3.<región>.amazonaws.com` (o un CloudFront delante del bucket).

En local, `docker compose up -d s3 s3-init` aplica lo mismo sobre RustFS con `docker/s3/*.json`. Las evidencias viejas de Cloudinary se siguen mostrando con su URL original; no se migran.

## 3. Web en Vercel

1. Importar el repositorio `sprintboard-web` en Vercel (rama `main`).
2. Definir las variables de entorno de producción:
   - `NEXT_PUBLIC_API_URL=https://<tu-servicio>.onrender.com/api`
   - Las cinco variables públicas de Firebase ya presentes en `.env.local`.
   - Nada de Cloudinary: evidencias y fotos se suben a S3 a través de la API.
3. Publicar y copiar la URL `https://<tu-app>.vercel.app`.
4. Volver a Render y asignar esa URL exacta a `CORS_ORIGIN`.
5. En Firebase Authentication, agregar el dominio de Vercel a **Authorized domains**. Sin este paso no funcionarán el login ni el registro en producción.

## Verificación

- Abrir `https://<api>.onrender.com/api/health` y comprobar que responde `status: ok`.
- Registrarse, crear un proyecto, una épica y una tarea.
- Crear y aceptar una invitación desde una sesión distinta.

> Este setup es adecuado para una beta interna sin presupuesto. Vercel Hobby es para uso personal/no comercial y Render no recomienda su instancia gratuita para producción. Si el equipo pasa a depender de Kanbio, el primer upgrade recomendado es una API siempre encendida con base de datos respaldada.
