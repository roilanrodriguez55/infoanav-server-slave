-- Migracion: flota_personal
-- Buques (ficha, maquinas, plantas), alistamiento mensual con vista de acumulados,
-- personal y enlaces a buques desde mantenimientos y lmf.

CREATE TABLE IF NOT EXISTS api.buques (
  id_buque uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buque varchar(100) NOT NULL,
  proyecto varchar(100),
  id_empresa uuid REFERENCES api.empresas (id_empresa),
  propuesto_baja boolean NOT NULL DEFAULT false,
  nombre_buque varchar(150),
  numero_inventario varchar(50),
  ano_construccion integer,
  material_casco varchar(100),
  basificacion varchar(150),
  especialidad varchar(100),
  autonomia numeric(10,2),
  valor_inicial numeric(14,2),
  vida_economica numeric(10,2),
  lista varchar(50),
  tarifa_mn numeric(12,2),
  tarifa_mlc numeric(12,2),
  horas_trabajo numeric(12,2),
  desplazamiento numeric(10,2),
  velocidad numeric(8,2),
  folio varchar(50),
  color varchar(100),
  tripulantes integer,
  no_tripulantes integer,
  eslora numeric(8,2),
  manga numeric(8,2),
  calado numeric(8,2),
  puntal numeric(8,2),
  franco_borda numeric(8,2),
  capacidad_combustible numeric(10,2),
  capacidad_aceite numeric(10,2),
  capacidad_agua numeric(10,2),
  area_bodega numeric(10,2),
  tipo_propela varchar(100),
  cantidad_propelas integer,
  cantidad_motores integer,
  izaje_principal_mecanismo varchar(100),
  izaje_principal_largo_brazo numeric(8,2),
  izaje_principal_capacidad numeric(10,2),
  izaje_auxiliar_mecanismo varchar(100),
  izaje_auxiliar_largo_brazo numeric(8,2),
  izaje_auxiliar_capacidad numeric(10,2),
  area_navegacion varchar(50),
  numeral varchar(50),
  puerto_matricula varchar(100),
  registro varchar(100),
  arqueo_bruto numeric(10,2),
  arqueo_neto numeric(10,2),
  cert_navegabilidad_inspeccion date,
  cert_navegabilidad_expedicion date,
  cert_navegabilidad_vence date,
  cert_linea_carga_inspeccion date,
  cert_linea_carga_expedicion date,
  cert_linea_carga_vence date,
  cert_clase_inspeccion date,
  cert_clase_expedicion date,
  cert_clase_vence date,
  notacion_clase text,
  visado varchar(100),
  fecha_visado date,
  vigencia_visado date,
  lugar_visado varchar(150),
  condicionamientos text,
  equipo_hf varchar(100),
  equipo_vhf varchar(100),
  chalecos integer,
  aros integer,
  embarcacion_salvamento varchar(150),
  capacidad_embarcacion_salvamento integer,
  extintores_agua integer,
  extintores_co2 integer,
  extintores_espuma integer,
  extintores_polvo integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_buques_id_empresa ON api.buques (id_empresa);

CREATE TABLE IF NOT EXISTS api.buque_maquinas (
  id_buque_maquina uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_buque uuid NOT NULL REFERENCES api.buques (id_buque),
  tipo varchar(150),
  ano integer,
  serie varchar(100),
  ncc varchar(50),
  ncl varchar(50),
  potencia numeric(10,2),
  rpm integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_buque_maquinas_id_buque ON api.buque_maquinas (id_buque);

CREATE TABLE IF NOT EXISTS api.buque_plantas (
  id_buque_planta uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_buque uuid NOT NULL REFERENCES api.buques (id_buque),
  tipo varchar(150),
  ano integer,
  serie varchar(100),
  voltaje numeric(8,2),
  ncc varchar(50),
  ncl varchar(50),
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_buque_plantas_id_buque ON api.buque_plantas (id_buque);

CREATE TABLE IF NOT EXISTS api.alistamiento_buques (
  id_alistamiento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_buque uuid NOT NULL REFERENCES api.buques (id_buque),
  ano integer NOT NULL,
  mes smallint NOT NULL CHECK (mes BETWEEN 1 AND 12),
  id_tipo_alistamiento uuid REFERENCES api.tipos_alistamiento (id_tipo_alistamiento),
  descripcion text,
  observaciones text,
  fecha_fs date,
  fecha_alistamiento date,
  dias_mision_mes integer,
  dias_fs_mes integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_alistamiento_buques_buque_ano_mes ON api.alistamiento_buques (id_buque, ano, mes) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alistamiento_buques_id_tipo_alistamiento ON api.alistamiento_buques (id_tipo_alistamiento);

-- Vista de solo lectura: acumulados del año por buque y porcentaje de alistamiento (mes y acumulado).
-- Porcentaje = (dias de mision - dias F/S) / dias de mision * 100.
CREATE OR REPLACE VIEW api.v_alistamiento_buques AS
WITH base AS (
  SELECT
    a.*,
    b.buque,
    b.id_empresa,
    SUM(a.dias_mision_mes) OVER w AS dias_mision_acum,
    SUM(a.dias_fs_mes) OVER w AS dias_fs_acum
  FROM api.alistamiento_buques a
  JOIN api.buques b ON b.id_buque = a.id_buque
  WHERE a.deleted_at IS NULL
  WINDOW w AS (PARTITION BY a.id_buque, a.ano ORDER BY a.mes)
)
SELECT
  base.*,
  ROUND((dias_mision_mes - dias_fs_mes)::numeric / NULLIF(dias_mision_mes, 0) * 100, 2) AS pct_alistamiento_mes,
  ROUND((dias_mision_acum - dias_fs_acum)::numeric / NULLIF(dias_mision_acum, 0) * 100, 2) AS pct_alistamiento_acum
FROM base;

CREATE TABLE IF NOT EXISTS api.personal (
  id_persona uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_empresa uuid REFERENCES api.empresas (id_empresa),
  nombre varchar(100),
  primer_apellido varchar(100),
  segundo_apellido varchar(100),
  cargo varchar(150),
  radica_en varchar(150),
  telefono varchar(50),
  carne_identidad varchar(20),
  fecha_nacimiento date,
  salario numeric(12,2),
  escolaridad varchar(100),
  cargos_anteriores text,
  cursos_recibidos text,
  necesidad_cursos text,
  fecha_baja date,
  causa_baja text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_personal_id_empresa ON api.personal (id_empresa);

ALTER TABLE api.mantenimientos ADD COLUMN IF NOT EXISTS id_buque uuid REFERENCES api.buques (id_buque);
ALTER TABLE api.mantenimientos ADD COLUMN IF NOT EXISTS vehiculo varchar(150);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_id_buque ON api.mantenimientos (id_buque);

ALTER TABLE api.lmf ADD COLUMN IF NOT EXISTS id_buque_ejecutor uuid REFERENCES api.buques (id_buque);
CREATE INDEX IF NOT EXISTS idx_lmf_id_buque_ejecutor ON api.lmf (id_buque_ejecutor);

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON api.buques, api.buque_maquinas, api.buque_plantas, api.alistamiento_buques, api.personal TO api_service;
GRANT SELECT ON api.v_alistamiento_buques TO api_service;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON api.v_alistamiento_buques FROM api_service;

DO $$
DECLARE
  _tabla text;
  _pk text;
BEGIN
  FOR _tabla, _pk IN
    SELECT * FROM (VALUES
      ('buques', 'id_buque'),
      ('buque_maquinas', 'id_buque_maquina'),
      ('buque_plantas', 'id_buque_planta'),
      ('alistamiento_buques', 'id_alistamiento'),
      ('personal', 'id_persona')
    ) AS t(tabla, pk)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.%I', _tabla);
    EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields()', _tabla);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_log_changes ON api.%I', _tabla);
    EXECUTE format('CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.log_changes(%L)', _tabla, _pk);
  END LOOP;
END
$$;

-- Recrea rl_soft_delete en todas las tablas api con deleted_at (mismo bloque que 20261016173527).
-- Debe ir al final: las reglas con RETURNING * fijan las columnas del momento en que se crean.
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
END $$;

NOTIFY pgrst, 'reload schema';
