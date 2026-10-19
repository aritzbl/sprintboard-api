# Deploy en una VM de AWS (EC2)

Todo corre en **una sola instancia**: Caddy (HTTPS), la API, la web y Postgres en contenedores, en un
dominio propio detrás de Cloudflare. Es el mismo esquema que tublood y Oxavita. CI construye las dos
imágenes y las publica en GitHub Container Registry; el deploy es manual y es un solo comando en la VM
(`deploy/deploy.sh`), que hace `pull`, `migrate` y `up`. La VM no tiene los repositorios: solo Docker, un
`.env` y los archivos de `deploy/`.

```
push a main ──> GitHub Actions ──build arm64──> ghcr.io/aritzbl/sprintboard-api:{latest, <sha>, vX.Y.Z}
                                           └──> ghcr.io/aritzbl/sprintboard-web:{latest, <sha>, vX.Y.Z}

vos ──ssh──> EC2: ./deploy/deploy.sh   (pull · migrate · up -d)

internet ──443──> Cloudflare ──> caddy ─┬─ /api/* ──> api:4000 ──> postgres (volumen pg-data)
                                 (TLS)  └─ resto  ──> web:3000
navegador ──PUT/GET firmados──> S3 (evidencias y fotos; la API firma con el rol IAM de la instancia)
```

| Archivo | Para qué |
|---|---|
| `.github/workflows/ci.yml` (en los dos repos) | typecheck + build; en PRs builda la imagen; en `main`/tags publica en ghcr |
| `compose.prod.yml` | el stack en la VM |
| `.env.prod.example` | referencia del `.env` de la VM |
| `deploy/Caddyfile` | HTTPS por DNS-01 detrás de Cloudflare; `/api/*` a la API y el resto a la web |
| `deploy/setup-server.sh` | prepara la VM una vez: Docker, swap, carpeta, servicio de DNS |
| `deploy/deploy.sh` | pull + migrate + up; también rollback |
| `deploy/backup.sh` | `pg_dump` local y opcional a S3 |
| `deploy/update-dns.sh` + `.service` | en cada arranque apunta el registro A de Cloudflare a la IP pública nueva |
| `scripts/migrate.sh` (en la imagen de la API) | crea el esquema en una base vacía o aplica las `migrations/*.sql` pendientes |

## 1. AWS

### Bucket S3 (evidencias y fotos de perfil)

Las evidencias son privadas (la API firma una URL de lectura en cada respuesta); solo
`prod/avatars/*` es público. El navegador sube directo al bucket con URLs prefirmadas.

1. Crear el bucket (por ejemplo `kanbio-files`) en **la misma región que la instancia**.
2. **Block Public Access**: dejar bloqueados los ACL y desactivar solo las dos opciones de *bucket policies*.
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
4. **CORS**, para el PUT del navegador (`SITE_ADDRESS` es el dominio de la app):
   ```json
   [{
     "AllowedOrigins": ["https://kanbio.tudominio.com"],
     "AllowedMethods": ["PUT", "GET"],
     "AllowedHeaders": ["content-type"],
     "MaxAgeSeconds": 3600
   }]
   ```
5. `S3_PUBLIC_BASE_URL=https://kanbio-files.s3.<región>.amazonaws.com` (o un CloudFront delante).

### Rol IAM de la instancia (sin claves en la VM)

Crear un rol para EC2 y asignárselo a la instancia (*Actions → Security → Modify IAM role*). La API y
`backup.sh` toman las credenciales de ahí:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
    "Resource": ["arn:aws:s3:::kanbio-files/prod/*", "arn:aws:s3:::kanbio-files/backups/*"]
  }]
}
```

Si más adelante el mail sale por SES (`EMAIL_PROVIDER=ses`), sumar `ses:SendEmail` al mismo rol.

### Instancia

*Launch instance*:

- AMI: Amazon Linux 2023, **arm64** (las imágenes se publican para arm64).
- Tipo: **`t4g.small`** (2 GB: API, web y Postgres con margen). `t4g.micro` (1 GB) entra con el swap
  de 2 GB de `setup-server.sh`, pero justo.
- Disco: 20 GB gp3.
- Security group: entrada en **22** (solo tu IP), **80** y **443**.
- *Advanced details*: el rol IAM de arriba; **Metadata version: V2 only** y **Metadata response hop
  limit: 2**. Con el hop limit en 1 (el default) los contenedores no llegan a las credenciales del rol y
  S3 falla. En una instancia ya creada:
  ```bash
  aws ec2 modify-instance-metadata-options --instance-id <id> --http-tokens required --http-put-response-hop-limit 2
  ```
- *User data*: el contenido de `deploy/setup-server.sh` (o correrlo a mano en el paso 3).

**Sin Elastic IP**: la IP pública automática cambia en cada stop/start, pero no cuesta nada con la
instancia apagada; `deploy/update-dns.sh` corrige el registro A en cada arranque.

## 2. Cloudflare

1. My Profile → **API Tokens** → Create Token → plantilla **Edit zone DNS**; en Permissions sumar
   `Zone` / `Zone` / `Read` (sin esto Caddy falla con `expected 1 zone, got 0`); Zone Resources: solo tu
   dominio. El token va en `CF_API_TOKEN`; lo usan Caddy (certificado por DNS-01) y `update-dns.sh`.
2. El **Zone ID** está en el dominio → Overview → `CF_ZONE_ID`.
3. **SSL/TLS → Overview → Full (strict)**. Con *Flexible* hay un redirect loop.

El registro A no hace falta crearlo a mano: el primer arranque lo crea, *proxied* (la IP de la
instancia no se publica).

## 3. Preparar la VM (una vez)

Si no se usó user data:

```bash
ssh -i clave.pem ec2-user@IP
curl -fsSL <raw url de deploy/setup-server.sh> | sudo bash
exit                                  # volver a entrar para que aplique el grupo docker
```

Desde este repositorio:

```bash
scp -i clave.pem compose.prod.yml ec2-user@IP:/home/ec2-user/
scp -i clave.pem deploy/*.sh deploy/Caddyfile deploy/update-dns.service ec2-user@IP:/home/ec2-user/deploy/
```

Crear `/home/ec2-user/.env` a partir de `.env.prod.example` (dominio, Cloudflare, Postgres, Firebase
Admin, S3, mail) y volver a correr el setup para que instale el servicio de DNS:

```bash
sudo bash /home/ec2-user/deploy/setup-server.sh
sudo systemctl start kanbio-dns && systemctl status kanbio-dns
```

### GitHub

- **Firebase web**: en `sprintboard-web` → Settings → Secrets and variables → Actions → **Variables**,
  las seis `NEXT_PUBLIC_FIREBASE_*` con los valores de `.env.local`. Son públicas (terminan en el bundle).
- **Acceso a ghcr.io**: si los repos son privados, los paquetes también. En la VM, una vez:
  `docker login ghcr.io -u <usuario>` con un PAT classic con scope `read:packages`.
- **Firebase Authentication → Authorized domains**: agregar el dominio. Sin esto no anda el login.

## 4. Migrar los datos de Neon (una vez)

Los usuarios viven en Firebase; en Postgres están proyectos, tickets, miembros, etc.

1. Versión de Neon: `psql "$NEON_URL" -c "SHOW server_version"`. Poner ese mayor en `POSTGRES_VERSION`
   del `.env` de la VM (por defecto 17) **antes** del primer `up`.
2. Dump desde tu máquina, con el `pg_dump` de esa misma versión:
   ```bash
   docker run --rm postgres:17-alpine pg_dump "$NEON_URL" --no-owner --no-acl -Fc > kanbio.dump
   scp -i clave.pem kanbio.dump ec2-user@IP:/home/ec2-user/
   ```
3. En la VM, restaurar en el Postgres del stack y desplegar:
   ```bash
   docker compose -f compose.prod.yml up -d --wait postgres
   docker compose -f compose.prod.yml exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl' < kanbio.dump
   ./deploy/deploy.sh
   ```
   El primer `migrate` re-aplica las migraciones (todas son idempotentes) y las deja registradas.

Sin dump, el primer deploy sobre la base vacía crea el esquema desde las entidades.

## 5. Deploy

```bash
git push origin main     # CI publica las dos imágenes (en cada repo)
ssh -i clave.pem ec2-user@IP '/home/ec2-user/deploy/deploy.sh'
curl -s https://kanbio.tudominio.com/api/health
```

`deploy.sh` baja las imágenes de `.env` (`IMAGE_API`, `IMAGE_WEB`), corre `migrate`, reinicia `api` y
`web` esperando su healthcheck y después Caddy. Si la migración falla, la API anterior sigue sirviendo.
Un tag (`git tag v0.1.0 && git push --tags`) publica además `:v0.1.0`; desplegar por tag es más fácil de
rastrear. Si cambió `compose.prod.yml`, el `Caddyfile` o algún script de `deploy/`, volver a copiarlo
con `scp` antes del deploy (desde Windows, `scp` no conserva el permiso de ejecución: `chmod +x
deploy/*.sh` en la VM, o volver a correr `setup-server.sh`).

### Cambios de esquema

Cada cambio de tablas va en un `migrations/NNN_descripcion.sql` nuevo, **idempotente** (`IF NOT EXISTS`).
El `migrate` del deploy aplica los pendientes en orden, cada uno en su transacción, y los registra en
`schema_migrations`. En producción `DB_SYNCHRONIZE` siempre es `false` (lo fija `compose.prod.yml`).

## 6. Operación

Todo desde `/home/ec2-user`, con `docker compose -f compose.prod.yml …` (abajo, `dc`):

| Qué | Cómo |
|---|---|
| logs | `dc logs -f api` / `dc logs -f web` / `dc logs -f caddy` |
| estado | `dc ps` |
| consola de Postgres | `dc exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` |
| rollback | `./deploy/deploy.sh IMAGE_API=ghcr.io/aritzbl/sprintboard-api:<sha>` (ídem `IMAGE_WEB`) |
| backup | `./deploy/backup.sh`; cron diario y restore comentados en el archivo (`BACKUP_S3_URI` sube a S3) |
| mails de prueba | con `IS_EMAIL_MOCKED=true`: `ssh -L 8026:localhost:8025 ec2-user@IP` → http://localhost:8026 |
| admin de la base | `dc --profile tools up -d adminer` + `ssh -L 8080:localhost:8080 ec2-user@IP` |
