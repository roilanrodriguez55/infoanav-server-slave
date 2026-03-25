import api from '../config/axiosConfig';
import { Senal, CatalogoItem, Equipamiento } from '../../types/senales.types';

const BASE_URL = '/api';

export const senalesService = {
  // Obtener todos los catálogos
  getCatalogos: async () => {
    try {
      const [
        tipos,
        categorias,
        modelos,
        empresas,
        estaciones,
        usuariosNavegacion,
        zonas,
        estados,
        materiales,
        energias,
        colores,
        formas,
        mares,
        coloresLuz,
        marcasTope,
        caracteristicas,
        tiposEquipamiento
      ] = await Promise.all([
        api.get('/tipos-senal'),
        api.get('/categorias'),
        api.get('/modelos-senal'),
        api.get('/empresas'),
        api.get('/estaciones'),
        api.get('/usuarios-navegacion'),
        api.get('/zonas'),
        api.get('/estados'),
        api.get('/materiales'),
        api.get('/energias'),
        api.get('/colores'),
        api.get('/formas'),
        api.get('/mares'),
        api.get('/colores-luz'),
        api.get('/marcas-tope'),
        api.get('/caracteristicas'),
        api.get('/tipos-equipamiento')
      ]);

      return {
        tipos: tipos.data,
        categorias: categorias.data,
        modelos: modelos.data,
        empresas: empresas.data,
        estaciones: estaciones.data,
        usuariosNavegacion: usuariosNavegacion.data,
        zonas: zonas.data,
        estados: estados.data,
        materiales: materiales.data,
        energias: energias.data,
        colores: colores.data,
        formas: formas.data,
        mares: mares.data,
        coloresLuz: coloresLuz.data,
        marcasTope: marcasTope.data,
        caracteristicas: caracteristicas.data,
        tiposEquipamiento: tiposEquipamiento.data
      };
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      throw error;
    }
  },

  // Obtener todas las señales
  getSenales: async () => {
    try {
      const response = await api.get('/senales');
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo señales:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Obtener una señal por ID
  getSenalById: async (id: string) => {
    try {
      const response = await api.get(`/senales/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo señal:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Crear nueva señal
  createSenal: async (data: any) => {
  try {
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const dataToSend = {
      ...data,
      createat: new Date().toISOString(),
      createby: user?.usuario || 'sistema'
    };
    
    console.log('📤 Enviando datos de señal:', JSON.stringify(dataToSend, null, 2));
    const response = await api.post('/senales', dataToSend);
    console.log('📥 Respuesta:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creando señal:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Full error:', error);
    
    // Devolver el mensaje específico del servidor si existe
    return { 
      success: false, 
      message: error.response?.data?.message || error.response?.data?.error || error.message 
    };
  }
},

  // Actualizar señal
  updateSenal: async (id: string, data: any) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const dataToSend = {
        ...data,
        updateat: new Date().toISOString(),
        updateby: user?.usuario || 'sistema'
      };
      
      console.log('📤 Actualizando señal:', JSON.stringify(dataToSend, null, 2));
      const response = await api.put(`/senales/${id}`, dataToSend);
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando señal:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Eliminar señal (soft delete)
  deleteSenal: async (id: string) => {
    try {
      const userStr = localStorage.getItem('usuario');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const response = await api.delete(`/senales/${id}`, {
        data: { 
          deleteat: new Date().toISOString(),
          deleteby: user?.usuario || 'sistema' 
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error eliminando señal:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message 
      };
    }
  },

  // Equipamientos
  addEquipamiento: async (senalId: string, equipamiento: Equipamiento) => {
    try {
      const response = await api.post(`/senales/${senalId}/equipamientos`, equipamiento);
      return response.data;
    } catch (error: any) {
      console.error('Error agregando equipamiento:', error);
      return { success: false, message: error.message };
    }
  },

  getEquipamientos: async (senalId: string) => {
    try {
      const response = await api.get(`/senales/${senalId}/equipamientos`);
      return response.data;
    } catch (error: any) {
      console.error('Error obteniendo equipamientos:', error);
      return { success: false, message: error.message };
    }
  },

  updateEquipamiento: async (senalId: string, equipamientoId: string, data: any) => {
    try {
      const response = await api.put(`/senales/${senalId}/equipamientos/${equipamientoId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error actualizando equipamiento:', error);
      return { success: false, message: error.message };
    }
  },

  removeEquipamiento: async (senalId: string, equipamientoId: string) => {
    try {
      const response = await api.delete(`/senales/${senalId}/equipamientos/${equipamientoId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error eliminando equipamiento:', error);
      return { success: false, message: error.message };
    }
  }
};