import api from '../config/axiosConfig';

export interface FallaData {
  fecha_falla: string;
  fecha_restablecer?: string | null;
  fecha_pronost_restablecer?: string | null;
  id_tipo_falla?: string | null;
  causa_de_falla?: string;
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
  // Campos de auditoría
  createby?: string;
  updateby?: string;
  deleteby?: string;
}

export const fallasService = {
  // Obtener tipos de falla
  getTiposFalla: async () => {
    try {
      const response = await api.get('/fallas/tipos-falla');
      return response.data;
    } catch (error: any) {
      console.error('Error en getTiposFalla:', error);
      return { success: false, message: error.message };
    }
  },

  // Obtener orígenes de falla
  getOrigenesFalla: async () => {
    try {
      const response = await api.get('/fallas/origenes-falla');
      return response.data;
    } catch (error: any) {
      console.error('Error en getOrigenesFalla:', error);
      return { success: false, message: error.message };
    }
  },

  // Crear nueva falla
  create: async (data: FallaData) => {
    try {
      const response = await api.post('/fallas', data);
      return response.data;
    } catch (error: any) {
      console.error('Error en create:', error);
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  // Obtener todas las fallas
  getAll: async () => {
    try {
      const response = await api.get('/fallas');
      return response.data;
    } catch (error: any) {
      console.error('Error en getAll:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Obtener una falla por ID
  getById: async (id: string) => {
    try {
      console.log('🔍 Solicitando falla con ID:', id);
      const response = await api.get(`/fallas/${id}`);
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

  // Actualizar falla
  update: async (id: string, data: FallaData) => {
    try {
      console.log('📤 Enviando update para ID:', id);
      console.log('📦 Datos:', data);
      const response = await api.put(`/fallas/${id}`, data);
      console.log('📥 Respuesta:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error en update:', error);
      console.error('Detalles:', error.response?.data);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Eliminar falla
  delete: async (id: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.delete(`/fallas/${id}`, {
        data: { deleteby: user?.usuario || 'sistema' }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error en delete:', error);
      return { success: false, message: error.message };
    }
  },

  // Buscar fallas
  searchFallas: async (term: string) => {
    try {
      const response = await api.get(`/fallas?search=${encodeURIComponent(term)}`);
      return response.data;
    } catch (error: any) {
      console.error('Error en search:', error);
      return { success: false, message: error.message };
    }
  }
};