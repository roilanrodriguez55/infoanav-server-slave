import { randomUUID } from 'node:crypto';

import bcrypt from 'bcrypt';
import type pg from 'pg';

import { pool, withTransaction } from '../../db/pool.ts';
import {
  generateRefreshToken,
  hashRefreshToken,
  type Rol,
  refreshTtlMs,
  signAccessToken,
} from '../../lib/tokens.ts';
import { HttpError } from '../../middleware/errors.ts';
import { codigoCoincide, COSTE_HASH, crearCodigoRecuperacion } from './recoveryCode.ts';

export interface UsuarioSesion {
  id: string;
  usuario: string;
  rol: Rol;
  cargo_ocupa: string | null;
  id_empresa: string | null;
}

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioSesion;
}

export interface EstadoSetup {
  necesitaAdministrador: boolean;
  empresas: { id_empresa: string; nombre: string }[];
}

export interface NuevoAdministrador {
  usuario: string;
  contrasena: string;
  id_empresa?: string | null;
}

interface FilaUsuarioSesion {
  id_usuario_sist: string;
  usuario: string;
  rol: Rol;
  cargo_ocupa: string | null;
  id_empresa: string | null;
}

interface FilaUsuario extends FilaUsuarioSesion {
  contrasena: string | null;
}

interface FilaEmpresa {
  id_empresa: string;
  nombre: string;
}

interface FilaRefresh {
  id: string;
  id_usuario_sist: string;
  familia: string;
  vigente: boolean;
  revocado: boolean;
  reemplazado_por: string | null;
}

const MENSAJE_LOGIN = 'Usuario o contraseña incorrectos';
const MENSAJE_SESION = 'Sesion invalida';
const MENSAJE_RECUPERACION = 'Usuario o codigo incorrectos';
// Clave fija del advisory lock que serializa la creacion del primer administrador
const CLAVE_LOCK_SETUP = 7392014;

// Hash ficticio para igualar el tiempo de respuesta cuando el usuario no existe
const HASH_FICTICIO = bcrypt.hashSync('x', COSTE_HASH);

async function compararContrasena(contrasena: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(contrasena, hash);
  } catch {
    return false;
  }
}

function codigoError(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

function aUsuarioSesion(fila: FilaUsuarioSesion): UsuarioSesion {
  return {
    id: fila.id_usuario_sist,
    usuario: fila.usuario,
    rol: fila.rol,
    cargo_ocupa: fila.cargo_ocupa,
    id_empresa: fila.id_empresa,
  };
}

async function emitirRefreshToken(
  client: pg.PoolClient,
  idUsuario: string,
  familia: string,
): Promise<{ token: string; id: string }> {
  const { token, hash } = generateRefreshToken();
  const { rows } = await client.query<{ id: string }>(
    'INSERT INTO auth.refresh_tokens (id_usuario_sist, token_hash, familia, expira) VALUES ($1, $2, $3, $4) RETURNING id',
    [idUsuario, hash, familia, new Date(Date.now() + refreshTtlMs())],
  );
  return { token, id: rows[0].id };
}

function crearSesion(usuario: UsuarioSesion, refreshToken: string): Sesion {
  const accessToken = signAccessToken({ sub: usuario.id, usuario: usuario.usuario, rol: usuario.rol });
  return { accessToken, refreshToken, usuario };
}

async function revocarFamilia(client: pg.PoolClient, familia: string): Promise<void> {
  await client.query('UPDATE auth.refresh_tokens SET revocado = true WHERE familia = $1', [familia]);
}

export async function login(usuario: string, contrasena: string): Promise<Sesion> {
  const { rows } = await pool.query<FilaUsuario>(
    'SELECT id_usuario_sist, usuario, rol, cargo_ocupa, id_empresa, contrasena FROM auth.usuarios_sistema WHERE usuario = $1',
    [usuario],
  );
  const fila = rows[0];
  const coincide = await compararContrasena(contrasena, fila?.contrasena ?? HASH_FICTICIO);
  if (!fila || !coincide) {
    throw new HttpError(401, MENSAJE_LOGIN);
  }

  const sujeto = aUsuarioSesion(fila);

  return withTransaction(async (client) => {
    const { token } = await emitirRefreshToken(client, sujeto.id, randomUUID());
    return crearSesion(sujeto, token);
  });
}

export async function refresh(plainToken: string): Promise<Sesion> {
  // Los fallos devuelven null y el 401 se lanza fuera para que la transaccion haga COMMIT
  // de las revocaciones (un throw dentro provocaria ROLLBACK)
  const sesion = await withTransaction(async (client) => {
    const { rows } = await client.query<FilaRefresh>(
      `SELECT id, id_usuario_sist, familia, expira > now() AS vigente, revocado, reemplazado_por
       FROM auth.refresh_tokens WHERE token_hash = $1 FOR UPDATE`,
      [hashRefreshToken(plainToken)],
    );
    const fila = rows[0];
    if (!fila) return null;

    // Token ya usado o revocado: reuso, se cierra toda la familia
    if (fila.revocado || fila.reemplazado_por !== null) {
      await revocarFamilia(client, fila.familia);
      return null;
    }

    if (!fila.vigente) {
      await client.query('UPDATE auth.refresh_tokens SET revocado = true WHERE id = $1', [fila.id]);
      return null;
    }

    const { rows: usuarios } = await client.query<FilaUsuarioSesion>(
      'SELECT id_usuario_sist, usuario, rol, cargo_ocupa, id_empresa FROM auth.usuarios_sistema WHERE id_usuario_sist = $1',
      [fila.id_usuario_sist],
    );
    const usuarioFila = usuarios[0];
    if (!usuarioFila) {
      await revocarFamilia(client, fila.familia);
      return null;
    }

    const usuario = aUsuarioSesion(usuarioFila);

    const nuevo = await emitirRefreshToken(client, usuario.id, fila.familia);
    await client.query('UPDATE auth.refresh_tokens SET revocado = true, reemplazado_por = $2 WHERE id = $1', [
      fila.id,
      nuevo.id,
    ]);
    return crearSesion(usuario, nuevo.token);
  });

  if (!sesion) {
    throw new HttpError(401, MENSAJE_SESION);
  }
  return sesion;
}

export async function logout(plainToken: string | undefined): Promise<void> {
  if (plainToken === undefined) return;
  await pool.query('UPDATE auth.refresh_tokens SET revocado = true WHERE token_hash = $1', [
    hashRefreshToken(plainToken),
  ]);
}

export async function me(idUsuario: string): Promise<UsuarioSesion> {
  const { rows } = await pool.query<FilaUsuarioSesion>(
    'SELECT id_usuario_sist, usuario, rol, cargo_ocupa, id_empresa FROM auth.usuarios_sistema WHERE id_usuario_sist = $1',
    [idUsuario],
  );
  const fila = rows[0];
  if (!fila) {
    throw new HttpError(401, MENSAJE_SESION);
  }
  return aUsuarioSesion(fila);
}

export async function estadoSetup(): Promise<EstadoSetup> {
  const { rows: administradores } = await pool.query(
    "SELECT 1 FROM auth.usuarios_sistema WHERE rol = 'administrador' LIMIT 1",
  );
  if (administradores.length > 0) {
    return { necesitaAdministrador: false, empresas: [] };
  }

  const { rows } = await pool.query<FilaEmpresa>(
    'SELECT id_empresa, nombre FROM api.empresas WHERE deleted_at IS NULL AND nombre IS NOT NULL ORDER BY nombre',
  );
  return { necesitaAdministrador: true, empresas: rows };
}

// Crea el primer administrador. El lock evita que dos peticiones concurrentes creen dos
export async function crearPrimerAdministrador(datos: NuevoAdministrador): Promise<{ sesion: Sesion; codigoRecuperacion: string }> {
  const hash = await bcrypt.hash(datos.contrasena, COSTE_HASH);

  try {
    return await withTransaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock($1)', [CLAVE_LOCK_SETUP]);

      const { rows: administradores } = await client.query(
        "SELECT 1 FROM auth.usuarios_sistema WHERE rol = 'administrador' LIMIT 1",
      );
      if (administradores.length > 0) {
        throw new HttpError(409, 'Ya existe un administrador');
      }

      const recuperacion = await crearCodigoRecuperacion();
      const { rows } = await client.query<FilaUsuarioSesion>(
        `INSERT INTO auth.usuarios_sistema (usuario, contrasena, rol, cargo_ocupa, id_empresa, codigo_recuperacion_hash, created_by, updated_by)
         VALUES ($1, $2, 'administrador', 'Administrador', $3, $4, 'sistema', 'sistema')
         RETURNING id_usuario_sist, usuario, rol, cargo_ocupa, id_empresa`,
        [datos.usuario, hash, datos.id_empresa ?? null, recuperacion.hash],
      );
      const usuario = aUsuarioSesion(rows[0]);

      const { token } = await emitirRefreshToken(client, usuario.id, randomUUID());
      return { sesion: crearSesion(usuario, token), codigoRecuperacion: recuperacion.codigo };
    });
  } catch (error) {
    const codigo = codigoError(error);
    if (codigo === '23505') {
      throw new HttpError(409, 'Ya existe un usuario con ese nombre');
    }
    if (codigo === '23503') {
      throw new HttpError(400, 'La empresa indicada no existe');
    }
    throw error;
  }
}

// Mismo mensaje y tiempo tanto si falta el usuario como si el codigo no coincide
export async function resetPassword(usuario: string, codigo: string, nuevaContrasena: string): Promise<string> {
  return withTransaction(async (client) => {
    // FOR UPDATE evita que dos recuperaciones validas con el mismo codigo se apliquen a la vez
    const { rows } = await client.query<{ id_usuario_sist: string; codigo_recuperacion_hash: string | null }>(
      "SELECT id_usuario_sist, codigo_recuperacion_hash FROM auth.usuarios_sistema WHERE usuario = $1 AND rol = 'administrador' FOR UPDATE",
      [usuario],
    );
    const fila = rows[0];
    const coincide = await codigoCoincide(codigo, fila?.codigo_recuperacion_hash ?? HASH_FICTICIO);
    if (!fila || !coincide) {
      throw new HttpError(401, MENSAJE_RECUPERACION);
    }

    const hash = await bcrypt.hash(nuevaContrasena, COSTE_HASH);
    const nuevo = await crearCodigoRecuperacion();
    await client.query(
      'UPDATE auth.usuarios_sistema SET contrasena = $2, codigo_recuperacion_hash = $3, updated_at = now(), updated_by = $4 WHERE id_usuario_sist = $1',
      [fila.id_usuario_sist, hash, nuevo.hash, usuario],
    );

    // Las sesiones previas usan la contrasena anterior. Se revocan en la misma transaccion
    await client.query(
      'UPDATE auth.refresh_tokens SET revocado = true WHERE id_usuario_sist = $1 AND revocado = false',
      [fila.id_usuario_sist],
    );
    return nuevo.codigo;
  });
}

export async function revokeAllRefreshTokens(idUsuario: string): Promise<void> {
  await pool.query('UPDATE auth.refresh_tokens SET revocado = true WHERE id_usuario_sist = $1 AND revocado = false', [
    idUsuario,
  ]);
}

export async function purgeExpiredRefreshTokens(): Promise<number> {
  const resultado = await pool.query(
    "DELETE FROM auth.refresh_tokens WHERE expira < now() - interval '1 day'",
  );
  return resultado.rowCount ?? 0;
}
