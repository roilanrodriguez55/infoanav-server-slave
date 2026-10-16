# Imagen solo para desarrollo y demos. En produccion no se usa Docker.
FROM node:24-bookworm-slim

# ca-certificates y openssl: Prisma los necesita para aplicar migraciones
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma/ ./prisma/
COPY prisma.config.ts tsconfig.json ./
COPY src/ ./src/

# Binario de PostgREST tomado de la imagen oficial (se ejecuta como proceso hijo del gateway)
COPY --from=postgrest/postgrest:v14.7 /bin/postgrest /app/bin/postgrest

RUN chmod 0755 /app/bin/postgrest \
    && chown -R node:node /app

ENV NODE_ENV=production \
    POSTGREST_BIN=/app/bin/postgrest \
    PORT=8080

USER node

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=6 \
    CMD node -e "fetch('http://127.0.0.1:8080/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/start.ts"]
