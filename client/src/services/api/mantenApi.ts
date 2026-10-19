import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';

export interface MantenimientoData {
  id_senal?: string;
  id_tipo_mant?: string | null;
  ident_mantenimiento?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  tiempo_empleado?: string | null;
  aseguro?: string | null;
  id_estado_senal?: string | null;
  id_buque?: string | null;
  vehiculo?: string | null;
  trabajo_realizado?: string | null;
  costo_mn?: number;
  costo_mlc?: number;
  diesel_lit?: number;
  gasolina_lit?: number;
  informa?: string | null;
  transmite?: string | null;
  rg?: string | null;
  orden?: string | null;
  introdujo?: string | null;
}

export interface MantenimientoResponse {
  success: boolean;
  message: string;
  data: unknown;
}

export const mantenimientosService = {
  getAll: async (): Promise<MantenimientoResponse> => {
    try {
      const response = await api.get('/mantenimientos?deleted_at=is.null&select=*');
      return { success: true, message: 'Mantenimientos obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getById: async (id: string): Promise<MantenimientoResponse> => {
    try {
      const response = await api.get(`/mantenimientos?id_mantenimiento=eq.${id}&deleted_at=is.null&select=*`);
      return { success: true, message: 'Mantenimiento obtenido', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getBySenal: async (idSenal: string): Promise<MantenimientoResponse> => {
    try {
      const response = await api.get(`/mantenimientos?id_senal=eq.${idSenal}&deleted_at=is.null&select=*&order=fecha_inicio.desc`);
      return { success: true, message: 'Mantenimientos de la señal obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  create: async (data: MantenimientoData): Promise<MantenimientoResponse> => {
    try {
      const response = await api.post('/mantenimientos', {
        ...data,
        created_at: new Date().toISOString(),
      }, {
        headers: { 'Prefer': 'return=representation' },
      });
      return { success: true, message: 'Mantenimiento creado', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error en create:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  update: async (id: string, data: MantenimientoData): Promise<MantenimientoResponse> => {
    try {
      const response = await api.patch(
        `/mantenimientos?id_mantenimiento=eq.${id}`,
        {
          ...data,
          updated_at: new Date().toISOString(),
        },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Mantenimiento actualizado', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error en update:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  delete: async (id: string): Promise<MantenimientoResponse> => {
    try {
      await api.patch(
        `/mantenimientos?id_mantenimiento=eq.${id}`,
        {
          deleted_at: new Date().toISOString(),
        },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Mantenimiento eliminado', data: null };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getTiposMantenimiento: async (): Promise<MantenimientoResponse> => {
    try {
      const response = await api.get('/tipos_mantenimiento?select=id_tipo_mant,nombre');
      return { success: true, message: 'Tipos de mantenimiento obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getEstadosSenal: async (): Promise<MantenimientoResponse> => {
    try {
      const response = await api.get('/estados_senal?select=id_estado_senal,nombre');
      return { success: true, message: 'Estados de senal obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },
};
