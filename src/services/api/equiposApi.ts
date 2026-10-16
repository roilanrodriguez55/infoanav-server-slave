import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';
import { parseContentRange } from '@/lib/postgrest';
import { aTextoLocal } from '@/lib/planMantenimiento';
import type { CatalogoItem } from './senalesApi';

export const EQUIPOS_VISTA_PATH = '/v_equipos';
export const EQUIPOS_PATH = '/equipos';
export const MODELOS_EQUIPO_PATH = '/modelos_equipo';

// Tipo de equipamiento sin LSM inicial y con garantia (se compara en minusculas).
export const TIPO_ESTRUCTURA = 'estructura';

export type UnidadVida = 'dias' | 'meses' | 'anos';

// Un mes se guarda como 30 dias y un año como 365 dias.
export const FACTOR_VIDA: Record<UnidadVida, number> = { dias: 1, meses: 30, anos: 365 };

export const ETIQUETA_UNIDAD_VIDA: Record<UnidadVida, string> = { dias: 'Días', meses: 'Meses', anos: 'Años' };

export interface TipoEquipo {
  id_tipo_equipamiento: string;
  nombre: string;
}

export interface UbicacionMedio {
  id_ubicacion_medio: string;
  nombre: string;
  fuera_servicio: boolean;
}

export interface ModeloEquipo {
  id_modelo_equipo: string;
  id_tipo_equipamiento: string;
  nombre: string;
  pais: string | null;
  voltaje: number | null;
  vatios: number | null;
  consumo: string | null;
  tipo: { nombre: string } | null;
}

export interface EquiposCatalogos {
  empresas: CatalogoItem[];
  modelos: ModeloEquipo[];
  ubicaciones: UbicacionMedio[];
}

export interface EquipoCampos {
  id_tipo_equipamiento: string;
  numero_inventario: string;
  id_modelo_equipo: string | null;
  id_empresa: string | null;
  fecha_inicio_servicio: string | null;
  proveedor: string | null;
  garantia: string | null;
  vida_util_dias: number | null;
  id_senal_inicial: string | null;
  observaciones: string | null;
}

// Fila de la vista v_equipos: el equipo con su ubicacion actual (estancia abierta).
export interface EquipoRegistro {
  id_equipo: string;
  id_tipo_equipamiento: string;
  numero_inventario: string;
  id_modelo_equipo: string | null;
  id_empresa: string | null;
  fecha_inicio_servicio: string | null;
  proveedor: string | null;
  garantia: string | null;
  vida_util_dias: number | null;
  id_senal_inicial: string | null;
  observaciones: string | null;
  tipo_nombre: string | null;
  modelo_nombre: string | null;
  empresa_nombre: string | null;
  id_ubicacion_medio: string | null;
  ubicacion_nombre: string | null;
  id_senal_actual: string | null;
  codigo_lsm: string | null;
  senal_nombre: string | null;
  fuera_servicio: boolean;
  fecha_inicio_ubicacion: string | null;
  vida_util_cumplida: boolean;
  dias_vida_restantes: number | null;
}

export interface EstadoEquipo {
  id_tipo_equipamiento: string;
  vida_util_cumplida: boolean;
  fuera_servicio: boolean;
}

export interface EstanciaEquipo {
  id_equipo_ubicacion: string;
  id_ubicacion_medio: string;
  id_senal: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  ubicacion: { nombre: string } | null;
  senal: { codigo_lsm: string; nombre: string | null } | null;
}

export interface EquipoOpcion {
  id_equipo: string;
  numero_inventario: string;
  modelo_nombre: string | null;
}

export interface ModeloCampos {
  id_tipo_equipamiento: string;
  nombre: string;
  pais: string | null;
  voltaje: number | null;
  vatios: number | null;
  consumo: string | null;
}

export interface EquiposResponse {
  success: boolean;
  message: string;
}

// Valores del formulario: todo texto; la conversion ocurre en equipoACampos.
export interface EquipoTexto {
  numero_inventario: string;
  id_modelo_equipo: string;
  id_empresa: string;
  fecha_inicio_servicio: string;
  proveedor: string;
  garantia: string;
  vida_cantidad: string;
  vida_unidad: UnidadVida;
  id_senal_inicial: string;
  observaciones: string;
}

export interface ModeloTexto {
  nombre: string;
  id_tipo_equipamiento: string;
  pais: string;
  voltaje: string;
  vatios: string;
  consumo: string;
}

const textoONulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());
const numeroONulo = (valor: string): number | null => (valor.trim() === '' ? null : Number(valor));
const aTexto = (valor: string | number | null | undefined): string =>
  valor === null || valor === undefined ? '' : String(valor);

export const EQUIPO_VACIO: EquipoTexto = {
  numero_inventario: '',
  id_modelo_equipo: '',
  id_empresa: '',
  fecha_inicio_servicio: '',
  proveedor: '',
  garantia: '',
  vida_cantidad: '',
  vida_unidad: 'anos',
  id_senal_inicial: '',
  observaciones: '',
};

export const MODELO_VACIO: ModeloTexto = {
  nombre: '',
  id_tipo_equipamiento: '',
  pais: '',
  voltaje: '',
  vatios: '',
  consumo: '',
};

// Separa los dias guardados en la unidad mas grande que los divide sin resto.
export function vidaDesdeDias(dias: number | null): Pick<EquipoTexto, 'vida_cantidad' | 'vida_unidad'> {
  if (dias === null) return { vida_cantidad: '', vida_unidad: 'anos' };
  if (dias % FACTOR_VIDA.anos === 0) return { vida_cantidad: String(dias / FACTOR_VIDA.anos), vida_unidad: 'anos' };
  if (dias % FACTOR_VIDA.meses === 0) return { vida_cantidad: String(dias / FACTOR_VIDA.meses), vida_unidad: 'meses' };
  return { vida_cantidad: String(dias), vida_unidad: 'dias' };
}

export const equipoATexto = (equipo: EquipoRegistro): EquipoTexto => ({
  numero_inventario: aTexto(equipo.numero_inventario),
  id_modelo_equipo: aTexto(equipo.id_modelo_equipo),
  id_empresa: aTexto(equipo.id_empresa),
  fecha_inicio_servicio: aTexto(equipo.fecha_inicio_servicio).slice(0, 10),
  proveedor: aTexto(equipo.proveedor),
  garantia: aTexto(equipo.garantia),
  ...vidaDesdeDias(equipo.vida_util_dias),
  id_senal_inicial: aTexto(equipo.id_senal_inicial),
  observaciones: aTexto(equipo.observaciones),
});

// Garantia y LSM inicial no aplican a la estructura: se envian en null.
export const equipoACampos = (
  idTipo: string,
  texto: EquipoTexto,
  esEstructura: boolean
): EquipoCampos => {
  const cantidad = numeroONulo(texto.vida_cantidad);
  return {
    id_tipo_equipamiento: idTipo,
    numero_inventario: texto.numero_inventario.trim(),
    id_modelo_equipo: textoONulo(texto.id_modelo_equipo),
    id_empresa: textoONulo(texto.id_empresa),
    fecha_inicio_servicio: textoONulo(texto.fecha_inicio_servicio),
    proveedor: textoONulo(texto.proveedor),
    garantia: esEstructura ? textoONulo(texto.garantia) : null,
    vida_util_dias: cantidad === null ? null : Math.round(cantidad * FACTOR_VIDA[texto.vida_unidad]),
    id_senal_inicial: esEstructura ? null : textoONulo(texto.id_senal_inicial),
    observaciones: textoONulo(texto.observaciones),
  };
};

export const modeloATexto = (modelo: ModeloEquipo): ModeloTexto => ({
  nombre: aTexto(modelo.nombre),
  id_tipo_equipamiento: aTexto(modelo.id_tipo_equipamiento),
  pais: aTexto(modelo.pais),
  voltaje: aTexto(modelo.voltaje),
  vatios: aTexto(modelo.vatios),
  consumo: aTexto(modelo.consumo),
});

export const modeloACampos = (texto: ModeloTexto): ModeloCampos => ({
  id_tipo_equipamiento: texto.id_tipo_equipamiento,
  nombre: texto.nombre.trim(),
  pais: textoONulo(texto.pais),
  voltaje: numeroONulo(texto.voltaje),
  vatios: numeroONulo(texto.vatios),
  consumo: textoONulo(texto.consumo),
});

const mensajeError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message;
};

const ejecutar = async (accion: () => Promise<unknown>, exito: string): Promise<EquiposResponse> => {
  try {
    await accion();
    return { success: true, message: exito };
  } catch (error: unknown) {
    return { success: false, message: mensajeError(error) };
  }
};

export const equiposService = {
  getTipos: async (): Promise<TipoEquipo[]> => {
    const response = await api.get<TipoEquipo[]>(
      '/tipos_equipamiento?select=id_tipo_equipamiento,nombre&deleted_at=is.null&order=nombre.asc'
    );
    return response.data;
  },

  getCatalogos: async (): Promise<EquiposCatalogos> => {
    const [empresas, modelos, ubicaciones] = await Promise.all([
      api.get<{ id_empresa: string; nombre: string }[]>(
        '/empresas?select=id_empresa,nombre&deleted_at=is.null&order=nombre.asc'
      ),
      api.get<ModeloEquipo[]>(`${MODELOS_EQUIPO_PATH}?select=*,tipo:tipos_equipamiento(nombre)&deleted_at=is.null&order=nombre.asc`),
      api.get<UbicacionMedio[]>(
        '/ubicaciones_medio?select=id_ubicacion_medio,nombre,fuera_servicio&deleted_at=is.null&order=nombre.asc'
      ),
    ]);
    return {
      empresas: empresas.data.map((empresa) => ({ id: empresa.id_empresa, nombre: empresa.nombre })),
      modelos: modelos.data,
      ubicaciones: ubicaciones.data,
    };
  },

  // Equipos de un tipo para vincularlos a una linea de equipamientos_senal.
  getEquiposDeTipo: async (idTipo: string): Promise<EquipoOpcion[]> => {
    const response = await api.get<EquipoOpcion[]>(
      `${EQUIPOS_VISTA_PATH}?id_tipo_equipamiento=eq.${idTipo}&select=id_equipo,numero_inventario,modelo_nombre&order=numero_inventario.asc`
    );
    return response.data;
  },

  // Columnas minimas de todos los equipos para contar alertas por tipo.
  getEstadoEquipos: async (): Promise<EstadoEquipo[]> => {
    const response = await api.get<EstadoEquipo[]>(
      `${EQUIPOS_VISTA_PATH}?select=id_tipo_equipamiento,vida_util_cumplida,fuera_servicio`
    );
    return response.data;
  },

  getHistorial: async (idEquipo: string): Promise<EstanciaEquipo[]> => {
    const response = await api.get<EstanciaEquipo[]>(
      `/equipo_ubicaciones?id_equipo=eq.${idEquipo}&deleted_at=is.null&select=*,ubicacion:ubicaciones_medio(nombre),senal:senales(codigo_lsm,nombre)&order=fecha_inicio.desc`
    );
    return response.data;
  },

  // Cierra la estancia abierta (fecha_fin) y abre una nueva en la ubicacion indicada.
  cambiarUbicacion: async (
    idEquipo: string,
    idUbicacionMedio: string,
    idSenal: string | null
  ): Promise<EquiposResponse> => {
    const ahora = aTextoLocal(new Date());
    return ejecutar(async () => {
      await api.patch(
        `/equipo_ubicaciones?id_equipo=eq.${idEquipo}&fecha_fin=is.null&deleted_at=is.null`,
        { fecha_fin: ahora, updated_at: new Date().toISOString() }
      );
      await api.post(
        '/equipo_ubicaciones',
        {
          id_equipo: idEquipo,
          id_ubicacion_medio: idUbicacionMedio,
          id_senal: idSenal,
          fecha_inicio: ahora,
          created_at: new Date().toISOString(),
        },
        { headers: { Prefer: 'return=representation' } }
      );
    }, 'Ubicación cambiada');
  },

  create: async (campos: EquipoCampos): Promise<EquiposResponse> =>
    ejecutar(
      () => api.post(EQUIPOS_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      }),
      'Equipo creado'
    ),

  update: async (idEquipo: string, campos: EquipoCampos): Promise<EquiposResponse> =>
    ejecutar(
      () => api.patch(
        `${EQUIPOS_PATH}?id_equipo=eq.${idEquipo}`,
        { ...campos, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      ),
      'Equipo actualizado'
    ),

  delete: async (idEquipo: string): Promise<EquiposResponse> =>
    ejecutar(
      () => api.patch(
        `${EQUIPOS_PATH}?id_equipo=eq.${idEquipo}`,
        { deleted_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      ),
      'Equipo eliminado'
    ),

  // Vincula (o desvincula con null) una linea de equipamientos_senal con un equipo.
  vincularEquipamiento: async (idEquipamiento: string, idEquipo: string | null): Promise<EquiposResponse> =>
    ejecutar(
      () => api.patch(
        `/equipamientos_senal?id_equipamiento=eq.${idEquipamiento}`,
        { id_equipo: idEquipo, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      ),
      idEquipo ? 'Equipo vinculado' : 'Equipo desvinculado'
    ),

  // Equipos con vida util cumplida, para la alerta del Dashboard.
  contarAlertasEquipos: async (): Promise<number> => {
    const response = await api.get(`${EQUIPOS_VISTA_PATH}?vida_util_cumplida=is.true&select=id_equipo&limit=1`, {
      headers: { Prefer: 'count=exact' },
    });
    return parseContentRange(response.headers['content-range']).total ?? 0;
  },

  createModelo: async (campos: ModeloCampos): Promise<EquiposResponse> =>
    ejecutar(
      () => api.post(MODELOS_EQUIPO_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      }),
      'Modelo creado'
    ),

  updateModelo: async (idModelo: string, campos: ModeloCampos): Promise<EquiposResponse> =>
    ejecutar(
      () => api.patch(
        `${MODELOS_EQUIPO_PATH}?id_modelo_equipo=eq.${idModelo}`,
        { ...campos, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      ),
      'Modelo actualizado'
    ),

  deleteModelo: async (idModelo: string): Promise<EquiposResponse> =>
    ejecutar(
      () => api.patch(
        `${MODELOS_EQUIPO_PATH}?id_modelo_equipo=eq.${idModelo}`,
        { deleted_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      ),
      'Modelo eliminado'
    ),
};
