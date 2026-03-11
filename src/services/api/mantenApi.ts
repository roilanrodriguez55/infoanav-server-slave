import api from '../config/axiosConfig';

export interface MantenimientoData {
  id_tipo_mant?: string;
  ident_mantenimiento?: string;
  fecha_inicio?: string;
  fecha_finalizacion?: string;
  tiempo_empleado?: number;
  aseguro?: string;
  id_estado_senal?: string;
  trabajo_realizado?: string;
  costo_mn?: number;
  costo_mlc?: number;
  diesel_lit?: number;
  gasolina_lit?: number;
  informa?: string;
  transmite?: string;
  rg?: string;
  orden?: string;
  introdujo?: string;
}

export const mantenimientosService = {
  // Obtener tipos de mantenimiento
  getTiposMantenimiento: async () => {
    const response = await api.get('/mantenimientos/tipos-mantenimiento');
    return response.data;
  },

  // Obtener estados de señal
  getEstadosSenal: async () => {
    const response = await api.get('/mantenimientos/estados-senal');
    return response.data;
  },

  // Obtener tipos de falla (para cargar datos)
  getTiposFalla: async () => {
    const response = await api.get('/mantenimientos/tipos-falla');
    return response.data;
  },

  // Crear nuevo mantenimiento
  create: async (data: MantenimientoData) => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const response = await api.post('/mantenimientos', {
      ...data,
      createby: user?.usuario || 'sistema'
    });
    return response.data;
  },

  // Obtener todos los mantenimientos
  getAll: async (search?: string) => {
    const params = search ? { search } : {};
    const response = await api.get('/mantenimientos', { params });
    return response.data;
  },

  // Obtener un mantenimiento por ID
  getById: async (id: string) => {
    const response = await api.get(`/mantenimientos/${id}`);
    return response.data;
  },

  // Actualizar mantenimiento
  update: async (id: string, data: MantenimientoData) => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const response = await api.put(`/mantenimientos/${id}`, {
      ...data,
      updateby: user?.usuario || 'sistema'
    });
    return response.data;
  },

  // Eliminar mantenimiento
  delete: async (id: string) => {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const response = await api.delete(`/mantenimientos/${id}`, {
      data: { deleteby: user?.usuario || 'sistema' }
    });
    return response.data;
  },

  // Buscar mantenimientos
  search: async (term: string) => {
    return mantenimientosService.getAll(term);
  }
};