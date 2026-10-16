import bcrypt from 'bcrypt';

import { env } from '../config/env.ts';
import { pool } from '../db/pool.ts';

const COSTE_HASH = 10;
const LONGITUD_MIN_CONTRASENA = 8;
// bcrypt ignora los bytes a partir del 72, por eso el maximo se mide en bytes
const LONGITUD_MAX_CONTRASENA_BYTES = 72;

export async function ensureAdmin(): Promise<void> {
  const usuario = env.ADMIN_USER;
  const contrasena = env.ADMIN_PASSWORD;
  if (usuario === undefined || contrasena === undefined) {
    console.log('ADMIN_USER y ADMIN_PASSWORD no definidos; no se crea administrador inicial');
    return;
  }

  const { rows: activos } = await pool.query<{ existe: number }>(
    "SELECT 1 AS existe FROM auth.usuarios_sistema WHERE rol = 'administrador' AND deleted_at IS NULL LIMIT 1",
  );
  if (activos.length > 0) return;

  if ([...contrasena].length < LONGITUD_MIN_CONTRASENA || Buffer.byteLength(contrasena, 'utf8') > LONGITUD_MAX_CONTRASENA_BYTES) {
    throw new Error(
      `ADMIN_PASSWORD debe tener al menos ${LONGITUD_MIN_CONTRASENA} caracteres y como maximo ${LONGITUD_MAX_CONTRASENA_BYTES} bytes`,
    );
  }

  // Incluye las bajas: el nombre es unico aunque el usuario este eliminado
  const { rows: existentes } = await pool.query<{ existe: number }>(
    'SELECT 1 AS existe FROM auth.usuarios_sistema WHERE usuario = $1',
    [usuario],
  );
  if (existentes.length > 0) {
    throw new Error('ADMIN_USER ya existe pero no es un administrador activo; usa otro nombre o corrigelo en la BD');
  }

  const hash = await bcrypt.hash(contrasena, COSTE_HASH);
  await pool.query(
    `INSERT INTO auth.usuarios_sistema (usuario, contrasena, rol, cargo_ocupa, created_by, updated_by)
     VALUES ($1, $2, 'administrador', 'Administrador', 'sistema', 'sistema')`,
    [usuario, hash],
  );
  console.log(`Administrador inicial creado: ${usuario}`);
}
