import api from '@/services/config/axiosConfig';

export interface DashboardStats {
  senales_total: number;
  senales_operativas: number;
  fuera_servicio: number;
  fallas_abiertas: number;
  mant_proximos: number;
}

export interface FaultAnalytics {
  semana: string;
  total_fallas: number;
  tiempo_medio_resolucion: string;
}

export interface StatusByZone {
  nombre_zona: string;
  conteo_senales: number;
  estado_critico: number;
}

export const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await api.post('/rpc/get_dashboard_stats');
      const raw = response.data as DashboardStats | DashboardStats[] | null | undefined;
      const payload: DashboardStats | null =
        Array.isArray(raw) && raw.length > 0 ? raw[0] : (raw as DashboardStats | null);
      return (
        payload ?? {
          senales_total: 0,
          senales_operativas: 0,
          fuera_servicio: 0,
          fallas_abiertas: 0,
          mant_proximos: 0,
        }
      );
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getFaultAnalytics: async (mes: number, anio: number): Promise<FaultAnalytics[]> => {
    try {
      const response = await api.post<FaultAnalytics[]>('/rpc/get_fault_analytics', {
        p_mes: mes,
        p_anio: anio,
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching fault analytics:', error);
      throw error;
    }
  },

  getStatusByZone: async (): Promise<StatusByZone[]> => {
    try {
      const response = await api.post<StatusByZone[]>('/rpc/get_status_by_zone');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching status by zone:', error);
      throw error;
    }
  },
};
