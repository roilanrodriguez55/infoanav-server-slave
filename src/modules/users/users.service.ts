import bcrypt from 'bcrypt';
import type pg from 'pg';

import { pool, withTransaction } from '../../db/pool.ts';
import type { Rol } from '../../lib/tokens.ts';
import { HttpError } from '../../middleware/errors.ts';
import { revokeAllRefreshTokens } from '../auth/auth.service.ts';
import { COSTE_HASH, crearCodigoRecuperacion } from '../auth/recoveryCode.ts';

export interface UsuarioAdmin {
  id: string;
  usuario: string;
  rol: Rol;
  cargo_ocupa: string | null;
  id_empresa: string | null;
  created_at: string;
  updated_at: string | null;
}

// Solo lleva codigo_recuperacion cuando el usuario es administrador y el codigo se acaba de generar
export type UsuarioConCodigo = UsuarioAdmin & { codigo_recuperacion?: string };

export interface ActorUsuario {
  id: string;
  usuario: string;
}

export interface NuevoUsuario {
  usuario: string;
  contrasena: string;
  rol: Rol;
  cargo_ocupa?: string | null;
  id_empresa?: string | null;
}

export interface CambiosUsuario {
  rol?: Rol;
  cargo_ocupa?: string | null;
  id_empresa?: string | null;
  contrasena?: string;
}

interface FilaUsuario {
  id_usuario_sist: string;
  usuario: string;
  rol: Rol;
  cargo_ocupa: string | null;
  id_empresa: string | null;
  created_at: Date;
  updated_at: Date | null;
}

// Lista explicita de columnas: la contrasena nunca sale de este modulo
const COLUMNAS_USUARIO =
  'id_usuario_sist, usuario, rol, cargo_ocupa, id_empresa, created_at, updated_at';

function aUsuario(fila: FilaUsuario): UsuarioAdmin {
  return {
    id: fila.id_usuario_sist,
    usuario: fila.usuario,
    rol: fila.rol,
    cargo_ocupa: fila.cargo_ocupa,
    id_empresa: fila.id_empresa,
    created_at: fila.created_at.toISOString(),
    updated_at: fila.updated_at?.toISOString() ?? null,
  };
}

function conCodigo(usuario: UsuarioAdmin, codigo: string | undefined): UsuarioConCodigo {
  return codigo === undefined ? usuario : { ...usuario, codigo_recuperacion: codigo };
}

function codigoError(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

// Bloquea las filas de administradores activos y devuelve cuantos hay, para que dos bajas o cambios concurrentes no dejen el sistema sin administrador
async function bloquearAdministradores(client: pg.PoolClient): Promise<number> {
  const { rows } = await client.query<{ id_usuario_sist: string }>(
    "SELECT id_usuario_sist FROM auth.usuarios_sistema WHERE rol = 'administrador' FOR UPDATE",
  );
  return rows.length;
}

async function rolDeUsuario(client: pg.PoolClient, id: string): Promise<Rol> {
  const { rows } = await client.query<{ rol: Rol }>(
    'SELECT rol FROM auth.usuarios_sistema WHERE id_usuario_sist = $1',
    [id],
  );
  if (!rows[0]) {
    throw new HttpError(404, 'Usuario no encontrado');
  }
  return rows[0].rol;
}

export async function listUsers(): Promise<UsuarioAdmin[]> {
  const { rows } = await pool.query<FilaUsuario>(
    `SELECT ${COLUMNAS_USUARIO} FROM auth.usuarios_sistema ORDER BY usuario`,
  );
  return rows.map(aUsuario);
}

export async function createUser(actor: ActorUsuario, input: NuevoUsuario): Promise<UsuarioConCodigo> {
  const hash = await bcrypt.hash(input.contrasena, COSTE_HASH);
  const recuperacion = input.rol === 'administrador' ? await crearCodigoRecuperacion() : null;
  try {
    const { rows } = await pool.query<FilaUsuario>(
      `INSERT INTO auth.usuarios_sistema (usuario, contrasena, rol, cargo_ocupa, id_empresa, codigo_recuperacion_hash, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING ${COLUMNAS_USUARIO}`,
      [
        input.usuario,
        hash,
        input.rol,
        input.cargo_ocupa ?? null,
        input.id_empresa ?? null,
        recuperacion?.hash ?? null,
        actor.usuario,
      ],
    );
    return conCodigo(aUsuario(rows[0]), recuperacion?.codigo);
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

export async function updateUser(actor: ActorUsuario, id: string, input: CambiosUsuario): Promise<UsuarioConCodigo> {
  const asignaciones: string[] = [];
  const valores: unknown[] = [];
  const asignar = (columna: string, valor: unknown): void => {
    asignaciones.push(`${columna} = $${valores.push(valor)}`);
  };

  if (input.rol !== undefined) asignar('rol', input.rol);
  if (input.cargo_ocupa !== undefined) asignar('cargo_ocupa', input.cargo_ocupa);
  if (input.id_empresa !== undefined) asignar('id_empresa', input.id_empresa);
  if (input.contrasena !== undefined) asignar('contrasena', await bcrypt.hash(input.contrasena, COSTE_HASH));
  if (asignaciones.length === 0) {
    throw new HttpError(400, 'Nada que actualizar');
  }

  const { fila, codigo, rolCambio } = await withTransaction(async (client) => {
    const administradores = await bloquearAdministradores(client);
    const rolActual = await rolDeUsuario(client, id);
    const rolCambio = input.rol !== undefined && input.rol !== rolActual;
    if (id === actor.id && rolCambio) {
      throw new HttpError(409, 'No puedes cambiar tu propio rol');
    }
    if (input.rol === 'usuario' && rolActual === 'administrador' && administradores === 1) {
      throw new HttpError(409, 'No se puede quitar el rol al ultimo administrador');
    }

    // El codigo de recuperacion solo existe mientras el usuario es administrador
    let codigoNuevo: string | undefined;
    if (input.rol === 'administrador' && rolActual === 'usuario') {
      const recuperacion = await crearCodigoRecuperacion();
      asignar('codigo_recuperacion_hash', recuperacion.hash);
      codigoNuevo = recuperacion.codigo;
    } else if (input.rol === 'usuario' && rolActual === 'administrador') {
      asignar('codigo_recuperacion_hash', null);
    }

    const posicionActor = valores.push(actor.usuario);
    const posicionId = valores.push(id);
    const { rows } = await client.query<FilaUsuario>(
      `UPDATE auth.usuarios_sistema
       SET ${asignaciones.join(', ')}, updated_at = now(), updated_by = $${posicionActor}
       WHERE id_usuario_sist = $${posicionId}
       RETURNING ${COLUMNAS_USUARIO}`,
      valores,
    );
    return { fila: rows[0], codigo: codigoNuevo, rolCambio };
  });

  // Las sesiones previas usan la contrasena o el rol anteriores, asi que se cierran tras el commit
  if (input.contrasena !== undefined || rolCambio) {
    await revokeAllRefreshTokens(id);
  }
  return conCodigo(aUsuario(fila), codigo);
}

// Genera un codigo nuevo para un administrador. El anterior deja de valer
export async function regenerarCodigoRecuperacion(actor: ActorUsuario, id: string): Promise<string> {
  const recuperacion = await crearCodigoRecuperacion();
  await withTransaction(async (client) => {
    const rol = await rolDeUsuario(client, id);
    if (rol !== 'administrador') {
      throw new HttpError(409, 'El usuario no es administrador');
    }

    await client.query(
      'UPDATE auth.usuarios_sistema SET codigo_recuperacion_hash = $1, updated_at = now(), updated_by = $2 WHERE id_usuario_sist = $3',
      [recuperacion.hash, actor.usuario, id],
    );
  });
  return recuperacion.codigo;
}

export async function deleteUser(actor: ActorUsuario, id: string): Promise<void> {
  if (id === actor.id) {
    throw new HttpError(409, 'No puedes eliminarte a ti mismo');
  }

  // Borrado fisico: los refresh tokens del usuario caen por ON DELETE CASCADE
  await withTransaction(async (client) => {
    const administradores = await bloquearAdministradores(client);
    const rol = await rolDeUsuario(client, id);
    if (rol === 'administrador' && administradores === 1) {
      throw new HttpError(409, 'No se puede eliminar al ultimo administrador');
    }

    await client.query('DELETE FROM auth.usuarios_sistema WHERE id_usuario_sist = $1', [id]);
  });
}
