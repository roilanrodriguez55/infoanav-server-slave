-- Migracion: mantenimiento_plan_lmf_racon_hechos
-- Plan de mantenimiento, operaciones LMF (Leva, Mantenimiento y Fondeo), equipos RACON y hechos extraordinarios

CREATE TABLE IF NOT EXISTS api.plan_mantenimiento (
  id_plan_mantenimiento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_senal uuid NOT NULL REFERENCES api.senales (id_senal),
  id_tipo_mant uuid REFERENCES api.tipos_mantenimiento (id_tipo_mant),
  fecha_plan timestamp without time zone,
  trabajo_medios text,
  observaciones text,
  fecha_cumplida timestamp without time zone,
  id_mantenimiento uuid REFERENCES api.mantenimientos (id_mantenimiento),
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_plan_mantenimiento_id_senal ON api.plan_mantenimiento (id_senal);
CREATE INDEX IF NOT EXISTS idx_plan_mantenimiento_id_tipo_mant ON api.plan_mantenimiento (id_tipo_mant);
CREATE INDEX IF NOT EXISTS idx_plan_mantenimiento_id_mantenimiento ON api.plan_mantenimiento (id_mantenimiento);

CREATE TABLE IF NOT EXISTS api.lmf (
  id_lmf uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_senal uuid NOT NULL REFERENCES api.senales (id_senal),
  fecha_leva timestamp without time zone,
  fecha_fondeo timestamp without time zone,
  marea varchar(100),
  mar varchar(100),
  viento varchar(100),
  estado_tiempo varchar(100),
  metodo_posicion varchar(100),
  dirigente varchar(150),
  observaciones text,
  buque_ejecutor varchar(150),
  capitan varchar(150),
  responsable varchar(150),
  tipo_fondo varchar(100),
  latitud double precision,
  longitud double precision,
  profundidad numeric(8,2),
  cadena_cantidad integer,
  cadena_diametro numeric(8,2),
  pesos_muertos_cantidad integer,
  pesos_muertos_tipo varchar(100),
  grilletes_union_cantidad integer,
  grilletes_union_tipo varchar(100),
  grillete_giratorio varchar(100),
  brida_tipo varchar(100),
  brida_cantidad integer,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_lmf_id_senal ON api.lmf (id_senal);

CREATE TABLE IF NOT EXISTS api.racon (
  id_racon uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_senal uuid NOT NULL REFERENCES api.senales (id_senal),
  numero_orden varchar(50),
  nombre varchar(150),
  id_empresa uuid REFERENCES api.empresas (id_empresa),
  id_estacion uuid REFERENCES api.estaciones (id_estacion),
  tipo varchar(100),
  banda varchar(50),
  frecuencia varchar(50),
  barrido varchar(50),
  supresion_lobulo_lateral varchar(50),
  pulso varchar(50),
  modo_servicio varchar(100),
  identificador varchar(50),
  largo_identificador varchar(50),
  alcance numeric(8,2),
  sensibilidad varchar(50),
  retardo_pulso varchar(50),
  antena_tipo varchar(100),
  antena_ganancia varchar(50),
  antena_directividad varchar(100),
  antena_polarizacion varchar(100),
  dimensiones varchar(100),
  peso varchar(50),
  color varchar(50),
  energia varchar(100),
  consumo varchar(50),
  fecha_inicio timestamp without time zone,
  fecha_baja timestamp without time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_racon_id_senal ON api.racon (id_senal);
CREATE INDEX IF NOT EXISTS idx_racon_id_empresa ON api.racon (id_empresa);
CREATE INDEX IF NOT EXISTS idx_racon_id_estacion ON api.racon (id_estacion);

CREATE TABLE IF NOT EXISTS api.hechos (
  id_hecho uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_senal uuid NOT NULL REFERENCES api.senales (id_senal),
  fecha date,
  hora time without time zone,
  hecho text,
  reporta varchar(150),
  ogo varchar(150),
  medidas text,
  perdidas text,
  costo_mn numeric(12,2),
  costo_mlc numeric(12,2),
  rg varchar(50),
  vandalico boolean NOT NULL DEFAULT false,
  concluso boolean NOT NULL DEFAULT false,
  fecha_pronostico_conclusion date,
  fecha_conclusion date,
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_hechos_id_senal ON api.hechos (id_senal);

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON api.plan_mantenimiento, api.lmf, api.racon, api.hechos TO api_service;

DO $$
DECLARE
  _tabla text;
  _pk text;
BEGIN
  FOR _tabla, _pk IN
    SELECT * FROM (VALUES
      ('plan_mantenimiento', 'id_plan_mantenimiento'),
      ('lmf', 'id_lmf'),
      ('racon', 'id_racon'),
      ('hechos', 'id_hecho')
    ) AS t(tabla, pk)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.%I', _tabla);
    EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields()', _tabla);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_log_changes ON api.%I', _tabla);
    EXECUTE format('CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.log_changes(%L)', _tabla, _pk);

    EXECUTE format('DROP RULE IF EXISTS rl_soft_delete ON api.%I', _tabla);
    EXECUTE format('CREATE RULE rl_soft_delete AS ON DELETE TO api.%1$I DO INSTEAD UPDATE api.%1$I SET deleted_at = now() WHERE %2$I = old.%2$I RETURNING *', _tabla, _pk);
  END LOOP;
END
$$;

NOTIFY pgrst, 'reload schema';
