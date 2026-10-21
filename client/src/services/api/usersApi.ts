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
  updated_at: string | null;
}

// Solo viene cuando el usuario guardado es administrador nuevo o recien promovido.
export interface RespuestaGuardado {
  codigo_recuperacion?: string;
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
  list: async (): Promise<Usuario[]> => {
    try {
      const response = await authHttp.get<Usuario[]>('/users');
      return response.data;
    } catch (error: unknown) {
      throw errorDelServidor(error);
    }
  },

  create: async (datos: NuevoUsuario): Promise<RespuestaGuardado> => {
    try {
      const response = await authHttp.post<RespuestaGuardado>('/users', datos);
      return response.data;
    } catch (error: unknown) {
      throw errorDelServidor(error);
    }
  },

  update: async (id: string, datos: ActualizarUsuario): Promise<RespuestaGuardado> => {
    try {
      const response = await authHttp.patch<RespuestaGuardado>(`/users/${id}`, datos);
      return response.data;
    } catch (error: unknown) {
      throw errorDelServidor(error);
    }
  },

  regenerarCodigo: async (id: string): Promise<string> => {
    try {
      const response = await authHttp.post<{ codigo_recuperacion: string }>(`/users/${id}/codigo-recuperacion`);
      return response.data.codigo_recuperacion;
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
