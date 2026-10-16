import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';

export const ESTADISTICAS_VISTA_PATH = '/v_senales_estadisticas';

// Tamaño de lote al leer la vista; PostgREST puede limitar filas por respuesta.
const LOTE = 1000;

export interface SenalEstadistica {
  id_senal: string;
  codigo_lsm: string;
  nombre: string | null;
  id_empresa: string | null;
  empresa: string | null;
  id_estacion: string | null;
  estacion: string | null;
  id_tipo: string | null;
  tipo: string | null;
  id_categoria: string | null;
  categoria: string | null;
  id_complejidad: string | null;
  complejidad: string | null;
  id_usuario_navegacion: string | null;
  usuario_navegacion: string | null;
  id_caracteristica: string | null;
  caracteristica: string | null;
  id_colorluz: string | null;
  color_luz: string | null;
  id_color: string | null;
  color: string | null;
  id_modelo: string | null;
  modelo: string | null;
  id_forma: string | null;
  forma: string | null;
  id_material: string | null;
  material: string | null;
  altura: number | null;
  elevacion: number | null;
  profundidad: number | null;
  luminica: boolean;
  baja: boolean;
}

export interface EstadisticasResponse {
  success: boolean;
  message: string;
  data: SenalEstadistica[] | null;
}

export const estadisticasService = {
  // Lee la vista completa por lotes hasta una respuesta vacia; el orden por id_senal hace estable la paginacion.
  listar: async (): Promise<EstadisticasResponse> => {
    try {
      const filas: SenalEstadistica[] = [];
      for (let desplazamiento = 0; ; desplazamiento += LOTE) {
        const response = await api.get<SenalEstadistica[]>(
          `${ESTADISTICAS_VISTA_PATH}?select=*&order=id_senal.asc&limit=${LOTE}&offset=${desplazamiento}`,
        );
        if (response.data.length === 0) break;
        filas.push(...response.data);
      }
      return { success: true, message: 'Estadisticas obtenidas', data: filas };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },
};
