-- Migracion: equipamiento_plantas
-- Catalogo de modelos de equipo, equipos con su historial de ubicaciones, vista v_equipos,
-- vinculo equipamientos_senal -> equipos, indicador fuera_servicio en ubicaciones_medio
-- y grupos electrogenos (plantas) con sus fallas.

-- ubicaciones_medio: indicador de fuera de servicio
ALTER TABLE api.ubicaciones_medio ADD COLUMN IF NOT EXISTS fuera_servicio boolean NOT NULL DEFAULT true;

UPDATE api.ubicaciones_medio
SET fuera_servicio = false
WHERE fuera_servicio = true
  AND lower(nombre) IN ('en servicio', 'inicio del serv.');

-- modelos_equipo: catalogo de modelos por tipo de equipamiento
CREATE TABLE IF NOT EXISTS api.modelos_equipo (
  id_modelo_equipo uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  id_tipo_equipamiento uuid NOT NULL REFERENCES api.tipos_equipamiento (id_tipo_equipamiento),
  nombre varchar(150) NOT NULL,
  pais varchar(100),
  voltaje numeric(8,2),
  vatios numeric(8,2),
  consumo varchar(50),
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_modelos_equipo_id_tipo_equipamiento ON api.modelos_equipo (id_tipo_equipamiento);
CREATE UNIQUE INDEX IF NOT EXISTS uq_modelos_equipo_tipo_nombre ON api.modelos_equipo (id_tipo_equipamiento, lower(nombre)) WHERE deleted_at IS NULL;

-- equipos: unidad fisica de equipamiento
CREATE TABLE IF NOT EXISTS api.equipos (
  id_equipo uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  id_tipo_equipamiento uuid NOT NULL REFERENCES api.tipos_equipamiento (id_tipo_equipamiento),
  numero_inventario varchar(50) NOT NULL,
  id_modelo_equipo uuid REFERENCES api.modelos_equipo (id_modelo_equipo),
  id_empresa uuid REFERENCES api.empresas (id_empresa),
  fecha_inicio_servicio date,
  proveedor varchar(150),
  garantia varchar(100),
  vida_util_dias integer,
  id_senal_inicial uuid REFERENCES api.senales (id_senal),
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_equipos_id_tipo_equipamiento ON api.equipos (id_tipo_equipamiento);
CREATE INDEX IF NOT EXISTS idx_equipos_id_modelo_equipo ON api.equipos (id_modelo_equipo);
CREATE INDEX IF NOT EXISTS idx_equipos_id_empresa ON api.equipos (id_empresa);
CREATE INDEX IF NOT EXISTS idx_equipos_id_senal_inicial ON api.equipos (id_senal_inicial);
CREATE UNIQUE INDEX IF NOT EXISTS uq_equipos_tipo_inventario ON api.equipos (id_tipo_equipamiento, lower(numero_inventario)) WHERE deleted_at IS NULL;

-- equipo_ubicaciones: estancias del equipo en ubicaciones de medio
CREATE TABLE IF NOT EXISTS api.equipo_ubicaciones (
  id_equipo_ubicacion uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  id_equipo uuid NOT NULL REFERENCES api.equipos (id_equipo),
  id_ubicacion_medio uuid NOT NULL REFERENCES api.ubicaciones_medio (id_ubicacion_medio),
  id_senal uuid REFERENCES api.senales (id_senal),
  fecha_inicio timestamp without time zone NOT NULL DEFAULT now(),
  fecha_fin timestamp without time zone,
  causa text,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text,
  CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX IF NOT EXISTS idx_equipo_ubicaciones_id_equipo ON api.equipo_ubicaciones (id_equipo);
CREATE INDEX IF NOT EXISTS idx_equipo_ubicaciones_id_ubicacion_medio ON api.equipo_ubicaciones (id_ubicacion_medio);
CREATE INDEX IF NOT EXISTS idx_equipo_ubicaciones_id_senal ON api.equipo_ubicaciones (id_senal);
CREATE UNIQUE INDEX IF NOT EXISTS uq_equipo_ubicaciones_abierta ON api.equipo_ubicaciones (id_equipo) WHERE fecha_fin IS NULL AND deleted_at IS NULL;

-- equipamientos_senal: vinculo con el equipo fisico
ALTER TABLE api.equipamientos_senal ADD COLUMN IF NOT EXISTS id_equipo uuid REFERENCES api.equipos (id_equipo);
CREATE INDEX IF NOT EXISTS idx_equipamientos_senal_id_equipo ON api.equipamientos_senal (id_equipo);

-- v_equipos: una fila por equipo no borrado con su ubicacion actual (estancia abierta)
DROP VIEW IF EXISTS api.v_equipos;

CREATE VIEW api.v_equipos AS
SELECT
  e.*,
  te.nombre AS tipo_nombre,
  me.nombre AS modelo_nombre,
  em.nombre AS empresa_nombre,
  eu.id_ubicacion_medio,
  um.nombre AS ubicacion_nombre,
  eu.id_senal AS id_senal_actual,
  s.codigo_lsm,
  s.nombre AS senal_nombre,
  COALESCE(um.fuera_servicio, true) AS fuera_servicio,
  eu.fecha_inicio AS fecha_inicio_ubicacion,
  (e.fecha_inicio_servicio IS NOT NULL AND e.vida_util_dias IS NOT NULL
    AND e.fecha_inicio_servicio + e.vida_util_dias < current_date) AS vida_util_cumplida,
  CASE
    WHEN e.fecha_inicio_servicio IS NULL OR e.vida_util_dias IS NULL THEN NULL
    ELSE (e.fecha_inicio_servicio + e.vida_util_dias) - current_date
  END AS dias_vida_restantes
FROM api.equipos e
LEFT JOIN api.tipos_equipamiento te ON te.id_tipo_equipamiento = e.id_tipo_equipamiento
LEFT JOIN api.modelos_equipo me ON me.id_modelo_equipo = e.id_modelo_equipo
LEFT JOIN api.empresas em ON em.id_empresa = e.id_empresa
LEFT JOIN api.equipo_ubicaciones eu
  ON eu.id_equipo = e.id_equipo
  AND eu.fecha_fin IS NULL
  AND eu.deleted_at IS NULL
LEFT JOIN api.ubicaciones_medio um ON um.id_ubicacion_medio = eu.id_ubicacion_medio
LEFT JOIN api.senales s ON s.id_senal = eu.id_senal
WHERE e.deleted_at IS NULL;

-- plantas: grupos electrogenos
CREATE TABLE IF NOT EXISTS api.plantas (
  id_planta uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  marca varchar(100),
  modelo varchar(100),
  potencia varchar(50),
  numero varchar(50),
  id_senal uuid REFERENCES api.senales (id_senal),
  faro_texto varchar(150),
  inventario varchar(50),
  consumo varchar(50),
  voltaje varchar(50),
  frecuencia varchar(50),
  serie varchar(100),
  id_empresa uuid REFERENCES api.empresas (id_empresa),
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_plantas_id_senal ON api.plantas (id_senal);
CREATE INDEX IF NOT EXISTS idx_plantas_id_empresa ON api.plantas (id_empresa);

-- plantas_fallas: fallas de cada grupo electrogeno
CREATE TABLE IF NOT EXISTS api.plantas_fallas (
  id_planta_falla uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  id_planta uuid NOT NULL REFERENCES api.plantas (id_planta),
  fecha_fs timestamp without time zone,
  fecha_restablecimiento timestamp without time zone,
  causa text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_plantas_fallas_id_planta ON api.plantas_fallas (id_planta);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON api.modelos_equipo, api.equipos, api.equipo_ubicaciones, api.plantas, api.plantas_fallas TO api_service;
GRANT SELECT ON api.v_equipos TO api_service;

-- Auditoria y guarda de baja
DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.modelos_equipo;
CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.modelos_equipo FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields();
DROP TRIGGER IF EXISTS trg_prevent_delete_if_referenced ON api.modelos_equipo;
CREATE TRIGGER trg_prevent_delete_if_referenced BEFORE UPDATE ON api.modelos_equipo FOR EACH ROW EXECUTE FUNCTION api.prevent_delete_if_referenced();

DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.equipos;
CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.equipos FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields();
DROP TRIGGER IF EXISTS trg_log_changes ON api.equipos;
CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.equipos FOR EACH ROW EXECUTE FUNCTION api.log_changes('id_equipo');

DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.equipo_ubicaciones;
CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.equipo_ubicaciones FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields();
DROP TRIGGER IF EXISTS trg_log_changes ON api.equipo_ubicaciones;
CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.equipo_ubicaciones FOR EACH ROW EXECUTE FUNCTION api.log_changes('id_equipo_ubicacion');

DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.plantas;
CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.plantas FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields();
DROP TRIGGER IF EXISTS trg_log_changes ON api.plantas;
CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.plantas FOR EACH ROW EXECUTE FUNCTION api.log_changes('id_planta');

DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.plantas_fallas;
CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.plantas_fallas FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields();
DROP TRIGGER IF EXISTS trg_log_changes ON api.plantas_fallas;
CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.plantas_fallas FOR EACH ROW EXECUTE FUNCTION api.log_changes('id_planta_falla');

-- Recrear rl_soft_delete en todas las tablas api con deleted_at (las columnas cambiaron arriba)
DO $$
DECLARE
  tabla record;
  pk text;
BEGIN
  FOR tabla IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'api'
      AND c.column_name = 'deleted_at'
      AND t.table_type = 'BASE TABLE'
  LOOP
    SELECT a.attname INTO pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
    WHERE i.indrelid = format('api.%I', tabla.table_name)::regclass
      AND i.indisprimary;

    EXECUTE format('DROP RULE IF EXISTS rl_soft_delete ON api.%I', tabla.table_name);
    EXECUTE format(
      'CREATE RULE rl_soft_delete AS ON DELETE TO api.%1$I DO INSTEAD UPDATE api.%1$I SET deleted_at = now() WHERE %2$I = old.%2$I RETURNING *',
      tabla.table_name,
      pk
    );
  END LOOP;
END
$$;

NOTIFY pgrst, 'reload schema';
