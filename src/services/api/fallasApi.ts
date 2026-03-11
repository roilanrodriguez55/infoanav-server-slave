import api from '../config/axiosConfig';

export interface FallaData {
  fecha_falla: string;
  fecha_restablecer?: string;
  fecha_pronost_restablecer?: string;
  id_tipo_falla?: string;
  causa_de_falla?: string;
  medidas?: string;
  reporto?: string;
  rescatada?: boolean;
  observaciones?: string;
  duracion_de_falla?: string;
  diferencia_tiempo?: string;
  id_origen_falla?: string;
  transmite?: string;
  anar?: string;
  rg?: string;
}

export const fallasService = {
  // Obtener tipos de falla
  getTiposFalla: async () => {
    const response = await api.get('/fallas/tipos-falla');
    return response.data;
  },

  // Obtener orígenes de falla
  getOrigenesFalla: async () => {
    const response = await api.get('/fallas/origenes-falla');
    return response.data;
  },

  // Crear nueva falla
  create: async (data: FallaData) => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const response = await api.post('/fallas', {
      ...data,
      createby: user?.usuario || 'sistema'
    });
    return response.data;
  },

  // Obtener todas las fallas
  getAll: async (search?: string) => {
    const params = search ? { search } : {};
    const response = await api.get('/fallas', { params });
    return response.data;
  },

  // Obtener una falla por ID
  getById: async (id: string) => {
    const response = await api.get(`/fallas/${id}`);
    return response.data;
  },

  // Actualizar falla
  update: async (id: string, data: FallaData) => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const response = await api.put(`/fallas/${id}`, {
      ...data,
      updateby: user?.usuario || 'sistema'
    });
    return response.data;
  },

  // Eliminar falla
  delete: async (id: string) => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const response = await api.delete(`/fallas/${id}`, {
      data: { deleteby: user?.usuario || 'sistema' }
    });
    return response.data;
  },

  // Buscar fallas
  search: async (term: string) => {
    return fallasService.getAll(term);
  }
};