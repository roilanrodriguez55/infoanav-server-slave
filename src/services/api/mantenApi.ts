import api from '../config/axiosConfig';

export interface MantenimientoData {
  id_tipo_mant?: string;
  ident_mantenimiento?: string | null;
  fecha_inicio?: string | null;
  fecha_finalizacion?: string | null;
  tiempo_empleado?: number;
  aseguro?: string | null;
  id_estado_senal?: string;
  trabajo_realizado?: string;
  costo_mn?: number;
  costo_mlc?: number;
  diesel_lit?: number;
  gasolina_lit?: number;
  informa?: string | null;
  transmite?: string | null;
  rg?: string | null;
  orden?: string | null;
  introdujo?: string | null;
  // Campos de auditoría (opcionales para el tipo de datos)
  createby?: string;
  updateby?: string;
  deleteby?: string;
}

export const mantenimientosService = {
  // Obtener tipos de mantenimiento
  getTiposMantenimiento: async () => {
    try {
      const response = await api.get('/mantenimientos/tipos-mantenimiento');
      return response.data;
    } catch (error: any) {
      console.error('Error en getTiposMantenimiento:', error);
      return { success: false, message: error.message };
    }
  },

  // Obtener estados de señal
  getEstadosSenal: async () => {
    try {
      const response = await api.get('/mantenimientos/estados-senal');
      return response.data;
    } catch (error: any) {
      console.error('Error en getEstadosSenal:', error);
      return { success: false, message: error.message };
    }
  },

  // Obtener tipos de falla
  getTiposFalla: async () => {
    try {
      const response = await api.get('/mantenimientos/tipos-falla');
      return response.data;
    } catch (error: any) {
      console.error('Error en getTiposFalla:', error);
      return { success: false, message: error.message };
    }
  },

  // Crear nuevo mantenimiento
  create: async (data: MantenimientoData) => {
    try {
      // No necesitas incluir createby aquí porque ya viene en data
      const response = await api.post('/mantenimientos', data);
      return response.data;
    } catch (error: any) {
      console.error('Error en create:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  // Obtener todos los mantenimientos
  getAll: async () => {
    try {
      const response = await api.get('/mantenimientos');
      return response.data;
    } catch (error: any) {
      console.error('Error en getAll:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Obtener un mantenimiento por ID
  getById: async (id: string) => {
    try {
      console.log('🔍 Solicitando mantenimiento con ID:', id);
      const response = await api.get(`/mantenimientos/${id}`);
      console.log('✅ Respuesta recibida:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en getById:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Actualizar mantenimiento
  update: async (id: string, data: MantenimientoData) => {
    try {
      const response = await api.put(`/mantenimientos/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error en update:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Eliminar mantenimiento
  delete: async (id: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.delete(`/mantenimientos/${id}`, {
        data: { deleteby: user?.usuario || 'sistema' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error en delete:', error);
      return { success: false, message: error.message };
    }
  },

  // Buscar mantenimientos
  search: async (term: string) => {
    try {
      const response = await api.get(`/mantenimientos?search=${encodeURIComponent(term)}`);
      return response.data;
    } catch (error: any) {
      console.error('Error en search:', error);
      return { success: false, message: error.message };
    }
  }
};