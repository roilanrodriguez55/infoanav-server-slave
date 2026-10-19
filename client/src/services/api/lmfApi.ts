import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';

export const LMF_PATH = '/lmf';

// Valor de grillete_giratorio cuando el grillete es giratorio. El otro valor posible es 'No'.
export const GIRATORIO_SI = 'Sí';

const MENSAJE_FONDEO_INVALIDO = 'El fondeo actual de la señal no es un JSON válido.';

export interface LmfCampos {
  id_senal: string;
  fecha_leva: string | null;
  fecha_fondeo: string | null;
  marea: string | null;
  mar: string | null;
  viento: string | null;
  estado_tiempo: string | null;
  metodo_posicion: string | null;
  dirigente: string | null;
  observaciones: string | null;
  buque_ejecutor: string | null;
  id_buque_ejecutor: string | null;
  capitan: string | null;
  responsable: string | null;
  tipo_fondo: string | null;
  latitud: number | null;
  longitud: number | null;
  profundidad: number | null;
  cadena_cantidad: number | null;
  cadena_diametro: number | null;
  pesos_muertos_cantidad: number | null;
  pesos_muertos_tipo: string | null;
  grilletes_union_cantidad: number | null;
  grilletes_union_tipo: string | null;
  grillete_giratorio: string | null;
  brida_tipo: string | null;
  brida_cantidad: number | null;
}

export interface LmfRegistro extends LmfCampos {
  id_lmf: string;
}

export type LmfTexto = Record<Exclude<keyof LmfCampos, 'id_senal'>, string>;

export interface LmfResponse {
  success: boolean;
  message: string;
}

const textoONulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());
const numeroONulo = (valor: string): number | null => (valor.trim() === '' ? null : Number(valor));
type Primitivo = string | number | boolean | null | undefined;
const primitivo = (valor: unknown): Primitivo =>
  typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean' ? valor : undefined;
const aTexto = (valor: Primitivo): string => (valor === null || valor === undefined ? '' : String(valor));

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

// Primer elemento de una lista del JSON de fondeo, o un objeto vacio si no existe.
const primerElemento = (lista: unknown): Record<string, unknown> => {
  const primero = Array.isArray(lista) ? lista[0] : undefined;
  return esObjeto(primero) ? primero : {};
};

export const LMF_VACIO: LmfTexto = {
  fecha_leva: '',
  fecha_fondeo: '',
  marea: '',
  mar: '',
  viento: '',
  estado_tiempo: '',
  metodo_posicion: '',
  dirigente: '',
  observaciones: '',
  buque_ejecutor: '',
  id_buque_ejecutor: '',
  capitan: '',
  responsable: '',
  tipo_fondo: '',
  latitud: '',
  longitud: '',
  profundidad: '',
  cadena_cantidad: '',
  cadena_diametro: '',
  pesos_muertos_cantidad: '',
  pesos_muertos_tipo: '',
  grilletes_union_cantidad: '',
  grilletes_union_tipo: '',
  grillete_giratorio: '',
  brida_tipo: '',
  brida_cantidad: '',
};

export const lmfATexto = (lmf: LmfRegistro): LmfTexto => ({
  fecha_leva: aTexto(lmf.fecha_leva).slice(0, 16),
  fecha_fondeo: aTexto(lmf.fecha_fondeo).slice(0, 16),
  marea: aTexto(lmf.marea),
  mar: aTexto(lmf.mar),
  viento: aTexto(lmf.viento),
  estado_tiempo: aTexto(lmf.estado_tiempo),
  metodo_posicion: aTexto(lmf.metodo_posicion),
  dirigente: aTexto(lmf.dirigente),
  observaciones: aTexto(lmf.observaciones),
  buque_ejecutor: aTexto(lmf.buque_ejecutor),
  id_buque_ejecutor: aTexto(lmf.id_buque_ejecutor),
  capitan: aTexto(lmf.capitan),
  responsable: aTexto(lmf.responsable),
  tipo_fondo: aTexto(lmf.tipo_fondo),
  latitud: aTexto(lmf.latitud),
  longitud: aTexto(lmf.longitud),
  profundidad: aTexto(lmf.profundidad),
  cadena_cantidad: aTexto(lmf.cadena_cantidad),
  cadena_diametro: aTexto(lmf.cadena_diametro),
  pesos_muertos_cantidad: aTexto(lmf.pesos_muertos_cantidad),
  pesos_muertos_tipo: aTexto(lmf.pesos_muertos_tipo),
  grilletes_union_cantidad: aTexto(lmf.grilletes_union_cantidad),
  grilletes_union_tipo: aTexto(lmf.grilletes_union_tipo),
  grillete_giratorio: aTexto(lmf.grillete_giratorio),
  brida_tipo: aTexto(lmf.brida_tipo),
  brida_cantidad: aTexto(lmf.brida_cantidad),
});

export const lmfACampos = (idSenal: string, texto: LmfTexto): LmfCampos => ({
  id_senal: idSenal,
  fecha_leva: textoONulo(texto.fecha_leva),
  fecha_fondeo: textoONulo(texto.fecha_fondeo),
  marea: textoONulo(texto.marea),
  mar: textoONulo(texto.mar),
  viento: textoONulo(texto.viento),
  estado_tiempo: textoONulo(texto.estado_tiempo),
  metodo_posicion: textoONulo(texto.metodo_posicion),
  dirigente: textoONulo(texto.dirigente),
  observaciones: textoONulo(texto.observaciones),
  buque_ejecutor: textoONulo(texto.buque_ejecutor),
  id_buque_ejecutor: textoONulo(texto.id_buque_ejecutor),
  capitan: textoONulo(texto.capitan),
  responsable: textoONulo(texto.responsable),
  tipo_fondo: textoONulo(texto.tipo_fondo),
  latitud: numeroONulo(texto.latitud),
  longitud: numeroONulo(texto.longitud),
  profundidad: numeroONulo(texto.profundidad),
  cadena_cantidad: numeroONulo(texto.cadena_cantidad),
  cadena_diametro: numeroONulo(texto.cadena_diametro),
  pesos_muertos_cantidad: numeroONulo(texto.pesos_muertos_cantidad),
  pesos_muertos_tipo: textoONulo(texto.pesos_muertos_tipo),
  grilletes_union_cantidad: numeroONulo(texto.grilletes_union_cantidad),
  grilletes_union_tipo: textoONulo(texto.grilletes_union_tipo),
  grillete_giratorio: textoONulo(texto.grillete_giratorio),
  brida_tipo: textoONulo(texto.brida_tipo),
  brida_cantidad: numeroONulo(texto.brida_cantidad),
});

// Mapeo LMF <-> sistema_fondeo (JSON de senales). Se usa el primer elemento de cada lista:
// cadenas -> cadena_diametro / cadena_cantidad
// pesos_muertos -> pesos_muertos_tipo (peso) / pesos_muertos_cantidad
// bridas -> brida_tipo / brida_cantidad
// grectos -> grilletes_union_tipo / grilletes_union_cantidad, y giratorio <-> grillete_giratorio ('Sí' / 'No')
// La profundidad y el numero de serie del flotador no pertenecen a ese mapeo.
export const precargaDesdeFondeo = (
  sistemaFondeo: string | null
): { valores: Partial<LmfTexto> } | { error: string } => {
  if (sistemaFondeo === null || sistemaFondeo.trim() === '') return { valores: {} };

  let parsed: unknown;
  try {
    parsed = JSON.parse(sistemaFondeo);
  } catch {
    return { error: MENSAJE_FONDEO_INVALIDO };
  }
  if (!esObjeto(parsed)) return { error: MENSAJE_FONDEO_INVALIDO };

  const cadena = primerElemento(parsed.cadenas);
  const pesoMuerto = primerElemento(parsed.pesos_muertos);
  const brida = primerElemento(parsed.bridas);
  const grecto = primerElemento(parsed.grectos);

  return {
    valores: {
      cadena_diametro: aTexto(primitivo(cadena.diametro)),
      cadena_cantidad: aTexto(primitivo(cadena.cantidad)),
      pesos_muertos_tipo: aTexto(primitivo(pesoMuerto.peso)),
      pesos_muertos_cantidad: aTexto(primitivo(pesoMuerto.cantidad)),
      brida_tipo: aTexto(primitivo(brida.tipo)),
      brida_cantidad: aTexto(primitivo(brida.cantidad)),
      grilletes_union_tipo: aTexto(primitivo(grecto.tipo)),
      grilletes_union_cantidad: aTexto(primitivo(grecto.cantidad)),
      grillete_giratorio: grecto.giratorio === true ? GIRATORIO_SI : grecto.giratorio === false ? 'No' : '',
    },
  };
};

// Completa el primer elemento de una lista con los valores del LMF y conserva el resto de elementos y claves.
const fusionarPrimero = (lista: unknown, valores: Record<string, unknown>): unknown[] => {
  const [primero, ...resto] = Array.isArray(lista) ? lista : [];
  return [{ ...(esObjeto(primero) ? primero : {}), ...valores }, ...resto];
};

// Reescribe el primer elemento de las listas del fondeo con los datos del LMF y conserva el resto del JSON actual.
export const fusionarSistemaFondeo = (
  actual: string | null,
  campos: LmfCampos
): { json: string } | { error: string } => {
  let base: Record<string, unknown> = {};
  if (actual !== null && actual.trim() !== '') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(actual);
    } catch {
      return { error: MENSAJE_FONDEO_INVALIDO };
    }
    if (!esObjeto(parsed)) return { error: MENSAJE_FONDEO_INVALIDO };
    base = parsed;
  }

  return {
    json: JSON.stringify({
      ...base,
      cadenas: fusionarPrimero(base.cadenas, { diametro: campos.cadena_diametro, cantidad: campos.cadena_cantidad }),
      pesos_muertos: fusionarPrimero(base.pesos_muertos, { peso: campos.pesos_muertos_tipo, cantidad: campos.pesos_muertos_cantidad }),
      bridas: fusionarPrimero(base.bridas, { tipo: campos.brida_tipo, cantidad: campos.brida_cantidad }),
      grectos: fusionarPrimero(base.grectos, {
        tipo: campos.grilletes_union_tipo,
        cantidad: campos.grilletes_union_cantidad,
        giratorio: campos.grillete_giratorio === GIRATORIO_SI,
      }),
    }),
  };
};

const mensajeError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message;
};

export const lmfService = {
  getSistemaFondeo: async (idSenal: string): Promise<string | null> => {
    const response = await api.get<{ sistema_fondeo: string | null }[]>(
      `/senales?id_senal=eq.${idSenal}&select=sistema_fondeo`
    );
    return response.data[0]?.sistema_fondeo ?? null;
  },

  guardarSistemaFondeo: async (idSenal: string, sistemaFondeo: string): Promise<LmfResponse> => {
    try {
      await api.patch(
        `/senales?id_senal=eq.${idSenal}`,
        { sistema_fondeo: sistemaFondeo, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Fondeo de la señal actualizado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  create: async (campos: LmfCampos): Promise<LmfResponse> => {
    try {
      await api.post(LMF_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
      return { success: true, message: 'Leva, Mantenimiento y Fondeo (LMF) registrada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  update: async (id: string, campos: LmfCampos): Promise<LmfResponse> => {
    try {
      await api.patch(
        `${LMF_PATH}?id_lmf=eq.${id}`,
        { ...campos, updated_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Leva, Mantenimiento y Fondeo (LMF) actualizada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  delete: async (id: string): Promise<LmfResponse> => {
    try {
      await api.patch(
        `${LMF_PATH}?id_lmf=eq.${id}`,
        { deleted_at: new Date().toISOString() },
        { headers: { Prefer: 'return=representation' } }
      );
      return { success: true, message: 'Leva, Mantenimiento y Fondeo (LMF) eliminada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },
};
