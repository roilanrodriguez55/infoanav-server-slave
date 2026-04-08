# Imagen base de Node.js
FROM node:20-alpine

# Instalar PostgREST desde la imagen oficial, cliente PostgreSQL y herramientas necesarias
# Keep in sync with docker-compose.yml service postgrest image tag
COPY --from=postgrest/postgrest:v14.7 /bin/postgrest /usr/local/bin/postgrest
RUN apk add --no-cache postgresql17-client file

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar archivos del proyecto
COPY . .

# Hacer el entrypoint ejecutable
RUN chmod +x docker-entrypoint.sh

# Puerto expuesto
EXPOSE 8080

# Entrypoint y comando por defecto
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
