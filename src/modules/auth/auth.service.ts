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

export interface UsuarioSesion {
  id: string;
  usuario: string;
  rol: Rol;
  cargo_ocupa: string | null;
}

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioSesion;
}

interface FilaUsuarioSesion {
  id_usuario_sist: string;
  usuario: string;
  rol: Rol;
  cargo_ocupa: string | null;
}

interface FilaUsuario extends FilaUsuarioSesion {
  contrasena: string | null;
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

// Hash ficticio para igualar el tiempo de respuesta cuando el usuario no existe
const HASH_FICTICIO = bcrypt.hashSync('x', 10);

async function compararContrasena(contrasena: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(contrasena, hash);
  } catch {
    return false;
  }
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
    'SELECT id_usuario_sist, usuario, rol, cargo_ocupa, contrasena FROM auth.usuarios_sistema WHERE usuario = $1',
    [usuario],
  );
  const fila = rows[0];
  const coincide = await compararContrasena(contrasena, fila?.contrasena ?? HASH_FICTICIO);
  if (!fila || !coincide) {
    throw new HttpError(401, MENSAJE_LOGIN);
  }

  const sujeto: UsuarioSesion = {
    id: fila.id_usuario_sist,
    usuario: fila.usuario,
    rol: fila.rol,
    cargo_ocupa: fila.cargo_ocupa,
  };

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
      'SELECT id_usuario_sist, usuario, rol, cargo_ocupa FROM auth.usuarios_sistema WHERE id_usuario_sist = $1',
      [fila.id_usuario_sist],
    );
    const usuarioFila = usuarios[0];
    if (!usuarioFila) {
      await revocarFamilia(client, fila.familia);
      return null;
    }

    const usuario: UsuarioSesion = {
      id: usuarioFila.id_usuario_sist,
      usuario: usuarioFila.usuario,
      rol: usuarioFila.rol,
      cargo_ocupa: usuarioFila.cargo_ocupa,
    };

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
    'SELECT id_usuario_sist, usuario, rol, cargo_ocupa FROM auth.usuarios_sistema WHERE id_usuario_sist = $1',
    [idUsuario],
  );
  const fila = rows[0];
  if (!fila) {
    throw new HttpError(401, MENSAJE_SESION);
  }
  return {
    id: fila.id_usuario_sist,
    usuario: fila.usuario,
    rol: fila.rol,
    cargo_ocupa: fila.cargo_ocupa,
  };
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
