-- Idempotent patch after pg_restore / psql restore (dump may omit or mismatch these).
-- 1) pgcrypto for auth.login / UUID defaults
-- 2) Soft-delete column default
-- 3) RLS policies for PostgREST roles on api.*
-- 4) Drop legacy api.* wrappers (use auth.*)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE auth.usuarios_sistema ALTER COLUMN deleted_at DROP DEFAULT;
COMMENT ON COLUMN auth.usuarios_sistema.deleted_at IS 'Soft-delete timestamp; NULL while the row is active';

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'api' AND c.relkind = 'r'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS pgrst_administrador_all ON api.%I', t);
    EXECUTE format(
      'CREATE POLICY pgrst_administrador_all ON api.%I FOR ALL TO administrador USING (true) WITH CHECK (true)',
      t
    );
    EXECUTE format('DROP POLICY IF EXISTS pgrst_usuario_comun_all ON api.%I', t);
    EXECUTE format(
      'CREATE POLICY pgrst_usuario_comun_all ON api.%I FOR ALL TO usuario_comun USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS api.verify(text, text, text);
DROP FUNCTION IF EXISTS api.url_decode(text);
DROP FUNCTION IF EXISTS api.url_encode(bytea);
DROP FUNCTION IF EXISTS api.sign(json, text, text);
DROP FUNCTION IF EXISTS api.hash_password(text);
DROP FUNCTION IF EXISTS api.algorithm_sign(text, text, text);
DROP VIEW IF EXISTS api.vw_token_blacklist;
DROP VIEW IF EXISTS api.vw_usuarios_sistema;
DROP FUNCTION IF EXISTS api.login(text, text);
DROP FUNCTION IF EXISTS api.logout();

-- auth.logout: require usuario + exp in JWT; concat was NULL when claims empty/wrong shape (23502 on token).
CREATE OR REPLACE FUNCTION auth.logout()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  _claims json;
  _raw text;
  _usuario text;
  _exp text;
  _key text;
BEGIN
  _raw := current_setting('request.jwt.claims', true);
  IF _raw IS NULL OR btrim(_raw) = '' THEN
    RAISE EXCEPTION 'No hay sesión activa (sin JWT)' USING ERRCODE = 'PT401';
  END IF;

  _claims := _raw::json;
  IF _claims IS NULL OR json_typeof(_claims) = 'null' THEN
    RAISE EXCEPTION 'No hay sesión activa' USING ERRCODE = 'PT401';
  END IF;

  _usuario := nullif(btrim(_claims->>'usuario'), '');
  _exp := nullif(btrim(_claims->>'exp'), '');
  IF _usuario IS NULL THEN
    _usuario := nullif(btrim(_claims->>'sub'), '');
  END IF;
  IF _usuario IS NULL OR _exp IS NULL THEN
    RAISE EXCEPTION 'JWT sin claims usuario/exp (usa el mismo token que devuelve auth.login)' USING ERRCODE = 'PT401';
  END IF;

  _key := _usuario || ':' || _exp;
  INSERT INTO auth.token_blacklist (token, expiracion)
  VALUES (_key, to_timestamp(_exp::double precision))
  ON CONFLICT (token) DO NOTHING;
END;
$function$;

-- ==========================================
-- DASHBOARD SUPPORT (RPC & INDEXES)
-- ==========================================

-- 1. Índices para optimización de Dashboard
CREATE INDEX IF NOT EXISTS idx_senales_estado ON api.senales(id_estado) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fallas_fecha ON api.fallas(fecha_falla);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_fecha ON api.mantenimientos(fecha_inicio);

-- 2. RPC: Estadísticas Generales
DROP FUNCTION IF EXISTS api.get_dashboard_stats();
CREATE OR REPLACE FUNCTION api.get_dashboard_stats()
RETURNS json AS $$
DECLARE
  _id_fuera_servicio uuid[];
  _id_operativa uuid[];
BEGIN
  -- Obtener IDs de estados críticos/fuera de servicio
  SELECT array_agg(id_estado) INTO _id_fuera_servicio 
  FROM api.estados 
  WHERE nombre IN ('Fuera de Servicio', 'Pendiente de Reparación', 'Desactivada');

  -- Obtener IDs de estados operativos
  SELECT array_agg(id_estado) INTO _id_operativa 
  FROM api.estados 
  WHERE nombre IN ('Operativa', 'Activo demo', 'En Pruebas', 'En Instalación');

  RETURN json_build_object(
    'senales_total', (SELECT count(*) FROM api.senales WHERE deleted_at IS NULL),
    'senales_operativas', (SELECT count(*) FROM api.senales WHERE id_estado = ANY(_id_operativa) AND deleted_at IS NULL),
    'fuera_servicio', (SELECT count(*) FROM api.senales WHERE id_estado = ANY(_id_fuera_servicio) AND deleted_at IS NULL),
    'fallas_abiertas', (SELECT count(*) FROM api.fallas WHERE fecha_restablecer IS NULL AND deleted_at IS NULL),
    'mant_proximos', (SELECT count(*) FROM api.mantenimientos WHERE (fecha_inicio > now() AND fecha_inicio < now() + interval '7 days') AND deleted_at IS NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Analítica de Fallas (Para Gráficos)
-- Si no hay datos para el mes solicitado, busca los últimos 6 meses por defecto
DROP FUNCTION IF EXISTS api.get_fault_analytics(int, int);
CREATE OR REPLACE FUNCTION api.get_fault_analytics(p_mes int DEFAULT NULL, p_anio int DEFAULT NULL)
RETURNS TABLE(semana text, total_fallas bigint, tiempo_medio_resolucion interval) AS $$
DECLARE
  _target_month int := COALESCE(p_mes, extract(month from now())::int);
  _target_year int := COALESCE(p_anio, extract(year from now())::int);
BEGIN
  -- Si no hay fallas en el mes solicitado, intentamos buscar las más recientes para que el gráfico no salga vacío en desarrollo
  IF NOT EXISTS (SELECT 1 FROM api.fallas WHERE extract(month from fecha_falla) = _target_month AND extract(year from fecha_falla) = _target_year AND deleted_at IS NULL) THEN
    SELECT extract(month from max(fecha_falla))::int, extract(year from max(fecha_falla))::int 
    INTO _target_month, _target_year
    FROM api.fallas WHERE deleted_at IS NULL;
  END IF;

  RETURN QUERY
  SELECT 
    ('Semana ' || extract(week from fecha_falla)::text)::text as semana,
    count(*)::bigint as total_fallas,
    avg(duracion_de_falla)::interval as tiempo_medio_resolucion
  FROM api.fallas
  WHERE extract(month from fecha_falla) = _target_month 
    AND extract(year from fecha_falla) = _target_year
    AND deleted_at IS NULL
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Estado por Zona
DROP FUNCTION IF EXISTS api.get_status_by_zone();
CREATE OR REPLACE FUNCTION api.get_status_by_zone()
RETURNS TABLE(nombre_zona text, conteo_senales bigint, estado_critico bigint) AS $$
DECLARE
  _id_critico uuid[];
BEGIN
  SELECT array_agg(id_estado) INTO _id_critico 
  FROM api.estados 
  WHERE nombre IN ('Fuera de Servicio', 'Pendiente de Reparación', 'Desactivada');

  RETURN QUERY
  SELECT 
    z.nombre::text,
    count(s.id_senal)::bigint,
    count(s.id_senal) FILTER (WHERE s.id_estado = ANY(_id_critico))::bigint
  FROM api.zonas z
  LEFT JOIN api.senales s ON s.id_zona = z.id_zona AND s.deleted_at IS NULL
  WHERE z.deleted_at IS NULL
  GROUP BY z.id_zona, z.nombre
  ORDER BY z.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Permisos para roles de PostgREST
GRANT EXECUTE ON FUNCTION api.get_dashboard_stats() TO administrador, usuario_comun;
GRANT EXECUTE ON FUNCTION api.get_fault_analytics(int, int) TO administrador, usuario_comun;
GRANT EXECUTE ON FUNCTION api.get_status_by_zone() TO administrador, usuario_comun;

-- 6. Notificar a PostgREST para recargar el esquema
-- Esto asegura que los nuevos endpoints RPC sean visibles inmediatamente
NOTIFY pgrst, 'reload schema';

