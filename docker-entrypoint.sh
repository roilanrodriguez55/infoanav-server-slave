#!/bin/sh
set -e

export LANG="${LANG:-C.UTF-8}"
export LC_ALL="${LC_ALL:-C.UTF-8}"
export PGCLIENTENCODING="${PGCLIENTENCODING:-UTF8}"

# Script de entrypoint para el contenedor de la app
# Soporta restauración dinámica: infoanav-backup-{timestamp}.sql (elige el timestamp más reciente)
# (puede ser SQL plano o pg_dump -Fc; la extensión .sql no implica formato texto)
# SETUP_DATABASE_ROLES: auto (default) = no sobrescribir si ya existen anon, usuario_comun, administrador
#                       always = aplicar siempre la plantilla de permisos del script
#                       never = no tocar roles

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Infoanav Server - Docker Entrypoint"
echo "=========================================="

# Función para loggear con timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Strip CRLF (Windows editors) before piping SQL to psql
psql_run_file() {
    local host="$1" user="$2" db="$3" pass="$4" sql_file="$5"
    sed 's/\r$//' "$sql_file" | PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -v ON_ERROR_STOP=1
}

# database-expectations.json: validate JSON, ensure roles before restore, verify grants after setup
db_expectations_enabled() {
    case "${DB_EXPECTATIONS_MODE:-full}" in
        skip|off|false|0) return 1 ;;
    esac
    [ -f "${DB_EXPECTATIONS_FILE:-database-expectations.json}" ]
}

run_db_expectations() {
    local exp_file="${DB_EXPECTATIONS_FILE:-database-expectations.json}"
    export DB_EXPECTATIONS_FILE="$exp_file"
    case "$1" in
        validate)
            log "${YELLOW}Validando ${exp_file}...${NC}"
            node scripts/verify-db-expectations.cjs validate
            ;;
        ensure-roles)
            log "${YELLOW}Roles definidos en JSON: comprobar / crear antes de restaurar...${NC}"
            node scripts/verify-db-expectations.cjs ensure-roles
            ;;
        verify-grants)
            log "${YELLOW}Comprobando permisos frente a ${exp_file}...${NC}"
            if ! node scripts/verify-db-expectations.cjs verify-grants; then
                if [ "${DB_EXPECTATIONS_STRICT:-0}" = "1" ]; then
                    log "${RED}DB_EXPECTATIONS_STRICT=1: permisos no coinciden con el JSON${NC}"
                    exit 1
                fi
                log "${YELLOW}Aviso: hay diferencias con el JSON (no estricto; el contenedor continúa).${NC}"
            fi
            ;;
    esac
}

# Find backup matching infoanav-backup-*.sql (cwd or backups/ for bind mounts)
# Latest backup by embedded timestamp (numeric sort; use fixed-width e.g. YYYYMMDDHHmm)
find_backup_file() {
    local picked d f base ts
    picked=$(
        for d in . backups; do
            [ -d "$d" ] || continue
            for f in "$d"/infoanav-backup-*.sql; do
                [ -f "$f" ] || continue
                base=$(basename "$f")
                ts=${base#infoanav-backup-}
                ts=${ts%.sql}
                printf '%s|%s\n' "$ts" "$f"
            done
        done | LC_ALL=C sort -t'|' -k1,1n | tail -n 1
    )
    [ -n "$picked" ] || { echo ""; return 0; }
    echo "$picked" | cut -d'|' -f2-
}

# Esperar a que PostgreSQL esté disponible
wait_for_postgres() {
    log "${YELLOW}Esperando a que PostgreSQL esté disponible...${NC}"
    
    local host="${DB_HOST:-db}"
    local port="${DB_PORT:-5432}"
    local user="${DB_USER:-postgres}"
    local db="${DB_NAME:-infoanav}"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "$host" -p "$port" -U "$user" -d "$db" >/dev/null 2>&1; then
            log "${GREEN}PostgreSQL está listo${NC}"
            return 0
        fi
        
        log "Intento $attempt/$max_attempts - PostgreSQL no está listo, esperando..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "${RED}Error: PostgreSQL no respondió después de $max_attempts intentos${NC}"
    return 1
}

wait_for_postgrest() {
    local base="${POSTGREST_URL:-http://postgrest:3000}"
    local url="${base%/}/"
    local max_attempts=30
    local attempt=1

    log "${YELLOW}Esperando a que PostgREST esté disponible...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if wget -q --spider "$url" 2>/dev/null; then
            log "${GREEN}PostgREST está listo${NC}"
            return 0
        fi
        log "Intento $attempt/$max_attempts - PostgREST no está listo, esperando..."
        sleep 2
        attempt=$((attempt + 1))
    done

    log "${RED}Error: PostgREST no respondió después de $max_attempts intentos${NC}"
    return 1
}

# Verificar si la base de datos está vacía (no tiene tablas en el esquema api)
is_db_empty() {
    local host="${DB_HOST:-db}"
    local user="${DB_USER:-postgres}"
    local db="${DB_NAME:-infoanav}"
    local pass="${DB_PASSWORD:-admin}"
    
    # Verificar si existe al menos una tabla en el esquema 'api'
    local table_count
    table_count=$(PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -t -c "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'api' AND table_type = 'BASE TABLE';
    " | xargs)
    
    if [ "$table_count" = "0" ] || [ -z "$table_count" ]; then
        return 0  # Está vacía
    else
        return 1  # Tiene datos
    fi
}

# Detectar tipo de archivo de backup
detect_backup_type() {
    local backup_file="$1"
    
    # Check if it's a PostgreSQL custom dump
    if file "$backup_file" 2>/dev/null | grep -q "PostgreSQL custom database dump"; then
        echo "custom"
    else
        echo "sql"
    fi
}

# Restaurar backup
restore_backup() {
    local backup_file="$1"
    local host="${DB_HOST:-db}"
    local user="${DB_USER:-postgres}"
    local db="${DB_NAME:-infoanav}"
    local pass="${DB_PASSWORD:-admin}"
    
    log "${YELLOW}Restaurando backup desde: $backup_file${NC}"
    
    if [ ! -f "$backup_file" ]; then
        log "${RED}Error: Archivo de backup no encontrado: $backup_file${NC}"
        return 1
    fi
    
    # Detectar tipo de backup
    local backup_type
    backup_type=$(detect_backup_type "$backup_file")
    
    if [ "$backup_type" = "custom" ]; then
        log "${YELLOW}Detectado PostgreSQL custom dump. Usando pg_restore...${NC}"
        if PGPASSWORD="$pass" pg_restore -h "$host" -U "$user" -d "$db" -v "$backup_file"; then
            log "${GREEN}Backup custom restaurado exitosamente${NC}"
            return 0
        else
            log "${YELLOW}pg_restore devolvió código distinto de cero; comprobando contenido...${NC}"
            if ! is_db_empty; then
                log "${GREEN}Backup restaurado (verificado por tablas en schema api)${NC}"
                return 0
            fi
            log "${RED}Error al restaurar el backup custom${NC}"
            return 1
        fi
    else
        log "${YELLOW}Detectado archivo SQL plano. Usando psql...${NC}"
        if psql_run_file "$host" "$user" "$db" "$pass" "$backup_file"; then
            log "${GREEN}Backup SQL restaurado exitosamente${NC}"
            return 0
        else
            log "${RED}Error al restaurar el backup SQL${NC}"
            return 1
        fi
    fi
}

# After restore: extensions, deleted_at, RLS policies, drop api wrappers (scripts/sql/post-restore.sql)
apply_post_restore_sql() {
    case "${POST_RESTORE_PATCH:-auto}" in
        skip|off|false|0) return 0 ;;
    esac
    local host="${DB_HOST:-db}"
    local user="${DB_USER:-postgres}"
    local db="${DB_NAME:-infoanav}"
    local pass="${DB_PASSWORD:-admin}"
    local script_dir patch_sql
    script_dir="$(cd "$(dirname "$0")" && pwd)"
    patch_sql="${POST_RESTORE_SQL:-$script_dir/scripts/sql/post-restore.sql}"

    log "${YELLOW}Aplicando parche post-restore (SQL)...${NC}"
    if [ ! -f "$patch_sql" ]; then
        log "${RED}No se encontró $patch_sql${NC}"
        exit 1
    fi
    if ! psql_run_file "$host" "$user" "$db" "$pass" "$patch_sql"; then
        log "${RED}Error en post-restore.sql${NC}"
        exit 1
    fi
    log "${GREEN}Parche post-restore aplicado${NC}"
}

# Align auth.login() JWT fallback with jwt-secret in PostgREST config (node scripts/db.cjs sync-jwt)
sync_auth_login_jwt_from_conf() {
    case "${SYNC_JWT_FROM_CONF:-auto}" in
        skip|off|false|0) return 0 ;;
    esac
    local conf="${POSTGREST_CONF:-/app/postgrest-docker.conf}"
    if [ ! -f "$conf" ]; then
        log "${YELLOW}POSTGREST_CONF not found ($conf); skipping JWT sync${NC}"
        return 0
    fi
    log "${YELLOW}Sincronizando fallback JWT de auth.login desde ${conf}...${NC}"
    if node scripts/db.cjs sync-jwt "$conf"; then
        log "${GREEN}auth.login alineado con jwt-secret del fichero PostgREST${NC}"
    else
        log "${YELLOW}No se pudo sincronizar auth.login (¿sin esquema auth aún?). Continuando.${NC}"
        if [ "${SYNC_JWT_STRICT:-0}" = "1" ]; then
            exit 1
        fi
    fi
}

# Función principal de restauración
handle_restore() {
    local backup_file
    backup_file=$(find_backup_file)
    
    if [ -z "$backup_file" ]; then
        log "${YELLOW}No se encontró ningún archivo de backup (patrón: infoanav-backup-*.sql)${NC}"
        return 0
    fi
    
    log "${GREEN}Backup seleccionado (mayor timestamp en nombre): $backup_file${NC}"
    
    # Verificar variable de entorno RESTORE_BACKUP
    case "${RESTORE_BACKUP:-}" in
        "auto")
            # Restaurar solo si la base de datos está vacía
            if is_db_empty; then
                log "${YELLOW}Base de datos vacía. Restaurando automáticamente...${NC}"
                restore_backup "$backup_file"
            else
                log "${GREEN}Base de datos ya contiene datos. Omitiendo restauración.${NC}"
            fi
            ;;
        "force")
            # Forzar restauración
            log "${YELLOW}Forzando restauración del backup...${NC}"
            restore_backup "$backup_file"
            ;;
        "yes"|"true"|"1")
            # Igual que auto
            if is_db_empty; then
                log "${YELLOW}Restaurando backup...${NC}"
                restore_backup "$backup_file"
            else
                log "${GREEN}Base de datos ya contiene datos. Omitiendo restauración.${NC}"
            fi
            ;;
        "skip"|"no"|"false"|"0")
            log "${YELLOW}Restauración omitida por configuración (RESTORE_BACKUP=$RESTORE_BACKUP)${NC}"
            ;;
        *)
            # Por defecto: auto
            if is_db_empty; then
                log "${YELLOW}Base de datos vacía. Restaurando automáticamente...${NC}"
                log "${YELLOW}(Puedes controlar esto con RESTORE_BACKUP=auto|force|skip)${NC}"
                restore_backup "$backup_file"
            else
                log "${GREEN}Base de datos ya contiene datos. Omitiendo restauración.${NC}"
            fi
            ;;
    esac
}

# Verificar y crear roles de base de datos (requeridos por PostgREST)
# Roles según requisitos:
#   - anon: Solo puede ejecutar función login en schema api
#   - usuario_comun: CRUD completo en todas las tablas del schema api
#   - administrador: Permisos amplios para todo
setup_database_roles() {
    local host="${DB_HOST:-db}"
    local user="${DB_USER:-postgres}"
    local db="${DB_NAME:-infoanav}"
    local pass="${DB_PASSWORD:-admin}"
    
    log "${YELLOW}Configurando roles de base de datos...${NC}"
    
    # Función auxiliar para verificar si un rol existe
    role_exists() {
        local role_name="$1"
        local exists
        exists=$(PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -t -c "
            SELECT COUNT(*) FROM pg_roles WHERE rolname = '$role_name';
        " | xargs)
        echo "$exists"
    }
    
    # 1. Rol anon — USAGE en api/auth y EXECUTE solo en auth.login (sin wrappers en api)
    log "${YELLOW}Verificando rol 'anon'...${NC}"
    if [ "$(role_exists 'anon')" = "0" ] || [ -z "$(role_exists 'anon')" ]; then
        log "${YELLOW}Creando rol 'anon'...${NC}"
        PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -c "CREATE ROLE anon NOLOGIN;"
    fi
    
    log "${YELLOW}Configurando permisos para 'anon'...${NC}"
    PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -c "
        GRANT USAGE ON SCHEMA api TO anon;
        GRANT USAGE ON SCHEMA auth TO anon;
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA api FROM anon;
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth FROM anon;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA api FROM anon;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth FROM anon;
        DO \$\$
        BEGIN
            IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE p.proname = 'login' AND n.nspname = 'auth') THEN
                EXECUTE 'GRANT EXECUTE ON FUNCTION auth.login(text, text) TO anon';
            END IF;
        END \$\$;
    "
    log "${GREEN}Rol 'anon' configurado (EXECUTE auth.login)${NC}"
    
    # 2. Rol usuario_comun - CRUD completo en todas las tablas del schema api
    log "${YELLOW}Verificando rol 'usuario_comun'...${NC}"
    if [ "$(role_exists 'usuario_comun')" = "0" ] || [ -z "$(role_exists 'usuario_comun')" ]; then
        log "${YELLOW}Creando rol 'usuario_comun'...${NC}"
        PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -c "CREATE ROLE usuario_comun NOLOGIN;"
    fi
    
    log "${YELLOW}Configurando permisos para 'usuario_comun'...${NC}"
    PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -c "
        -- Permisos en schema api
        GRANT USAGE ON SCHEMA api TO usuario_comun;
        -- CRUD completo en tablas de api
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA api TO usuario_comun;
        -- Permisos en secuencias para inserts
        GRANT USAGE ON ALL SEQUENCES IN SCHEMA api TO usuario_comun;
        -- Permisos por defecto para futuras tablas
        ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO usuario_comun;
        ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT USAGE ON SEQUENCES TO usuario_comun;
        -- Solo lectura en schema auth
        GRANT USAGE ON SCHEMA auth TO usuario_comun;
        GRANT SELECT ON ALL TABLES IN SCHEMA auth TO usuario_comun;
        ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT ON TABLES TO usuario_comun;
    "
    log "${GREEN}Rol 'usuario_comun' configurado (permisos: CRUD en api, SELECT en auth)${NC}"
    
    # 3. Rol administrador - Permisos amplios para todo
    log "${YELLOW}Verificando rol 'administrador'...${NC}"
    if [ "$(role_exists 'administrador')" = "0" ] || [ -z "$(role_exists 'administrador')" ]; then
        log "${YELLOW}Creando rol 'administrador'...${NC}"
        PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -c "CREATE ROLE administrador NOLOGIN;"
    fi
    
    log "${YELLOW}Configurando permisos para 'administrador'...${NC}"
    PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -c "
        -- Permisos completos en ambos schemas
        GRANT USAGE ON SCHEMA api TO administrador;
        GRANT USAGE ON SCHEMA auth TO administrador;
        -- Todos los privilegios en tablas
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA api TO administrador;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO administrador;
        -- Todos los privilegios en secuencias
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA api TO administrador;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO administrador;
        -- Todos los privilegios en funciones
        GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA api TO administrador;
        GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO administrador;
        -- Permisos por defecto para futuros objetos
        ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON TABLES TO administrador;
        ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON TABLES TO administrador;
        ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON SEQUENCES TO administrador;
        ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON SEQUENCES TO administrador;
        ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON FUNCTIONS TO administrador;
        ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT ALL ON FUNCTIONS TO administrador;
    "
    log "${GREEN}Rol 'administrador' configurado (permisos: ALL)${NC}"
    
    log "${GREEN}Todos los roles configurados exitosamente${NC}"
}

# True if all three PostgREST roles from dump / prior setup exist (keeps backup GRANTs when SETUP_DATABASE_ROLES=auto)
all_postgrest_roles_exist() {
    local host="${DB_HOST:-db}"
    local user="${DB_USER:-postgres}"
    local db="${DB_NAME:-infoanav}"
    local pass="${DB_PASSWORD:-admin}"
    local cnt
    cnt=$(PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" -t -A -c "
        SELECT COUNT(*)::text FROM pg_roles WHERE rolname IN ('anon','usuario_comun','administrador');
    " | tr -d '[:space:]')
    [ "$cnt" = "3" ]
}

setup_database_roles_if_needed() {
    case "${SETUP_DATABASE_ROLES:-auto}" in
        never|false|0)
            log "${YELLOW}SETUP_DATABASE_ROLES=never — omitiendo configuración de roles${NC}"
            ;;
        always|force|true|1)
            log "${YELLOW}SETUP_DATABASE_ROLES=always — aplicando plantilla de permisos${NC}"
            setup_database_roles
            ;;
        auto|"")
            if all_postgrest_roles_exist; then
                log "${GREEN}Roles PostgREST presentes (auto); se conservan permisos del backup o instalación previa.${NC}"
            else
                log "${YELLOW}Faltan roles PostgREST; aplicando plantilla de permisos...${NC}"
                setup_database_roles
            fi
            ;;
        *)
            log "${YELLOW}SETUP_DATABASE_ROLES desconocido (${SETUP_DATABASE_ROLES}); usando auto${NC}"
            if all_postgrest_roles_exist; then
                log "${GREEN}Roles PostgREST presentes; omitiendo setup.${NC}"
            else
                setup_database_roles
            fi
            ;;
    esac
}

# Main execution
main() {
    wait_for_postgres

    if db_expectations_enabled; then
        run_db_expectations validate
        run_db_expectations ensure-roles
    fi
    
    # Manejar restauración
    handle_restore

    apply_post_restore_sql

    sync_auth_login_jwt_from_conf

    # PostgREST roles: auto = do not overwrite ACL if roles already exist (matches pg_dump ACL)
    setup_database_roles_if_needed

    if db_expectations_enabled; then
        run_db_expectations verify-grants
    fi

    wait_for_postgrest

    log "${GREEN}Iniciando aplicación...${NC}"
    echo "=========================================="
    
    # Ejecutar el comando proporcionado (o npm start por defecto)
    exec "${@:-npm start}"
}

# Run main
main "$@"
