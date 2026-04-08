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
