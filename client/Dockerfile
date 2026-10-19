# Imagen solo para desarrollo y demos. En produccion no se usa Docker.
# Etapa build: genera el SPA estatico con Vite.
FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Base de la API vista desde el navegador (el proxy de nginx la sirve en /api)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npx vite build

# Etapa final: nginx sirve el SPA y hace proxy de /api hacia el gateway
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Solo se sustituye API_UPSTREAM en la plantilla (no las variables de nginx como $uri)
ENV API_UPSTREAM=http://api:8080 \
    NGINX_ENVSUBST_FILTER=API_UPSTREAM

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
