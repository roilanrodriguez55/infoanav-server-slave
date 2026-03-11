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

  // CRUD de señales
  getSenales: async () => {
    const response = await api.get('/senales');
    return response.data;
  },

  getSenalById: async (id: string) => {
    const response = await api.get(`/senales/${id}`);
    return response.data;
  },

  createSenal: async (data: Partial<Senal>) => {
    const response = await api.post('/senales', data);
    return response.data;
  },

  updateSenal: async (id: string, data: Partial<Senal>) => {
    const response = await api.put(`/senales/${id}`, data);
    return response.data;
  },

  deleteSenal: async (id: string) => {
    const response = await api.delete(`/senales/${id}`);
    return response.data;
  },

  // Equipamientos
  addEquipamiento: async (senalId: string, equipamiento: Equipamiento) => {
    const response = await api.post(`/senales/${senalId}/equipamientos`, equipamiento);
    return response.data;
  },

  removeEquipamiento: async (senalId: string, equipamientoId: string) => {
    const response = await api.delete(`/senales/${senalId}/equipamientos/${equipamientoId}`);
    return response.data;
  }
};