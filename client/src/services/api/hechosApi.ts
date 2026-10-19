import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';
import { parseContentRange } from '@/lib/postgrest';
import type { CatalogoItem } from './senalesApi';

export const HECHOS_PATH = '/hechos';
// !inner: el filtro por empresa (senal.id_empresa) descarta hechos sin señal, que no pueden existir por la FK.
export const HECHOS_SELECT = '*,senal:senales!inner(codigo_lsm,nombre,empresa:empresas(nombre))';

export interface HechoCampos {
  id_senal: string;
  fecha: string | null;
  hora: string | null;
  hecho: string | null;
  reporta: string | null;
  ogo: string | null;
  medidas: string | null;
  perdidas: string | null;
  costo_mn: number | null;
  costo_mlc: number | null;
  rg: string | null;
  vandalico: boolean;
  fecha_pronostico_conclusion: string | null;
  observaciones: string | null;
}

export interface HechoRegistro extends Omit<HechoCampos, 'id_senal'> {
  id_hecho: string;
  id_senal: string;
  concluso: boolean;
  fecha_conclusion: string | null;
  senal: { codigo_lsm: string; nombre: string | null; empresa: { nombre: string } | null } | null;
}

// Valores del formulario: texto, salvo vandalico. La conversion a null o numero ocurre en hechoACampos.
export interface HechoTexto {
  fecha: string;
  hora: string;
  hecho: string;
  reporta: string;
  ogo: string;
  medidas: string;
  perdidas: string;
  costo_mn: string;
  costo_mlc: string;
  rg: string;
  vandalico: boolean;
  fecha_pronostico_conclusion: string;
  observaciones: string;
}

export interface ConcluirHechoTexto {
  fecha_conclusion: string;
  medidas: string;
  observaciones: string;
}

export interface HechoResponse {
  success: boolean;
  message: string;
}

const textoONulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());
const numeroONulo = (valor: string): number | null => (valor.trim() === '' ? null : Number(valor));
const aTexto = (valor: string | number | null | undefined): string =>
  valor === null || valor === undefined ? '' : String(valor);

export const HECHO_VACIO: HechoTexto = {
  fecha: '',
  hora: '',
  hecho: '',
  reporta: '',
  ogo: '',
  medidas: '',
  perdidas: '',
  costo_mn: '',
  costo_mlc: '',
  rg: '',
  vandalico: false,
  fecha_pronostico_conclusion: '',
  observaciones: '',
};

export const hechoATexto = (hecho: HechoRegistro): HechoTexto => ({
  fecha: aTexto(hecho.fecha),
  hora: aTexto(hecho.hora).slice(0, 5),
  hecho: aTexto(hecho.hecho),
  reporta: aTexto(hecho.reporta),
  ogo: aTexto(hecho.ogo),
  medidas: aTexto(hecho.medidas),
  perdidas: aTexto(hecho.perdidas),
  costo_mn: aTexto(hecho.costo_mn),
  costo_mlc: aTexto(hecho.costo_mlc),
  rg: aTexto(hecho.rg),
  vandalico: hecho.vandalico,
  fecha_pronostico_conclusion: aTexto(hecho.fecha_pronostico_conclusion),
  observaciones: aTexto(hecho.observaciones),
});

export const hechoACampos = (idSenal: string, texto: HechoTexto): HechoCampos => ({
  id_senal: idSenal,
  fecha: textoONulo(texto.fecha),
  hora: textoONulo(texto.hora),
  hecho: textoONulo(texto.hecho),
  reporta: textoONulo(texto.reporta),
  ogo: textoONulo(texto.ogo),
  medidas: textoONulo(texto.medidas),
  perdidas: textoONulo(texto.perdidas),
  costo_mn: numeroONulo(texto.costo_mn),
  costo_mlc: numeroONulo(texto.costo_mlc),
  rg: textoONulo(texto.rg),
  vandalico: texto.vandalico,
  fecha_pronostico_conclusion: textoONulo(texto.fecha_pronostico_conclusion),
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

// Cuenta los hechos no concluidos. Lanza error si la consulta falla; el llamador decide como mostrarlo.
export const contarHechosPendientes = async (): Promise<number> => {
  const response = await api.get(
    `${HECHOS_PATH}?select=id_hecho&concluso=eq.false&deleted_at=is.null&limit=1`,
    { headers: { Prefer: 'count=exact' } }
  );
  return parseContentRange(response.headers['content-range']).total ?? 0;
};

export const hechosService = {
  create: async (campos: HechoCampos): Promise<HechoResponse> => {
    try {
      await api.post(HECHOS_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
      return { success: true, message: 'Hecho creado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  update: async (id: string, campos: HechoCampos): Promise<HechoResponse> => {
    try {
      await api.patch(
        `${HECHOS_PATH}?id_hecho=eq.${id}`,
        { ...campos, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Hecho actualizado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  concluir: async (id: string, texto: ConcluirHechoTexto): Promise<HechoResponse> => {
    try {
      await api.patch(
        `${HECHOS_PATH}?id_hecho=eq.${id}`,
        {
          concluso: true,
          fecha_conclusion: textoONulo(texto.fecha_conclusion),
          medidas: textoONulo(texto.medidas),
          observaciones: textoONulo(texto.observaciones),
          updated_at: new Date().toISOString(),
        },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Hecho concluido' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  delete: async (id: string): Promise<HechoResponse> => {
    try {
      await api.patch(
        `${HECHOS_PATH}?id_hecho=eq.${id}`,
        { deleted_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Hecho eliminado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },
};
