import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';

export const PRONOSTICO_PATH = '/pronosticos_senal';

export interface PronosticoCampos {
  id_senal: string;
  disponibilidad_deseada: string | null;
  criterios_bateria: string | null;
  panel: string | null;
  destellador_bombillo: string | null;
  tmef_1: string | null;
  tmef_2: string | null;
  tmef_3: string | null;
  tmef_senal: string | null;
  tmpr_pronosticado: string | null;
  tmrf: string | null;
  tmpr_real: string | null;
  disponibilidad_pronosticada: string | null;
  tiempo_informacion: string | null;
  tiempo_preparacion: string | null;
  tiempo_travesia: string | null;
  tiempo_reposicion: string | null;
}

export interface PronosticoRegistro extends PronosticoCampos {
  id_pronostico: string;
}

// Valores del formulario: todo texto; la conversion a null ocurre en pronosticoACampos.
export type PronosticoTexto = Record<Exclude<keyof PronosticoCampos, 'id_senal'>, string>;

export interface PronosticoResponse {
  success: boolean;
  message: string;
  registro: PronosticoRegistro | null;
}

const textoONulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());
const aTexto = (valor: string | null | undefined): string => valor ?? '';

export const PRONOSTICO_VACIO: PronosticoTexto = {
  disponibilidad_deseada: '',
  criterios_bateria: '',
  panel: '',
  destellador_bombillo: '',
  tmef_1: '',
  tmef_2: '',
  tmef_3: '',
  tmef_senal: '',
  tmpr_pronosticado: '',
  tmrf: '',
  tmpr_real: '',
  disponibilidad_pronosticada: '',
  tiempo_informacion: '',
  tiempo_preparacion: '',
  tiempo_travesia: '',
  tiempo_reposicion: '',
};

export const pronosticoATexto = (registro: PronosticoRegistro): PronosticoTexto => ({
  disponibilidad_deseada: aTexto(registro.disponibilidad_deseada),
  criterios_bateria: aTexto(registro.criterios_bateria),
  panel: aTexto(registro.panel),
  destellador_bombillo: aTexto(registro.destellador_bombillo),
  tmef_1: aTexto(registro.tmef_1),
  tmef_2: aTexto(registro.tmef_2),
  tmef_3: aTexto(registro.tmef_3),
  tmef_senal: aTexto(registro.tmef_senal),
  tmpr_pronosticado: aTexto(registro.tmpr_pronosticado),
  tmrf: aTexto(registro.tmrf),
  tmpr_real: aTexto(registro.tmpr_real),
  disponibilidad_pronosticada: aTexto(registro.disponibilidad_pronosticada),
  tiempo_informacion: aTexto(registro.tiempo_informacion),
  tiempo_preparacion: aTexto(registro.tiempo_preparacion),
  tiempo_travesia: aTexto(registro.tiempo_travesia),
  tiempo_reposicion: aTexto(registro.tiempo_reposicion),
});

export const pronosticoACampos = (idSenal: string, texto: PronosticoTexto): PronosticoCampos => ({
  id_senal: idSenal,
  disponibilidad_deseada: textoONulo(texto.disponibilidad_deseada),
  criterios_bateria: textoONulo(texto.criterios_bateria),
  panel: textoONulo(texto.panel),
  destellador_bombillo: textoONulo(texto.destellador_bombillo),
  tmef_1: textoONulo(texto.tmef_1),
  tmef_2: textoONulo(texto.tmef_2),
  tmef_3: textoONulo(texto.tmef_3),
  tmef_senal: textoONulo(texto.tmef_senal),
  tmpr_pronosticado: textoONulo(texto.tmpr_pronosticado),
  tmrf: textoONulo(texto.tmrf),
  tmpr_real: textoONulo(texto.tmpr_real),
  disponibilidad_pronosticada: textoONulo(texto.disponibilidad_pronosticada),
  tiempo_informacion: textoONulo(texto.tiempo_informacion),
  tiempo_preparacion: textoONulo(texto.tiempo_preparacion),
  tiempo_travesia: textoONulo(texto.tiempo_travesia),
  tiempo_reposicion: textoONulo(texto.tiempo_reposicion),
});

const mensajeError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message;
};

export const pronosticoService = {
  getPorSenal: async (idSenal: string): Promise<PronosticoRegistro | null> => {
    const response = await api.get<PronosticoRegistro[]>(
      `${PRONOSTICO_PATH}?id_senal=eq.${idSenal}&deleted_at=is.null&select=*`
    );
    return response.data[0] ?? null;
  },

  create: async (campos: PronosticoCampos): Promise<PronosticoResponse> => {
    try {
      const response = await api.post<PronosticoRegistro[]>(
        PRONOSTICO_PATH,
        { ...campos, created_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Pronóstico guardado', registro: response.data[0] ?? null };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error), registro: null };
    }
  },

  update: async (id: string, campos: PronosticoCampos): Promise<PronosticoResponse> => {
    try {
      const response = await api.patch<PronosticoRegistro[]>(
        `${PRONOSTICO_PATH}?id_pronostico=eq.${id}`,
        { ...campos, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Pronóstico guardado', registro: response.data[0] ?? null };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error), registro: null };
    }
  },
};
