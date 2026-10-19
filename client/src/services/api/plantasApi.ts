import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';
import type { CatalogoItem } from './senalesApi';

export const PLANTAS_PATH = '/plantas';
export const PLANTAS_FALLAS_PATH = '/plantas_fallas';
export const PLANTAS_SELECT = '*,senal:senales(codigo_lsm,nombre),empresa:empresas(nombre)';

export interface PlantaCampos {
  marca: string | null;
  modelo: string | null;
  potencia: string | null;
  numero: string | null;
  id_senal: string | null;
  faro_texto: string | null;
  inventario: string | null;
  consumo: string | null;
  voltaje: string | null;
  frecuencia: string | null;
  serie: string | null;
  id_empresa: string | null;
  observaciones: string | null;
}

export interface PlantaRegistro extends PlantaCampos {
  id_planta: string;
  senal: { codigo_lsm: string; nombre: string | null } | null;
  empresa: { nombre: string } | null;
}

// Valores del formulario: todo texto; la conversion a null ocurre en plantaACampos.
export type PlantaTexto = Record<keyof PlantaCampos, string>;

export interface PlantaFalla {
  id_planta_falla: string;
  id_planta: string;
  fecha_fs: string | null;
  fecha_restablecimiento: string | null;
  causa: string | null;
}

export interface PlantaResponse {
  success: boolean;
  message: string;
}

const textoONulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());
const aTexto = (valor: string | null | undefined): string => valor ?? '';

export const PLANTA_VACIA: PlantaTexto = {
  marca: '',
  modelo: '',
  potencia: '',
  numero: '',
  id_senal: '',
  faro_texto: '',
  inventario: '',
  consumo: '',
  voltaje: '',
  frecuencia: '',
  serie: '',
  id_empresa: '',
  observaciones: '',
};

export const plantaATexto = (planta: PlantaRegistro): PlantaTexto => ({
  marca: aTexto(planta.marca),
  modelo: aTexto(planta.modelo),
  potencia: aTexto(planta.potencia),
  numero: aTexto(planta.numero),
  id_senal: aTexto(planta.id_senal),
  faro_texto: aTexto(planta.faro_texto),
  inventario: aTexto(planta.inventario),
  consumo: aTexto(planta.consumo),
  voltaje: aTexto(planta.voltaje),
  frecuencia: aTexto(planta.frecuencia),
  serie: aTexto(planta.serie),
  id_empresa: aTexto(planta.id_empresa),
  observaciones: aTexto(planta.observaciones),
});

export const plantaACampos = (texto: PlantaTexto): PlantaCampos => ({
  marca: textoONulo(texto.marca),
  modelo: textoONulo(texto.modelo),
  potencia: textoONulo(texto.potencia),
  numero: textoONulo(texto.numero),
  id_senal: textoONulo(texto.id_senal),
  faro_texto: textoONulo(texto.faro_texto),
  inventario: textoONulo(texto.inventario),
  consumo: textoONulo(texto.consumo),
  voltaje: textoONulo(texto.voltaje),
  frecuencia: textoONulo(texto.frecuencia),
  serie: textoONulo(texto.serie),
  id_empresa: textoONulo(texto.id_empresa),
  observaciones: textoONulo(texto.observaciones),
});

const mensajeError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message;
};

export const getEmpresas = async (): Promise<CatalogoItem[]> => {
  const response = await api.get<Record<string, string>[]>(
    '/empresas?select=id_empresa,nombre&deleted_at=is.null&order=nombre.asc'
  );
  return response.data.map((fila) => ({ id: fila.id_empresa, nombre: fila.nombre }));
};

export const plantasService = {
  listFallas: async (idPlanta: string): Promise<PlantaFalla[]> => {
    const response = await api.get<PlantaFalla[]>(
      `${PLANTAS_FALLAS_PATH}?id_planta=eq.${idPlanta}&deleted_at=is.null&select=*&order=fecha_fs.desc`
    );
    return response.data;
  },

  create: async (campos: PlantaCampos): Promise<PlantaResponse> => {
    try {
      await api.post(PLANTAS_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
      return { success: true, message: 'Planta creada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  update: async (id: string, campos: PlantaCampos): Promise<PlantaResponse> => {
    try {
      await api.patch(
        `${PLANTAS_PATH}?id_planta=eq.${id}`,
        { ...campos, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Planta actualizada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  delete: async (id: string): Promise<PlantaResponse> => {
    try {
      await api.patch(
        `${PLANTAS_PATH}?id_planta=eq.${id}`,
        { deleted_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Planta eliminada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  // fecha_fs en hora local sin zona (columna timestamp sin zona).
  registrarFalla: async (idPlanta: string, fechaFs: string | null, causa: string): Promise<PlantaResponse> => {
    try {
      await api.post(PLANTAS_FALLAS_PATH, {
        id_planta: idPlanta,
        fecha_fs: fechaFs,
        causa: textoONulo(causa),
        created_at: new Date().toISOString(),
      }, {
        headers: { Prefer: 'return=representation' },
      });
      return { success: true, message: 'Falla registrada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  restablecerFalla: async (idPlantaFalla: string, fechaRestablecimiento: string): Promise<PlantaResponse> => {
    try {
      await api.patch(
        `${PLANTAS_FALLAS_PATH}?id_planta_falla=eq.${idPlantaFalla}`,
        { fecha_restablecimiento: fechaRestablecimiento, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Planta restablecida' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },
};
