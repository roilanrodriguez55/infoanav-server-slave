import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';

export interface CambioCampo {
  antes: unknown;
  despues: unknown;
}

export interface RegistroHistorial {
  id_historial: string;
  tabla: string;
  id_registro: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  usuario: string | null;
  fecha: string;
  cambios: Record<string, CambioCampo> | null;
}

export const historialService = {
  getByRegistro: async (tabla: string, idRegistro: string, limit = 50): Promise<RegistroHistorial[]> => {
    try {
      const response = await api.get<RegistroHistorial[]>(
        `/historial_cambios?tabla=eq.${encodeURIComponent(tabla)}&id_registro=eq.${encodeURIComponent(idRegistro)}&order=fecha.desc&limit=${limit}`
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const detalle = axiosError.response?.data?.message ?? axiosError.message;
      throw new Error(`No se pudo cargar el historial de cambios: ${detalle}`);
    }
  },
};
