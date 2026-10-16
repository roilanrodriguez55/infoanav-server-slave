-- Auth: rol de usuario, refresh tokens y limpieza de objetos heredados

ALTER TABLE auth.usuarios_sistema ADD COLUMN IF NOT EXISTS rol text;

UPDATE auth.usuarios_sistema SET rol = CASE WHEN cargo_ocupa = 'Administrador' THEN 'administrador' ELSE 'usuario' END WHERE rol IS NULL;

ALTER TABLE auth.usuarios_sistema ALTER COLUMN rol SET DEFAULT 'usuario';
ALTER TABLE auth.usuarios_sistema ALTER COLUMN rol SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'usuarios_sistema_rol_check'
      AND conrelid = 'auth.usuarios_sistema'::regclass
  ) THEN
    ALTER TABLE auth.usuarios_sistema ADD CONSTRAINT usuarios_sistema_rol_check CHECK (rol IN ('administrador','usuario'));
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario_sist uuid NOT NULL REFERENCES auth.usuarios_sistema(id_usuario_sist) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  familia uuid NOT NULL,
  expira timestamptz NOT NULL,
  revocado boolean NOT NULL DEFAULT false,
  reemplazado_por uuid REFERENCES auth.refresh_tokens(id) ON DELETE SET NULL,
  creado timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON auth.refresh_tokens (id_usuario_sist);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_familia ON auth.refresh_tokens (familia);

DROP TABLE IF EXISTS auth.token_blacklist;
DROP FUNCTION IF EXISTS auth.login(text, text);
DROP FUNCTION IF EXISTS auth.logout();
DROP FUNCTION IF EXISTS auth.sign(json, text, text);
DROP FUNCTION IF EXISTS auth.verify(text, text, text);
DROP FUNCTION IF EXISTS auth.url_encode(bytea);
DROP FUNCTION IF EXISTS auth.url_decode(text);
DROP FUNCTION IF EXISTS auth.algorithm_sign(text, text, text);
DROP FUNCTION IF EXISTS auth.hash_password(text);
