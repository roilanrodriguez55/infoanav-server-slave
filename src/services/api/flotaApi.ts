import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';
import { addDays, format } from 'date-fns';
import type { CatalogoItem } from './senalesApi';

export const BUQUES_PATH = '/buques';
export const MAQUINAS_PATH = '/buque_maquinas';
export const PLANTAS_PATH = '/buque_plantas';
export const ALISTAMIENTO_VISTA_PATH = '/v_alistamiento_buques';
export const ALISTAMIENTO_PATH = '/alistamiento_buques';
export const PERSONAL_PATH = '/personal';

export const DIAS_AVISO_CERTIFICADO = 60;

export type TipoDato = 'texto' | 'entero' | 'decimal' | 'fecha' | 'booleano';
export type ValorCampo = string | number | boolean | null;
export type Esquema<K extends string> = Record<K, TipoDato>;

// Esquemas de columnas (orden de presentacion en los formularios).
export const ESQUEMA_BUQUE = {
  buque: 'texto',
  proyecto: 'texto',
  id_empresa: 'texto',
  nombre_buque: 'texto',
  numero_inventario: 'texto',
  ano_construccion: 'entero',
  material_casco: 'texto',
  basificacion: 'texto',
  especialidad: 'texto',
  autonomia: 'decimal',
  valor_inicial: 'decimal',
  vida_economica: 'decimal',
  lista: 'texto',
  tarifa_mn: 'decimal',
  tarifa_mlc: 'decimal',
  horas_trabajo: 'decimal',
  desplazamiento: 'decimal',
  velocidad: 'decimal',
  folio: 'texto',
  color: 'texto',
  tripulantes: 'entero',
  no_tripulantes: 'entero',
  propuesto_baja: 'booleano',
  area_navegacion: 'texto',
  numeral: 'texto',
  puerto_matricula: 'texto',
  registro: 'texto',
  arqueo_bruto: 'decimal',
  arqueo_neto: 'decimal',
  eslora: 'decimal',
  manga: 'decimal',
  calado: 'decimal',
  puntal: 'decimal',
  franco_borda: 'decimal',
  capacidad_combustible: 'decimal',
  capacidad_aceite: 'decimal',
  capacidad_agua: 'decimal',
  area_bodega: 'decimal',
  tipo_propela: 'texto',
  cantidad_propelas: 'entero',
  cantidad_motores: 'entero',
  izaje_principal_mecanismo: 'texto',
  izaje_principal_largo_brazo: 'decimal',
  izaje_principal_capacidad: 'decimal',
  izaje_auxiliar_mecanismo: 'texto',
  izaje_auxiliar_largo_brazo: 'decimal',
  izaje_auxiliar_capacidad: 'decimal',
  cert_navegabilidad_inspeccion: 'fecha',
  cert_navegabilidad_expedicion: 'fecha',
  cert_navegabilidad_vence: 'fecha',
  cert_linea_carga_inspeccion: 'fecha',
  cert_linea_carga_expedicion: 'fecha',
  cert_linea_carga_vence: 'fecha',
  cert_clase_inspeccion: 'fecha',
  cert_clase_expedicion: 'fecha',
  cert_clase_vence: 'fecha',
  notacion_clase: 'texto',
  visado: 'texto',
  fecha_visado: 'fecha',
  vigencia_visado: 'fecha',
  lugar_visado: 'texto',
  condicionamientos: 'texto',
  equipo_hf: 'texto',
  equipo_vhf: 'texto',
  chalecos: 'entero',
  aros: 'entero',
  embarcacion_salvamento: 'texto',
  capacidad_embarcacion_salvamento: 'entero',
  extintores_agua: 'entero',
  extintores_co2: 'entero',
  extintores_espuma: 'entero',
  extintores_polvo: 'entero',
} as const satisfies Esquema<string>;

export type CampoBuque = keyof typeof ESQUEMA_BUQUE;

export const ESQUEMA_MAQUINA = {
  tipo: 'texto',
  ano: 'entero',
  serie: 'texto',
  ncc: 'texto',
  ncl: 'texto',
  potencia: 'decimal',
  rpm: 'entero',
} as const satisfies Esquema<string>;

export const ESQUEMA_PLANTA = {
  tipo: 'texto',
  ano: 'entero',
  serie: 'texto',
  voltaje: 'decimal',
  ncc: 'texto',
  ncl: 'texto',
} as const satisfies Esquema<string>;

export const ESQUEMA_ALISTAMIENTO = {
  id_buque: 'texto',
  ano: 'entero',
  mes: 'entero',
  id_tipo_alistamiento: 'texto',
  descripcion: 'texto',
  observaciones: 'texto',
  fecha_fs: 'fecha',
  fecha_alistamiento: 'fecha',
  dias_mision_mes: 'entero',
  dias_fs_mes: 'entero',
} as const satisfies Esquema<string>;

export const ESQUEMA_PERSONAL = {
  id_empresa: 'texto',
  nombre: 'texto',
  primer_apellido: 'texto',
  segundo_apellido: 'texto',
  cargo: 'texto',
  radica_en: 'texto',
  telefono: 'texto',
  carne_identidad: 'texto',
  fecha_nacimiento: 'fecha',
  salario: 'decimal',
  escolaridad: 'texto',
  cargos_anteriores: 'texto',
  cursos_recibidos: 'texto',
  necesidad_cursos: 'texto',
  fecha_baja: 'fecha',
  causa_baja: 'texto',
} as const satisfies Esquema<string>;

export type CampoMaquina = keyof typeof ESQUEMA_MAQUINA;
export type CampoPlanta = keyof typeof ESQUEMA_PLANTA;
export type CampoAlistamiento = keyof typeof ESQUEMA_ALISTAMIENTO;
export type CampoPersonal = keyof typeof ESQUEMA_PERSONAL;

export type Texto<K extends string> = Record<K, string>;
export type Campos<K extends string> = Record<K, ValorCampo>;

// Valor de formulario (texto) a valor de columna. Vacio pasa a null, salvo en booleanos.
export const aValorCampo = (texto: string, tipo: TipoDato): ValorCampo => {
  if (tipo === 'booleano') return texto === 'true';
  if (texto.trim() === '') return null;
  if (tipo === 'entero') return Math.trunc(Number(texto));
  if (tipo === 'decimal') return Number(texto);
  return texto.trim();
};

// Valor de columna a texto de formulario.
export const aTextoCampo = (valor: unknown, tipo: TipoDato): string => {
  if (tipo === 'booleano') return valor ? 'true' : 'false';
  if (typeof valor !== 'string' && typeof valor !== 'number') return '';
  if (tipo === 'fecha') return String(valor).slice(0, 10);
  return String(valor);
};

export const aTextos = <K extends string>(esquema: Esquema<K>, fila: object | null): Texto<K> => {
  const origen = (fila ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    (Object.keys(esquema) as K[]).map((clave) => [clave, aTextoCampo(origen[clave], esquema[clave])])
  ) as Texto<K>;
};

export const aCampos = <K extends string>(esquema: Esquema<K>, texto: Texto<K>): Campos<K> =>
  Object.fromEntries(
    (Object.keys(esquema) as K[]).map((clave) => [clave, aValorCampo(texto[clave], esquema[clave])])
  ) as Campos<K>;

export const textosVacios = <K extends string>(esquema: Esquema<K>): Texto<K> =>
  Object.fromEntries(
    (Object.keys(esquema) as K[]).map((clave) => [clave, esquema[clave] === 'booleano' ? 'false' : ''])
  ) as Texto<K>;

export interface Buque {
  id_buque: string;
  buque: string;
  id_empresa: string | null;
  empresa?: { nombre: string } | null;
  nombre_buque: string | null;
  especialidad: string | null;
  eslora: number | null;
  tripulantes: number | null;
  propuesto_baja: boolean;
  deleted_at: string | null;
  [columna: string]: unknown;
}

export interface MaquinaRegistro {
  id_buque_maquina: string;
  id_buque: string;
  [columna: string]: unknown;
}

export interface PlantaRegistro {
  id_buque_planta: string;
  id_buque: string;
  [columna: string]: unknown;
}

export interface AlistamientoRegistro {
  id_alistamiento: string;
  id_buque: string;
  buque: string;
  ano: number;
  mes: number;
  id_tipo_alistamiento: string | null;
  descripcion: string | null;
  observaciones: string | null;
  fecha_fs: string | null;
  fecha_alistamiento: string | null;
  dias_mision_mes: number | null;
  dias_fs_mes: number | null;
  pct_alistamiento_mes: number | null;
  dias_mision_acum: number | null;
  dias_fs_acum: number | null;
  pct_alistamiento_acum: number | null;
}

export interface PersonaRegistro {
  id_persona: string;
  [columna: string]: unknown;
}

export interface FlotaResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export type CampoCertificado = 'navegabilidad' | 'linea_carga' | 'clase' | 'visado';

export interface AlertaCertificado {
  id_buque: string;
  buque: string;
  certificado: CampoCertificado;
  fecha: string;
  vencido: boolean;
}

export const ETIQUETA_CERTIFICADO: Record<CampoCertificado, string> = {
  navegabilidad: 'Navegabilidad',
  linea_carga: 'Línea de carga',
  clase: 'Clase',
  visado: 'Visado',
};

const COLUMNA_CERTIFICADO: Record<CampoCertificado, string> = {
  navegabilidad: 'cert_navegabilidad_vence',
  linea_carga: 'cert_linea_carga_vence',
  clase: 'cert_clase_vence',
  visado: 'vigencia_visado',
};

const mensajeError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message;
};

const respuesta = <T>(fn: () => Promise<T>, exito: string): Promise<FlotaResponse<T>> =>
  fn().then(
    (data): FlotaResponse<T> => ({ success: true, message: exito, data }),
    (error: unknown): FlotaResponse<T> => ({ success: false, message: mensajeError(error), data: null as T })
  );

const catalogo = async (tabla: string, columna: string): Promise<CatalogoItem[]> => {
  const response = await api.get<Record<string, string>[]>(`/${tabla}?select=${columna},nombre&order=nombre.asc`);
  return response.data.map((fila) => ({ id: fila[columna], nombre: fila.nombre }));
};

// Alertas de certificados: vencidos y los que vencen dentro de DIAS_AVISO_CERTIFICADO dias.
// Recibe la fecha de referencia para poder probarla sin depender del reloj.
export const calcularAlertasCertificados = (
  buques: Record<string, unknown>[],
  referencia: Date = new Date()
): AlertaCertificado[] => {
  const hoy = format(referencia, 'yyyy-MM-dd');
  const limite = format(addDays(referencia, DIAS_AVISO_CERTIFICADO), 'yyyy-MM-dd');
  const alertas: AlertaCertificado[] = [];

  for (const buque of buques) {
    if (buque.deleted_at) continue;
    for (const certificado of Object.keys(COLUMNA_CERTIFICADO) as CampoCertificado[]) {
      const fecha = buque[COLUMNA_CERTIFICADO[certificado]];
      if (typeof fecha !== 'string' || fecha === '') continue;
      const fechaCorta = fecha.slice(0, 10);
      if (fechaCorta > limite) continue;
      alertas.push({
        id_buque: String(buque.id_buque),
        buque: String(buque.buque),
        certificado,
        fecha: fechaCorta,
        vencido: fechaCorta < hoy,
      });
    }
  }

  return alertas.sort((a, b) => a.fecha.localeCompare(b.fecha));
};

// Filas repetibles (maquinas, plantas): las nuevas se insertan, las existentes se actualizan
// y las quitadas se borran de forma logica.
export interface FilaRepetible<K extends string> {
  id?: string;
  campos: Campos<K>;
}

const guardarFilas = async <K extends string>(
  path: string,
  columnaId: string,
  idBuque: string,
  filas: FilaRepetible<K>[],
  eliminadas: string[]
): Promise<void> => {
  for (const id of eliminadas) {
    await api.patch(`${path}?${columnaId}=eq.${id}`, { deleted_at: new Date().toISOString() }, {
      headers: { Prefer: 'return=representation' },
    });
  }
  for (const fila of filas) {
    if (fila.id) {
      await api.patch(`${path}?${columnaId}=eq.${fila.id}`, { ...fila.campos, updated_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
    } else {
      await api.post(path, { ...fila.campos, id_buque: idBuque, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
    }
  }
};

export const flotaService = {
  getCatalogos: async (): Promise<{ empresas: CatalogoItem[]; tiposAlistamiento: CatalogoItem[] }> => {
    const [empresas, tiposAlistamiento] = await Promise.all([
      catalogo('empresas', 'id_empresa'),
      catalogo('tipos_alistamiento', 'id_tipo_alistamiento'),
    ]);
    return { empresas, tiposAlistamiento };
  },

  getBuquesCatalogo: async (): Promise<CatalogoItem[]> => {
    const response = await api.get<{ id_buque: string; buque: string }[]>(
      `${BUQUES_PATH}?deleted_at=is.null&select=id_buque,buque&order=buque.asc`
    );
    return response.data.map((fila) => ({ id: fila.id_buque, nombre: fila.buque }));
  },

  listarBuques: () =>
    respuesta(async () => {
      const response = await api.get<Buque[]>(`${BUQUES_PATH}?deleted_at=is.null&select=*,empresa:empresas(nombre)&order=buque.asc`);
      return response.data;
    }, 'Buques obtenidos'),

  cargarFichaBuque: (idBuque: string) =>
    respuesta(async () => {
      const [buque, maquinas, plantas] = await Promise.all([
        api.get<Buque[]>(`${BUQUES_PATH}?id_buque=eq.${idBuque}&deleted_at=is.null&select=*`),
        api.get<MaquinaRegistro[]>(`${MAQUINAS_PATH}?id_buque=eq.${idBuque}&deleted_at=is.null&select=*&order=created_at.asc`),
        api.get<PlantaRegistro[]>(`${PLANTAS_PATH}?id_buque=eq.${idBuque}&deleted_at=is.null&select=*&order=created_at.asc`),
      ]);
      return { buque: buque.data[0] ?? null, maquinas: maquinas.data, plantas: plantas.data };
    }, 'Ficha de buque obtenida'),

  // Ambos devuelven el id_buque del registro guardado.
  crearBuque: (campos: Campos<CampoBuque>) =>
    respuesta(async () => {
      const response = await api.post<Buque[]>(BUQUES_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
      return response.data[0].id_buque;
    }, 'Buque creado'),

  actualizarBuque: (idBuque: string, campos: Campos<CampoBuque>) =>
    respuesta(async () => {
      await api.patch(`${BUQUES_PATH}?id_buque=eq.${idBuque}`, { ...campos, updated_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
      return idBuque;
    }, 'Buque actualizado'),

  guardarMaquinas: (idBuque: string, filas: FilaRepetible<CampoMaquina>[], eliminadas: string[]) =>
    respuesta(() => guardarFilas(MAQUINAS_PATH, 'id_buque_maquina', idBuque, filas, eliminadas), 'Máquinas guardadas'),

  guardarPlantas: (idBuque: string, filas: FilaRepetible<CampoPlanta>[], eliminadas: string[]) =>
    respuesta(() => guardarFilas(PLANTAS_PATH, 'id_buque_planta', idBuque, filas, eliminadas), 'Plantas guardadas'),

  listarAlistamiento: (ano: number) =>
    respuesta(async () => {
      const response = await api.get<AlistamientoRegistro[]>(
        `${ALISTAMIENTO_VISTA_PATH}?ano=eq.${ano}&select=*&order=buque.asc,mes.asc`
      );
      return response.data;
    }, 'Alistamiento obtenido'),

  registrarMes: (campos: Campos<CampoAlistamiento>) =>
    respuesta(async () => {
      await api.post(ALISTAMIENTO_PATH, { ...campos, created_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
    }, 'Mes registrado'),

  guardarPersona: (id: string | null, campos: Campos<CampoPersonal>) =>
    respuesta(async () => {
      if (id) {
        await api.patch(`${PERSONAL_PATH}?id_persona=eq.${id}`, { ...campos, updated_at: new Date().toISOString() }, {
          headers: { Prefer: 'return=representation' },
        });
      } else {
        await api.post(PERSONAL_PATH, { ...campos, created_at: new Date().toISOString() }, {
          headers: { Prefer: 'return=representation' },
        });
      }
    }, id ? 'Persona actualizada' : 'Persona registrada'),

  darBaja: (id: string, fecha: string, causa: string | null) =>
    respuesta(async () => {
      await api.patch(`${PERSONAL_PATH}?id_persona=eq.${id}`, { fecha_baja: fecha, causa_baja: causa, updated_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
    }, 'Baja registrada'),

  reactivar: (id: string) =>
    respuesta(async () => {
      await api.patch(`${PERSONAL_PATH}?id_persona=eq.${id}`, { fecha_baja: null, causa_baja: null, updated_at: new Date().toISOString() }, {
        headers: { Prefer: 'return=representation' },
      });
    }, 'Persona reactivada'),
};

// Numero de certificados vencidos o por vencer en los proximos DIAS_AVISO_CERTIFICADO dias (para el Dashboard).
export async function contarAlertasCertificados(): Promise<number> {
  const response = await api.get<Buque[]>(`${BUQUES_PATH}?deleted_at=is.null&select=*`);
  return calcularAlertasCertificados(response.data).length;
}
