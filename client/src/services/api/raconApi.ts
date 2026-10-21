import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';
import type { CatalogoItem } from './senalesApi';

export const RACON_PATH = '/racon';
export const RACON_SELECT = '*,empresa:empresas(nombre),estacion:estaciones(nombre),senal:senales(codigo_lsm,nombre)';

export interface RaconCampos {
  id_senal: string;
  numero_orden: string | null;
  nombre: string | null;
  id_empresa: string | null;
  id_estacion: string | null;
  tipo: string | null;
  banda: string | null;
  frecuencia: string | null;
  barrido: string | null;
  supresion_lobulo_lateral: string | null;
  pulso: string | null;
  modo_servicio: string | null;
  identificador: string | null;
  largo_identificador: string | null;
  alcance: number | null;
  sensibilidad: string | null;
  retardo_pulso: string | null;
  antena_tipo: string | null;
  antena_ganancia: string | null;
  antena_directividad: string | null;
  antena_polarizacion: string | null;
  dimensiones: string | null;
  peso: string | null;
  color: string | null;
  energia: string | null;
  consumo: string | null;
  fecha_inicio: string | null;
  fecha_baja: string | null;
}

export interface RaconRegistro extends RaconCampos {
  id_racon: string;
  empresa: { nombre: string } | null;
  estacion: { nombre: string } | null;
  senal: { codigo_lsm: string; nombre: string | null } | null;
}

// Valores del formulario: todo texto; la conversion a null o numero ocurre en raconACampos.
export type RaconTexto = Record<Exclude<keyof RaconCampos, 'id_senal'>, string>;

export interface RaconResponse {
  success: boolean;
  message: string;
}

const textoONulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());
const numeroONulo = (valor: string): number | null => (valor.trim() === '' ? null : Number(valor));
const aTexto = (valor: string | number | null | undefined): string =>
  valor === null || valor === undefined ? '' : String(valor);

export const RACON_VACIO: RaconTexto = {
  numero_orden: '',
  nombre: '',
  id_empresa: '',
  id_estacion: '',
  tipo: '',
  banda: '',
  frecuencia: '',
  barrido: '',
  supresion_lobulo_lateral: '',
  pulso: '',
  modo_servicio: '',
  identificador: '',
  largo_identificador: '',
  alcance: '',
  sensibilidad: '',
  retardo_pulso: '',
  antena_tipo: '',
  antena_ganancia: '',
  antena_directividad: '',
  antena_polarizacion: '',
  dimensiones: '',
  peso: '',
  color: '',
  energia: '',
  consumo: '',
  fecha_inicio: '',
  fecha_baja: '',
};

export const raconATexto = (racon: RaconRegistro): RaconTexto => ({
  numero_orden: aTexto(racon.numero_orden),
  nombre: aTexto(racon.nombre),
  id_empresa: aTexto(racon.id_empresa),
  id_estacion: aTexto(racon.id_estacion),
  tipo: aTexto(racon.tipo),
  banda: aTexto(racon.banda),
  frecuencia: aTexto(racon.frecuencia),
  barrido: aTexto(racon.barrido),
  supresion_lobulo_lateral: aTexto(racon.supresion_lobulo_lateral),
  pulso: aTexto(racon.pulso),
  modo_servicio: aTexto(racon.modo_servicio),
  identificador: aTexto(racon.identificador),
  largo_identificador: aTexto(racon.largo_identificador),
  alcance: aTexto(racon.alcance),
  sensibilidad: aTexto(racon.sensibilidad),
  retardo_pulso: aTexto(racon.retardo_pulso),
  antena_tipo: aTexto(racon.antena_tipo),
  antena_ganancia: aTexto(racon.antena_ganancia),
  antena_directividad: aTexto(racon.antena_directividad),
  antena_polarizacion: aTexto(racon.antena_polarizacion),
  dimensiones: aTexto(racon.dimensiones),
  peso: aTexto(racon.peso),
  color: aTexto(racon.color),
  energia: aTexto(racon.energia),
  consumo: aTexto(racon.consumo),
  fecha_inicio: aTexto(racon.fecha_inicio).slice(0, 10),
  fecha_baja: aTexto(racon.fecha_baja).slice(0, 10),
});

export const raconACampos = (idSenal: string, texto: RaconTexto): RaconCampos => ({
  id_senal: idSenal,
  numero_orden: textoONulo(texto.numero_orden),
  nombre: textoONulo(texto.nombre),
  id_empresa: textoONulo(texto.id_empresa),
  id_estacion: textoONulo(texto.id_estacion),
  tipo: textoONulo(texto.tipo),
  banda: textoONulo(texto.banda),
  frecuencia: textoONulo(texto.frecuencia),
  barrido: textoONulo(texto.barrido),
  supresion_lobulo_lateral: textoONulo(texto.supresion_lobulo_lateral),
  pulso: textoONulo(texto.pulso),
  modo_servicio: textoONulo(texto.modo_servicio),
  identificador: textoONulo(texto.identificador),
  largo_identificador: textoONulo(texto.largo_identificador),
  alcance: numeroONulo(texto.alcance),
  sensibilidad: textoONulo(texto.sensibilidad),
  retardo_pulso: textoONulo(texto.retardo_pulso),
  antena_tipo: textoONulo(texto.antena_tipo),
  antena_ganancia: textoONulo(texto.antena_ganancia),
  antena_directividad: textoONulo(texto.antena_directividad),
  antena_polarizacion: textoONulo(texto.antena_polarizacion),
  dimensiones: textoONulo(texto.dimensiones),
  peso: textoONulo(texto.peso),
  color: textoONulo(texto.color),
  energia: textoONulo(texto.energia),
  consumo: textoONulo(texto.consumo),
  fecha_inicio: textoONulo(texto.fecha_inicio),
  fecha_baja: textoONulo(texto.fecha_baja),
});

const mensajeError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message;
};

const catalogo = async (tabla: string, columna: string): Promise<CatalogoItem[]> => {
  const response = await api.get<Record<string, string>[]>(`/${tabla}?deleted_at=is.null&select=${columna},nombre&order=nombre.asc`);
  return response.data.map((fila) => ({ id: fila[columna], nombre: fila.nombre }));
};

export const raconService = {
  getActivoPorSenal: async (idSenal: string): Promise<RaconRegistro | null> => {
    const response = await api.get<RaconRegistro[]>(
      `${RACON_PATH}?id_senal=eq.${idSenal}&deleted_at=is.null&select=${RACON_SELECT}&order=created_at.asc&limit=1`
    );
    return response.data[0] ?? null;
  },

  getCatalogos: async (): Promise<{ empresas: CatalogoItem[]; estaciones: CatalogoItem[] }> => {
    const [empresas, estaciones] = await Promise.all([
      catalogo('empresas', 'id_empresa'),
      catalogo('estaciones', 'id_estacion'),
    ]);
    return { empresas, estaciones };
  },

  create: async (campos: RaconCampos): Promise<RaconResponse> => {
    try {
      await api.post(RACON_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
      return { success: true, message: 'RACON creado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  update: async (id: string, campos: RaconCampos): Promise<RaconResponse> => {
    try {
      await api.patch(
        `${RACON_PATH}?id_racon=eq.${id}`,
        { ...campos, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'RACON actualizado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  delete: async (id: string): Promise<RaconResponse> => {
    try {
      await api.patch(
        `${RACON_PATH}?id_racon=eq.${id}`,
        { deleted_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'RACON eliminado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },
};
