import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';
import { buildQuery, parseContentRange, type Filter } from '@/lib/postgrest';
import { aTextoLocal, inicioDelDia } from '@/lib/planMantenimiento';

export interface PlanMantenimiento {
  id_plan_mantenimiento: string;
  id_senal: string;
  id_tipo_mant: string | null;
  fecha_plan: string | null;
  trabajo_medios: string | null;
  observaciones: string | null;
  fecha_cumplida: string | null;
  id_mantenimiento: string | null;
}

export interface PlanMantenimientoData {
  id_senal?: string;
  id_tipo_mant?: string | null;
  fecha_plan?: string | null;
  trabajo_medios?: string | null;
  observaciones?: string | null;
  fecha_cumplida?: string | null;
  id_mantenimiento?: string | null;
}

export interface PlanMantenimientoResponse {
  success: boolean;
  message: string;
  data: unknown;
}

export const planMantService = {
  list: async (filters: Filter[] = [], order?: { column: string; dir: 'asc' | 'desc' }): Promise<PlanMantenimientoResponse> => {
    try {
      const query = buildQuery({ select: '*', page: 1, pageSize: 1000, order, filters });
      const response = await api.get(`/plan_mantenimiento?${query}`);
      return { success: true, message: 'Planes obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getById: async (id: string): Promise<PlanMantenimientoResponse> => {
    try {
      const response = await api.get(`/plan_mantenimiento?id_plan_mantenimiento=eq.${id}&deleted_at=is.null&select=*`);
      return { success: true, message: 'Plan obtenido', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  create: async (data: PlanMantenimientoData): Promise<PlanMantenimientoResponse> => {
    try {
      const response = await api.post('/plan_mantenimiento', {
        ...data,
        created_at: new Date().toISOString(),
      }, {
        headers: { 'Prefer': 'return=representation' },
      });
      return { success: true, message: 'Plan creado', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  update: async (id: string, data: PlanMantenimientoData): Promise<PlanMantenimientoResponse> => {
    try {
      const response = await api.patch(
        `/plan_mantenimiento?id_plan_mantenimiento=eq.${id}`,
        {
          ...data,
          updated_at: new Date().toISOString(),
        },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Plan actualizado', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  delete: async (id: string): Promise<PlanMantenimientoResponse> => {
    try {
      await api.patch(
        `/plan_mantenimiento?id_plan_mantenimiento=eq.${id}`,
        { deleted_at: new Date().toISOString() },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Plan eliminado', data: null };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },
};

// Planes sin cumplir con fecha_plan anterior a hoy. Mismo criterio que el filtro 'vencidos' de ListaPlan.
export async function contarPlanesVencidos(): Promise<number> {
  const query = buildQuery({
    select: 'id_plan_mantenimiento',
    page: 1,
    pageSize: 1,
    filters: [
      { column: 'fecha_cumplida', op: 'is', value: 'null' },
      { column: 'fecha_plan', op: 'lt', value: aTextoLocal(inicioDelDia()) },
    ],
  });
  const response = await api.get<unknown>(`/plan_mantenimiento?${query}`, { headers: { Prefer: 'count=exact' } });
  const cabecera = response.headers['content-range'] as string | undefined;
  return parseContentRange(cabecera).total ?? 0;
}
