-- Migracion: catalogos_nuevos
-- Nueve catalogos nuevos con el patron de los existentes, grants a api_service,
-- trigger de auditoria, guarda de baja y baja logica (regla rl_soft_delete).
-- Los catalogos no se auditan con trg_log_changes.

CREATE TABLE IF NOT EXISTS api.complejidades (
    id_complejidad uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.ubicaciones_medio (
    id_ubicacion_medio uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.temas (
    id_tema uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.tipos_documento (
    id_tipo_documento uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.editoriales (
    id_editorial uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.idiomas (
    id_idioma uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.paises (
    id_pais uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.misiones_buque (
    id_mision_buque uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    codigo character varying(10),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

CREATE TABLE IF NOT EXISTS api.tipos_alistamiento (
    id_tipo_alistamiento uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    nombre character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp with time zone,
    deleted_by text
);

DO $$
DECLARE
  _catalogo text;
  _pk text;
BEGIN
  FOREACH _catalogo IN ARRAY ARRAY[
    'complejidades', 'ubicaciones_medio', 'temas', 'tipos_documento', 'editoriales',
    'idiomas', 'paises', 'misiones_buque', 'tipos_alistamiento'
  ]
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON api.%I TO api_service', _catalogo);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.%I', _catalogo);
    EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields()', _catalogo);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_delete_if_referenced ON api.%I', _catalogo);
    EXECUTE format('CREATE TRIGGER trg_prevent_delete_if_referenced BEFORE UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.prevent_delete_if_referenced()', _catalogo);

    SELECT a.attname INTO _pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
    WHERE i.indrelid = format('api.%I', _catalogo)::regclass
      AND i.indisprimary;

    EXECUTE format('DROP RULE IF EXISTS rl_soft_delete ON api.%I', _catalogo);
    EXECUTE format(
      'CREATE RULE rl_soft_delete AS ON DELETE TO api.%1$I DO INSTEAD UPDATE api.%1$I SET deleted_at = now() WHERE %2$I = old.%2$I RETURNING *',
      _catalogo,
      _pk
    );
  END LOOP;
END
$$;

ALTER TABLE api.senales ADD COLUMN IF NOT EXISTS id_complejidad uuid REFERENCES api.complejidades(id_complejidad);
CREATE INDEX IF NOT EXISTS idx_senales_id_complejidad ON api.senales (id_complejidad);

NOTIFY pgrst, 'reload schema';
