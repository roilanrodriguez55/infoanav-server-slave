import { isAxiosError } from 'axios';
import { authHttp } from '@/services/config/axiosConfig';
import type { Rol } from '@/types/auth.types';

const MENSAJE_GENERICO = 'No se pudo completar la operación';

export interface Usuario {
  id: string;
  usuario: string;
  rol: Rol;
  cargo_ocupa: string | null;
  id_empresa: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NuevoUsuario {
  usuario: string;
  contrasena: string;
  rol: Rol;
  cargo_ocupa?: string;
  id_empresa?: string;
}

export interface ActualizarUsuario {
  rol?: Rol;
  cargo_ocupa?: string | null;
  id_empresa?: string | null;
  contrasena?: string;
}

// El servidor responde { error: string } en 400 y 409; sin mensaje se usa el generico.
const errorDelServidor = (error: unknown): Error => {
  const mensaje = isAxiosError<{ error?: unknown }>(error) ? error.response?.data?.error : undefined;
  return new Error(typeof mensaje === 'string' && mensaje !== '' ? mensaje : MENSAJE_GENERICO);
};

export const usersService = {
  list: async (incluirBajas: boolean): Promise<Usuario[]> => {
    try {
      const response = await authHttp.get<Usuario[]>('/users', {
        params: { incluir_bajas: incluirBajas },
      });
      return response.data;
    } catch (error: unknown) {
      throw errorDelServidor(error);
    }
  },

  create: async (datos: NuevoUsuario): Promise<void> => {
    try {
      await authHttp.post('/users', datos);
    } catch (error: unknown) {
      throw errorDelServidor(error);
    }
  },

  update: async (id: string, datos: ActualizarUsuario): Promise<void> => {
    try {
      await authHttp.patch(`/users/${id}`, datos);
    } catch (error: unknown) {
      throw errorDelServidor(error);
    }
  },

  remove: async (id: string): Promise<void> => {
    try {
      await authHttp.delete(`/users/${id}`);
    } catch (error: unknown) {
      throw errorDelServidor(error);
    }
  },
};
