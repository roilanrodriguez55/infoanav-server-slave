-- Acceso de PostgREST: rol api_service, sin RLS y sin roles legados

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'api_service') THEN
    CREATE ROLE api_service NOLOGIN;
  END IF;
END
$$;

GRANT api_service TO CURRENT_USER;

DO $$
DECLARE
  tabla record;
  politica record;
BEGIN
  FOR tabla IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'api' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE api.%I DISABLE ROW LEVEL SECURITY', tabla.relname);
  END LOOP;

  FOR politica IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'api'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON api.%I', politica.policyname, politica.tablename);
  END LOOP;
END
$$;

DO $$
DECLARE
  rol text;
BEGIN
  FOREACH rol IN ARRAY ARRAY['anon', 'usuario_comun', 'administrador']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA api FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA auth FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA api FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA auth FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA api FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA auth FROM %I', rol);
      EXECUTE format('REVOKE ALL ON SCHEMA api FROM %I', rol);
      EXECUTE format('REVOKE ALL ON SCHEMA auth FROM %I', rol);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA api REVOKE ALL ON TABLES FROM %I', rol);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA api REVOKE ALL ON SEQUENCES FROM %I', rol);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA api REVOKE ALL ON FUNCTIONS FROM %I', rol);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA auth REVOKE ALL ON TABLES FROM %I', rol);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA auth REVOKE ALL ON SEQUENCES FROM %I', rol);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA auth REVOKE ALL ON FUNCTIONS FROM %I', rol);
    END IF;
  END LOOP;
END
$$;

GRANT USAGE ON SCHEMA api TO api_service;
GRANT ALL ON ALL TABLES IN SCHEMA api TO api_service;
GRANT ALL ON ALL SEQUENCES IN SCHEMA api TO api_service;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA api FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api TO api_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON TABLES TO api_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT ALL ON SEQUENCES TO api_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA api REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA api GRANT EXECUTE ON FUNCTIONS TO api_service;

NOTIFY pgrst, 'reload schema';
