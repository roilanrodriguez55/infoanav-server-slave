import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';

export interface FallaData {
  id_senal?: string;
  fecha_falla?: string | null;
  fecha_restablecer?: string | null;
  fecha_pronost_restablecer?: string | null;
  id_tipo_falla?: string | null;
  causa_de_falla?: string | null;
  medidas?: string | null;
  reporto?: string | null;
  rescatada?: boolean;
  observaciones?: string | null;
  duracion_de_falla?: string | null;
  diferencia_tiempo?: string | null;
  id_origen_falla?: string | null;
  transmite?: string | null;
  anar?: string | null;
  rg?: string | null;
}

export interface FallaResponse {
  success: boolean;
  message: string;
  data: unknown;
}

export type DatosRestablecer = Pick<
  FallaData,
  'fecha_restablecer' | 'medidas' | 'observaciones' | 'duracion_de_falla' | 'diferencia_tiempo'
>;

export const fallasService = {
  getAll: async (): Promise<FallaResponse> => {
    try {
      const response = await api.get('/fallas?deleted_at=is.null&select=*');
      return { success: true, message: 'Fallas obtenidas', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getById: async (id: string): Promise<FallaResponse> => {
    try {
      const response = await api.get(`/fallas?id_falla=eq.${id}&deleted_at=is.null&select=*`);
      return { success: true, message: 'Falla obtenida', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  create: async (data: FallaData): Promise<FallaResponse> => {
    try {
      const response = await api.post('/fallas', {
        ...data,
        created_at: new Date().toISOString(),
      }, {
        headers: { 'Prefer': 'return=representation' },
      });
      return { success: true, message: 'Falla creada', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error en create:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  update: async (id: string, data: FallaData): Promise<FallaResponse> => {
    try {
      const response = await api.patch(
        `/fallas?id_falla=eq.${id}`,
        {
          ...data,
          updated_at: new Date().toISOString(),
        },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Falla actualizada', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error en update:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  restablecer: (id: string, datos: DatosRestablecer): Promise<FallaResponse> =>
    fallasService.update(id, datos),

  getAbiertasPorSenal: async (idSenal: string, excluirIdFalla?: string): Promise<FallaResponse> => {
    try {
      const excluir = excluirIdFalla ? `&id_falla=neq.${excluirIdFalla}` : '';
      const response = await api.get(
        `/fallas?id_senal=eq.${idSenal}&fecha_restablecer=is.null&deleted_at=is.null&select=id_falla${excluir}`
      );
      return { success: true, message: 'Fallas abiertas obtenidas', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getSenalResumen: async (idSenal: string): Promise<FallaResponse> => {
    try {
      const response = await api.get(
        `/senales?id_senal=eq.${idSenal}&deleted_at=is.null&select=id_senal,codigo_lsm,nombre,luminica,fecha_retirada,empresa:empresas(nombre),zona:zonas(nombre),estacion:estaciones(nombre),tipo:tipos_senal(nombre),modelo:modelos_senal(nombre),categoria:categorias(nombre)`
      );
      return { success: true, message: 'Senal obtenida', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  delete: async (id: string): Promise<FallaResponse> => {
    try {
      await api.patch(
        `/fallas?id_falla=eq.${id}`,
        {
          deleted_at: new Date().toISOString(),
        },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Falla eliminada', data: null };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getTiposFalla: async (): Promise<FallaResponse> => {
    try {
      const response = await api.get('/tipos_falla?select=id_tipo_falla,nombre');
      return { success: true, message: 'Tipos de falla obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getOrigenesFalla: async (): Promise<FallaResponse> => {
    try {
      const response = await api.get('/origenes_falla?select=id_origen_falla,nombre');
      return { success: true, message: 'Origenes de falla obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },
};