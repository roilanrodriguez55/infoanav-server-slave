import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';

export interface CatalogoItem {
  id: string;
  nombre: string;
}

export interface TipoEquipamiento {
  id_tipo_equipamiento: string;
  nombre: string;
}

export interface CatalogosResponse {
  tipos: CatalogoItem[];
  categorias: CatalogoItem[];
  modelos: CatalogoItem[];
  empresas: CatalogoItem[];
  estaciones: CatalogoItem[];
  usuariosNavegacion: CatalogoItem[];
  zonas: CatalogoItem[];
  estados: CatalogoItem[];
  materiales: CatalogoItem[];
  energias: CatalogoItem[];
  colores: CatalogoItem[];
  formas: CatalogoItem[];
  mares: CatalogoItem[];
  coloresLuz: CatalogoItem[];
  marcasTope: CatalogoItem[];
  caracteristicas: CatalogoItem[];
  tiposEquipamiento: TipoEquipamiento[];
}

export interface SenalResponse {
  success: boolean;
  message: string;
  data: unknown;
}

export const senalesService = {
  getCatalogos: async (): Promise<CatalogosResponse> => {
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
        tiposEquipamiento,
      ] = await Promise.all([
        api.get('/tipos_senal?select=id_tipo,nombre'),
        api.get('/categorias?select=id_categoria,nombre'),
        api.get('/modelos_senal?select=id_modelo,nombre'),
        api.get('/empresas?select=id_empresa,nombre'),
        api.get('/estaciones?select=id_estacion,nombre'),
        api.get('/usuarios_navegacion?select=id_usuario_navegacion,nombre'),
        api.get('/zonas?select=id_zona,nombre'),
        api.get('/estados?select=id_estado,nombre'),
        api.get('/materiales?select=id_material,nombre'),
        api.get('/energias?select=id_energia,nombre'),
        api.get('/colores?select=id_color,nombre'),
        api.get('/formas?select=id_forma,nombre'),
        api.get('/mares?select=id_mar,nombre'),
        api.get('/colores_luz?select=id_colorluz,nombre'),
        api.get('/marcas_tope?select=id_marca_tope,nombre'),
        api.get('/caracteristicas?select=id_caracteristica,nombre'),
        api.get('/tipos_equipamiento?select=id_tipo_equipamiento,nombre'),
      ]);

      return {
        tipos: tipos.data.map((t: Record<string, unknown>) => ({ id: t.id_tipo, nombre: t.nombre })),
        categorias: categorias.data.map((c: Record<string, unknown>) => ({ id: c.id_categoria, nombre: c.nombre })),
        modelos: modelos.data.map((m: Record<string, unknown>) => ({ id: m.id_modelo, nombre: m.nombre })),
        empresas: empresas.data.map((e: Record<string, unknown>) => ({ id: e.id_empresa, nombre: e.nombre })),
        estaciones: estaciones.data.map((e: Record<string, unknown>) => ({ id: e.id_estacion, nombre: e.nombre })),
        usuariosNavegacion: usuariosNavegacion.data.map((u: Record<string, unknown>) => ({ id: u.id_usuario_navegacion, nombre: u.nombre })),
        zonas: zonas.data.map((z: Record<string, unknown>) => ({ id: z.id_zona, nombre: z.nombre })),
        estados: estados.data.map((e: Record<string, unknown>) => ({ id: e.id_estado, nombre: e.nombre })),
        materiales: materiales.data.map((m: Record<string, unknown>) => ({ id: m.id_material, nombre: m.nombre })),
        energias: energias.data.map((e: Record<string, unknown>) => ({ id: e.id_energia, nombre: e.nombre })),
        colores: colores.data.map((c: Record<string, unknown>) => ({ id: c.id_color, nombre: c.nombre })),
        formas: formas.data.map((f: Record<string, unknown>) => ({ id: f.id_forma, nombre: f.nombre })),
        mares: mares.data.map((m: Record<string, unknown>) => ({ id: m.id_mar, nombre: m.nombre })),
        coloresLuz: coloresLuz.data.map((c: Record<string, unknown>) => ({ id: c.id_colorluz, nombre: c.nombre })),
        marcasTope: marcasTope.data.map((m: Record<string, unknown>) => ({ id: m.id_marca_tope, nombre: m.nombre })),
        caracteristicas: caracteristicas.data.map((c: Record<string, unknown>) => ({ id: c.id_caracteristica, nombre: c.nombre })),
        tiposEquipamiento: tiposEquipamiento.data.map((t: Record<string, unknown>) => ({ id_tipo_equipamiento: t.id_tipo_equipamiento as string, nombre: t.nombre as string })),
      };
    } catch (error) {
      console.error('Error cargando catalogos:', error);
      throw error;
    }
  },

  getSenales: async (): Promise<SenalResponse> => {
    try {
      const response = await api.get('/senales?deleted_at=is.null&select=*');
      return { success: true, message: 'Senales obtenidas', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error obteniendo senales:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getSenalById: async (id: string): Promise<SenalResponse> => {
    try {
      const response = await api.get(`/senales?id_senal=eq.${id}&deleted_at=is.null&select=*`);
      return { success: true, message: 'Senal obtenida', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error obteniendo senal:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  createSenal: async (data: unknown): Promise<SenalResponse> => {
    try {
      const dataToSend = {
        ...(data as object),
        created_at: new Date().toISOString(),
      };
      const response = await api.post('/senales', dataToSend, {
        headers: { 'Prefer': 'return=representation' },
      });
      return { success: true, message: 'Senal creada', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string; hint?: string }>;
      console.error('Error creando senal:', axiosError.response?.data);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  updateSenal: async (id: string, data: unknown): Promise<SenalResponse> => {
    try {
      const dataToSend = {
        ...(data as object),
        updated_at: new Date().toISOString(),
      };
      const response = await api.patch(
        `/senales?id_senal=eq.${id}`,
        dataToSend,
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Senal actualizada', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error actualizando senal:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  deleteSenal: async (id: string): Promise<SenalResponse> => {
    try {
      await api.patch(
        `/senales?id_senal=eq.${id}`,
        { deleted_at: new Date().toISOString() },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Senal eliminada', data: null };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error('Error eliminando senal:', axiosError);
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  getEquipamientos: async (senalId: string): Promise<SenalResponse> => {
    try {
      const response = await api.get(`/equipamientos_senal?id_senal=eq.${senalId}&deleted_at=is.null&select=*`);
      return { success: true, message: 'Equipamientos obtenidos', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  addEquipamiento: async (senalId: string, equipamiento: unknown): Promise<SenalResponse> => {
    try {
      const response = await api.post('/equipamientos_senal', {
        ...(equipamiento as object),
        id_senal: senalId,
        created_at: new Date().toISOString(),
      }, {
        headers: { 'Prefer': 'return=representation' },
      });
      return { success: true, message: 'Equipamiento agregado', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  updateEquipamiento: async (equipamientoId: string, data: unknown): Promise<SenalResponse> => {
    try {
      const response = await api.patch(
        `/equipamientos_senal?id_equipamiento=eq.${equipamientoId}`,
        { ...(data as object), updated_at: new Date().toISOString() },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Equipamiento actualizado', data: response.data };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },

  removeEquipamiento: async (equipamientoId: string): Promise<SenalResponse> => {
    try {
      await api.patch(
        `/equipamientos_senal?id_equipamiento=eq.${equipamientoId}`,
        { deleted_at: new Date().toISOString() },
        { headers: { 'Prefer': 'return=representation' } }
      );
      return { success: true, message: 'Equipamiento eliminado', data: null };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      return { success: false, message: axiosError.response?.data?.message ?? axiosError.message, data: null };
    }
  },
};