import type { Rol } from '../../lib/tokens.ts';

export const RECURSOS_OPERATIVOS = [
  'senales',
  'fallas',
  'mantenimientos',
  'equipamientos_senal',
  'plan_mantenimiento',
  'lmf',
  'racon',
  'hechos',
  'equipos',
  'equipo_ubicaciones',
  'plantas',
  'plantas_fallas',
  'buques',
  'buque_maquinas',
  'buque_plantas',
  'alistamiento_buques',
  'personal',
  'libros',
  'prestamos',
  'pronosticos_senal',
] as const;

// Lectura para ambos roles; escritura solo administrador
export const CATALOGOS = [
  'caracteristicas',
  'categorias',
  'colores',
  'colores_luz',
  'empresas',
  'energias',
  'estaciones',
  'estados',
  'estados_senal',
  'formas',
  'marcas_tope',
  'mares',
  'materiales',
  'modelos_equipo',
  'modelos_senal',
  'origenes_falla',
  'tipos_equipamiento',
  'tipos_falla',
  'tipos_mantenimiento',
  'tipos_senal',
  'usuarios_navegacion',
  'zonas',
  'complejidades',
  'ubicaciones_medio',
  'tipos_alistamiento',
  'misiones_buque',
  'tipos_documento',
  'idiomas',
] as const;

// Lectura para ambos roles; alta (POST) para ambos; PATCH y DELETE solo administrador
export const CATALOGOS_ABIERTOS = ['temas', 'paises', 'editoriales'] as const;

// Solo lectura: nadie puede escribir la auditoria
export const HISTORIAL_CAMBIOS = ['historial_cambios'] as const;

// Vistas de solo lectura: se tratan igual que el historial
export const VISTAS = ['v_equipos', 'v_alistamiento_buques', 'v_libros', 'v_senales_estadisticas'] as const;

export const RPC_PERMITIDAS = ['get_dashboard_stats', 'get_fault_analytics', 'get_status_by_zone'] as const;

const METODOS = ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'] as const;
type Metodo = (typeof METODOS)[number];

type Clase = 'operativo' | 'catalogo' | 'catalogo_abierto' | 'historial' | 'rpc';

const METODOS_POR_CLASE: Record<Clase, readonly Metodo[]> = {
  operativo: METODOS,
  catalogo: METODOS,
  catalogo_abierto: METODOS,
  historial: METODOS,
  rpc: ['POST'],
};

// Parametros de query que no filtran filas
const PARAMETROS_NO_FILTRO = ['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'] as const;

// Eliminar en estos recursos (DELETE) solo administrador
const SOLO_ADMIN_ELIMINAR = ['senales'] as const;

// Tablas cuyo cuerpo se inspecciona: el gateway lo lee antes de reenviarlo
const RECURSOS_CON_REGLA_CUERPO = ['senales', 'personal'] as const;
const METODOS_CON_CUERPO = ['POST', 'PATCH'] as const;

// Upsert (POST con resolution= o on_conflict) solo administrador en estos recursos
const RECURSOS_SIN_UPSERT_USUARIO = ['senales', 'personal'] as const;

export interface EntradaAcceso {
  method: string;
  path: string;
  query: URLSearchParams;
  rol: Rol;
  // Valor de la cabecera Prefer de la peticion, si la trae
  prefer?: string | undefined;
}

export interface EntradaCuerpo {
  method: string;
  path: string;
  cuerpo: unknown;
  rol: Rol;
}

export type ResultadoAcceso =
  | { permitido: true }
  | { permitido: false; status: 400 | 403 | 404 | 405; mensaje: string };

const denegado = (status: 400 | 403 | 404 | 405, mensaje: string): ResultadoAcceso => ({
  permitido: false,
  status,
  mensaje,
});

function contiene(lista: readonly string[], valor: string): boolean {
  return lista.includes(valor);
}

function esMetodo(valor: string): valor is Metodo {
  return contiene(METODOS, valor);
}

function segmentosDe(path: string): string[] {
  return path.split('/').filter((segmento) => segmento !== '');
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

// path relativo al montaje: /recurso o /rpc/funcion
function clasificar(path: string): Clase | null {
  const segmentos = segmentosDe(path);

  if (segmentos.length === 2 && segmentos[0] === 'rpc') {
    return contiene(RPC_PERMITIDAS, segmentos[1]) ? 'rpc' : null;
  }
  if (segmentos.length !== 1) return null;

  const [recurso] = segmentos;
  if (contiene(RECURSOS_OPERATIVOS, recurso)) return 'operativo';
  if (contiene(CATALOGOS, recurso)) return 'catalogo';
  if (contiene(CATALOGOS_ABIERTOS, recurso)) return 'catalogo_abierto';
  if (contiene(HISTORIAL_CAMBIOS, recurso) || contiene(VISTAS, recurso)) return 'historial';
  return null;
}

function tienePermiso(clase: Clase, metodo: Metodo, rol: Rol): boolean {
  if (metodo === 'GET' || metodo === 'HEAD') return true;
  if (clase === 'catalogo') return rol === 'administrador';
  if (clase === 'catalogo_abierto') return metodo === 'POST' || rol === 'administrador';
  return clase !== 'historial';
}

function tieneFiltro(query: URLSearchParams): boolean {
  return [...query.keys()].some((clave) => !contiene(PARAMETROS_NO_FILTRO, clave));
}

// PostgREST hace upsert con Prefer: resolution=merge-duplicates|ignore-duplicates, o con on_conflict
function esUpsert(prefer: string | undefined, query: URLSearchParams): boolean {
  if (query.has('on_conflict')) return true;
  return (prefer ?? '')
    .toLowerCase()
    .split(',')
    .some((token) => token.replace(/\s+/g, '').startsWith('resolution='));
}

export function evaluarAcceso({ method, path, query, rol, prefer }: EntradaAcceso): ResultadoAcceso {
  const clase = clasificar(path);
  if (clase === null) return denegado(404, 'No encontrado');

  if (!esMetodo(method) || !contiene(METODOS_POR_CLASE[clase], method)) {
    return denegado(405, 'Metodo no permitido');
  }
  if (!tienePermiso(clase, method, rol)) return denegado(403, 'Sin permisos');
  const [recurso] = segmentosDe(path);
  if (method === 'DELETE' && contiene(SOLO_ADMIN_ELIMINAR, recurso) && rol !== 'administrador') {
    return denegado(403, 'Sin permisos');
  }
  if (
    method === 'POST' &&
    contiene(RECURSOS_SIN_UPSERT_USUARIO, recurso) &&
    rol !== 'administrador' &&
    esUpsert(prefer, query)
  ) {
    return denegado(403, 'Sin permisos');
  }
  if ((method === 'PATCH' || method === 'DELETE') && !tieneFiltro(query)) {
    return denegado(400, 'Se requiere un filtro para modificar o eliminar');
  }

  return { permitido: true };
}

// Indica si el cuerpo de la peticion debe leerse y pasarse a evaluarCuerpo
export function requiereCuerpo(method: string, path: string): boolean {
  const segmentos = segmentosDe(path);
  if (segmentos.length !== 1) return false;
  const [recurso] = segmentos;
  return contiene(RECURSOS_CON_REGLA_CUERPO, recurso) && contiene(METODOS_CON_CUERPO, method);
}

// Reglas sobre el cuerpo JSON (objeto o arreglo de objetos, como acepta PostgREST).
// Solo administrador puede: poner fecha_baja a null en personal; poner fecha_retirada
// a null en senales; o incluir deleted_at en un PATCH de senales (eliminar o restaurar).
export function evaluarCuerpo({ method, path, cuerpo, rol }: EntradaCuerpo): ResultadoAcceso {
  if (rol === 'administrador' || method !== 'PATCH') return { permitido: true };

  const [recurso] = segmentosDe(path);
  const filas: unknown[] = Array.isArray(cuerpo) ? cuerpo : [cuerpo];

  const restringida = filas.some((fila) => {
    if (!esObjeto(fila)) return false;
    if (recurso === 'personal') return fila.fecha_baja === null;
    if (recurso === 'senales') return fila.fecha_retirada === null || 'deleted_at' in fila;
    return false;
  });

  return restringida ? denegado(403, 'Sin permisos') : { permitido: true };
}
