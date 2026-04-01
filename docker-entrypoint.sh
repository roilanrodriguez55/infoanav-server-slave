#!/bin/sh
set -e

# Script de entrypoint para el contenedor de la app
# Soporta restauración dinámica de backups con patrón infoanav-backup-*.sql

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

# Buscar archivo de backup que coincida con el patrón infoanav-backup-*.sql
find_backup_file() {
    local backup_file
    backup_file=$(ls -1 infoanav-backup-*.sql 2>/dev/null | head -n 1)
    echo "$backup_file"
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
    " 2>/dev/null | xargs)
    
    if [ "$table_count" = "0" ] || [ -z "$table_count" ]; then
        return 0  # Está vacía
    else
        return 1  # Tiene datos
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
    
    # Restaurar el backup
    if PGPASSWORD="$pass" psql -h "$host" -U "$user" -d "$db" < "$backup_file" 2>/dev/null; then
        log "${GREEN}Backup restaurado exitosamente${NC}"
        return 0
    else
        log "${RED}Error al restaurar el backup${NC}"
        return 1
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
    
    log "${GREEN}Archivo de backup encontrado: $backup_file${NC}"
    
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

# Main execution
main() {
    # Esperar a PostgreSQL
    wait_for_postgres
    
    # Manejar restauración
    handle_restore
    
    log "${GREEN}Iniciando aplicación...${NC}"
    echo "=========================================="
    
    # Ejecutar el comando proporcionado (o npm start por defecto)
    exec "${@:-npm start}"
}

# Run main
main "$@"
