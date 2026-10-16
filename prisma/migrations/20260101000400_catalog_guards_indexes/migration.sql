-- Guardas de baja en catalogos e indices de busqueda

CREATE OR REPLACE FUNCTION api.prevent_delete_if_referenced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  _fk record;
  _columna_pk text;
  _columna_fk text;
  _tiene_deleted_at boolean;
  _valor uuid;
  _encontrado integer;
  _sql text;
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    FOR _fk IN
      SELECT c.conrelid, c.conkey[1] AS attnum_fk, c.confkey[1] AS attnum_pk
      FROM pg_constraint c
      WHERE c.contype = 'f' AND c.confrelid = TG_RELID
    LOOP
      SELECT a.attname INTO _columna_pk
      FROM pg_attribute a
      WHERE a.attrelid = TG_RELID AND a.attnum = _fk.attnum_pk;

      SELECT a.attname INTO _columna_fk
      FROM pg_attribute a
      WHERE a.attrelid = _fk.conrelid AND a.attnum = _fk.attnum_fk;

      SELECT EXISTS (
        SELECT 1
        FROM pg_attribute a
        WHERE a.attrelid = _fk.conrelid AND a.attname = 'deleted_at' AND a.attnum > 0 AND NOT a.attisdropped
      ) INTO _tiene_deleted_at;

      _valor := (to_jsonb(OLD) ->> _columna_pk)::uuid;

      _sql := format('SELECT 1 FROM %s WHERE %I = $1', _fk.conrelid::regclass, _columna_fk);
      IF _tiene_deleted_at THEN
        _sql := _sql || ' AND deleted_at IS NULL';
      END IF;

      EXECUTE _sql || ' LIMIT 1' INTO _encontrado USING _valor;

      IF _encontrado IS NOT NULL THEN
        RAISE EXCEPTION 'El registro esta en uso' USING ERRCODE = '23503', HINT = format('Referenciado desde %s', _fk.conrelid::regclass);
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END
$$;

DO $$
DECLARE
  _catalogo text;
BEGIN
  FOREACH _catalogo IN ARRAY ARRAY[
    'caracteristicas', 'categorias', 'colores', 'colores_luz', 'empresas', 'energias',
    'estaciones', 'estados', 'estados_senal', 'formas', 'marcas_tope', 'mares',
    'materiales', 'modelos_senal', 'origenes_falla', 'tipos_equipamiento', 'tipos_falla',
    'tipos_mantenimiento', 'tipos_senal', 'usuarios_navegacion', 'zonas'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_delete_if_referenced ON api.%I', _catalogo);
    EXECUTE format('CREATE TRIGGER trg_prevent_delete_if_referenced BEFORE UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.prevent_delete_if_referenced()', _catalogo);
  END LOOP;
END
$$;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE INDEX IF NOT EXISTS idx_senales_nombre_trgm ON api.senales USING gin (nombre public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_senales_codigo_lsm_trgm ON api.senales USING gin (codigo_lsm public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_senales_ubicacion_trgm ON api.senales USING gin (ubicacion public.gin_trgm_ops);

-- fallas(fecha_falla) y mantenimientos(fecha_inicio) ya tienen indice en el baseline (idx_fallas_fecha, idx_mantenimientos_fecha)
CREATE INDEX IF NOT EXISTS idx_fallas_id_senal ON api.fallas (id_senal);
CREATE INDEX IF NOT EXISTS idx_fallas_id_tipo_falla ON api.fallas (id_tipo_falla);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_id_senal ON api.mantenimientos (id_senal);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_id_tipo_mant ON api.mantenimientos (id_tipo_mant);

REVOKE EXECUTE ON FUNCTION api.prevent_delete_if_referenced() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION api.prevent_delete_if_referenced() TO api_service;

NOTIFY pgrst, 'reload schema';
