#!/usr/bin/env node
/**
 * DB maintenance from PostgREST INI (db-uri + jwt-secret).
 *   node scripts/db.cjs post-restore [postgrest.ini]  — post-restore.sql + sync auth.login
 *   node scripts/db.cjs sync-jwt [postgrest.ini]     — only auth.login JWT fallback
 * Default INI: postgrest-docker.conf (override argv or POSTGREST_CONF).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readConfText(confPath) {
  return fs.readFileSync(confPath, 'utf8');
}

function readDbTargetFromText(text) {
  const m = text.match(/^\s*db-uri\s*=\s*"([^"]+)"/m);
  if (!m) return null;
  const raw = m[1].replace(/^postgres(ql)?:\/\//i, 'postgres://');
  const u = new URL(raw);
  const dbPath = u.pathname.replace(/^\//, '').split('?')[0];
  return {
    host: u.hostname || 'localhost',
    port: u.port || '5432',
    user: decodeURIComponent(u.username || 'postgres'),
    password: decodeURIComponent(u.password || ''),
    database: dbPath || 'postgres',
  };
}

function resolveDbFromPostgrestConfText(confText) {
  if (process.env.DB_HOST) {
    return {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || '5432',
      user: process.env.DB_USER || 'postgres',
      database: process.env.DB_NAME || 'infoanav',
      password: process.env.DB_PASSWORD ?? 'admin',
    };
  }
  return (
    readDbTargetFromText(confText) || {
      host: 'localhost',
      port: '5432',
      user: 'postgres',
      database: 'infoanav',
      password: process.env.DB_PASSWORD ?? 'admin',
    }
  );
}

function readJwtSecretFromText(text) {
  const m = text.match(/^\s*jwt-secret\s*=\s*"([^"]*)"/m);
  if (!m) throw new Error('jwt-secret not found in config');
  return m[1];
}

function buildLoginSql(secret) {
  const tag = `jfb${Math.random().toString(36).slice(2, 10)}`;
  if (secret.includes(`$${tag}$`)) {
    throw new Error('jwt-secret contains the generated dollar-quote tag; change secret or script');
  }
  const lit = `$${tag}$${secret}$${tag}$`;
  return `CREATE OR REPLACE FUNCTION auth.login(usuario text, contrasena text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  _rol name;
  _token text;
  _stored_hash text;
  _jwt_secret text;
BEGIN
  _jwt_secret := coalesce(
    current_setting('pgrst.jwt_secret', true),
    current_setting('app.settings.jwt_secret', true),
    ${lit}
  );

  SELECT
    u.contrasena,
    CASE
      WHEN u.cargo_ocupa = 'Administrador' THEN 'administrador'
      ELSE 'usuario_comun'
    END
  INTO _stored_hash, _rol
  FROM auth.usuarios_sistema u
  WHERE u.usuario = login.usuario;

  IF _stored_hash IS NULL OR _stored_hash != public.crypt(login.contrasena, _stored_hash) THEN
    RAISE EXCEPTION 'Usuario o contraseña incorrectos' USING ERRCODE = 'PT401';
  END IF;

  SELECT auth.sign(
    json_build_object(
      'role', _rol,
      'exp', extract(epoch from now())::integer + 86400,
      'usuario', login.usuario
    ),
    _jwt_secret
  ) INTO _token;

  RETURN _token;
END;
$function$;
`;
}

function syncJwt(confPath) {
  if (!fs.existsSync(confPath)) {
    console.error(`Config not found: ${confPath}`);
    process.exit(1);
  }
  const confText = readConfText(confPath);
  const secret = readJwtSecretFromText(confText);
  const sql = buildLoginSql(secret);
  const { host, port, user, database, password } = resolveDbFromPostgrestConfText(confText);

  const r = spawnSync(
    'psql',
    ['-h', host, '-p', String(port), '-U', user, '-d', database, '-v', 'ON_ERROR_STOP=1'],
    {
      input: sql,
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: password },
    }
  );
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.error(`auth.login JWT synced from ${confPath} (${user}@${host}:${port}/${database})`);
}

function postRestore(confPath) {
  const sqlPath = path.resolve(process.env.POST_RESTORE_SQL || path.join(__dirname, 'sql', 'post-restore.sql'));
  if (!fs.existsSync(confPath)) {
    console.error(`Config not found: ${confPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL not found: ${sqlPath}`);
    process.exit(1);
  }
  const confText = readConfText(confPath);
  const { host, port, user, database, password } = resolveDbFromPostgrestConfText(confText);
  const env = { ...process.env, PGPASSWORD: password };

  const psql = spawnSync(
    'psql',
    ['-h', host, '-p', String(port), '-U', user, '-d', database, '-v', 'ON_ERROR_STOP=1', '-f', sqlPath],
    { env, stdio: 'inherit' }
  );
  if (psql.status !== 0) process.exit(psql.status ?? 1);

  syncJwt(confPath);
  console.error(`Post-restore OK (${user}@${host}:${port}/${database})`);
}

function main() {
  const cmd = process.argv[2];
  const confPath = path.resolve(process.argv[3] || process.env.POSTGREST_CONF || 'postgrest-docker.conf');

  if (cmd === 'sync-jwt') {
    syncJwt(confPath);
    return;
  }
  if (cmd === 'post-restore') {
    postRestore(confPath);
    return;
  }

  console.error('Usage: node scripts/db.cjs <post-restore|sync-jwt> [postgrest.ini]');
  process.exit(1);
}

main();
