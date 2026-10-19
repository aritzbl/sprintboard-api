# Production image of the API. CI publishes it to ghcr.io
# (.github/workflows/ci.yml, job publish) and compose.prod.yml runs it on the
# VM. The same image runs the deploy `migrate` job (scripts/migrate.sh), so the
# SQL migrations travel inside it.
#
# Dependencies come from package-lock.json (`npm ci`): two builds of the same
# revision get exactly the same versions, and the dependency layer is only
# rebuilt when the lock changes.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN npm run build


FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# psql, for scripts/migrate.sh.
RUN apk add --no-cache postgresql-client

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY migrations/ ./migrations/
COPY scripts/migrate.sh ./scripts/migrate.sh

USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
