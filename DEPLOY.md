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

### Cambios de esquema posteriores

Con `DB_SYNCHRONIZE=false`, ejecutar primero los SQL versionados en la carpeta `migrations/` desde el editor SQL de Neon y recién después desplegar la API. Por ejemplo, el borrado lógico requiere ejecutar `migrations/002_soft_delete.sql` una sola vez.

## 3. Web en Vercel

1. Importar el repositorio `sprintboard-web` en Vercel (rama `main`).
2. Definir las variables de entorno de producción:
   - `NEXT_PUBLIC_API_URL=https://<tu-servicio>.onrender.com/api`
   - Las cinco variables públicas de Firebase ya presentes en `.env.local`.
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_EVIDENCE_PRESET` y `NEXT_PUBLIC_CLOUDINARY_PROFILE_PRESET`.
3. Publicar y copiar la URL `https://<tu-app>.vercel.app`.
4. Volver a Render y asignar esa URL exacta a `CORS_ORIGIN`.
5. En Firebase Authentication, agregar el dominio de Vercel a **Authorized domains**. Sin este paso no funcionarán el login ni el registro en producción.

## Verificación

- Abrir `https://<api>.onrender.com/api/health` y comprobar que responde `status: ok`.
- Registrarse, crear un proyecto, una épica y una tarea.
- Crear y aceptar una invitación desde una sesión distinta.

> Este setup es adecuado para una beta interna sin presupuesto. Vercel Hobby es para uso personal/no comercial y Render no recomienda su instancia gratuita para producción. Si el equipo pasa a depender de Kanbio, el primer upgrade recomendado es una API siempre encendida con base de datos respaldada.
