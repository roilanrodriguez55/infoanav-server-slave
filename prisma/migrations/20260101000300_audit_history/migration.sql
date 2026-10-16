-- Auditoria (created_by/updated_by/deleted_by) e historial de cambios

CREATE OR REPLACE FUNCTION api.set_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  _usuario text := coalesce(nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'usuario', ''), 'sistema');
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.created_by := _usuario;
    NEW.updated_at := now();
    NEW.updated_by := _usuario;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    NEW.updated_at := now();
    NEW.updated_by := _usuario;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      NEW.deleted_by := _usuario;
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      NEW.deleted_by := NULL;
    END IF;
  END IF;
  RETURN NEW;
END
$$;

CREATE TABLE IF NOT EXISTS api.historial_cambios (
  id_historial uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla text NOT NULL,
  id_registro uuid NOT NULL,
  operacion text NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  usuario text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now(),
  cambios jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_historial_registro ON api.historial_cambios (id_registro, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_historial_tabla ON api.historial_cambios (tabla, fecha DESC);

GRANT ALL ON api.historial_cambios TO api_service;

CREATE OR REPLACE FUNCTION api.log_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  _usuario text := coalesce(nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'usuario', ''), 'sistema');
  _operacion text;
  _id_registro uuid;
  _cambios jsonb;
BEGIN
  _id_registro := (to_jsonb(NEW) ->> TG_ARGV[0])::uuid;

  IF TG_OP = 'INSERT' THEN
    _operacion := 'INSERT';
    SELECT jsonb_object_agg(d.clave, jsonb_build_object('antes', NULL::jsonb, 'despues', d.valor))
      INTO _cambios
      FROM jsonb_each(to_jsonb(NEW)) AS d(clave, valor)
      WHERE d.clave NOT IN ('created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by')
        AND jsonb_typeof(d.valor) <> 'null';
  ELSE
    _operacion := CASE WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'DELETE' ELSE 'UPDATE' END;
    SELECT jsonb_object_agg(n.clave, jsonb_build_object('antes', o.valor, 'despues', n.valor))
      INTO _cambios
      FROM jsonb_each(to_jsonb(NEW)) AS n(clave, valor)
      JOIN jsonb_each(to_jsonb(OLD)) AS o(clave, valor) ON o.clave = n.clave
      WHERE n.valor IS DISTINCT FROM o.valor
        AND n.clave NOT IN ('updated_at', 'updated_by');
  END IF;

  IF _cambios IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO api.historial_cambios (tabla, id_registro, operacion, usuario, cambios)
  VALUES (TG_TABLE_NAME, _id_registro, _operacion, _usuario, _cambios);
  RETURN NULL;
END
$$;

DO $$
DECLARE
  tabla record;
  pk_columna text;
BEGIN
  FOR tabla IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'api'
      AND c.relkind = 'r'
      AND c.relname <> 'historial_cambios'
      AND (
        SELECT count(*)
        FROM pg_attribute a
        WHERE a.attrelid = c.oid
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND a.attname IN ('created_at', 'created_by', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by')
      ) = 6
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.%I', tabla.relname);
    EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields()', tabla.relname);
  END LOOP;

  FOR tabla IN
    SELECT unnest(ARRAY['senales', 'fallas', 'mantenimientos', 'equipamientos_senal']) AS relname
  LOOP
    SELECT a.attname
      INTO pk_columna
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
      WHERE i.indrelid = format('api.%I', tabla.relname)::regclass
        AND i.indisprimary;

    EXECUTE format('DROP TRIGGER IF EXISTS trg_log_changes ON api.%I', tabla.relname);
    EXECUTE format('CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.log_changes(%L)', tabla.relname, pk_columna);
  END LOOP;
END
$$;

GRANT EXECUTE ON FUNCTION api.set_audit_fields(), api.log_changes() TO api_service;

NOTIFY pgrst, 'reload schema';
