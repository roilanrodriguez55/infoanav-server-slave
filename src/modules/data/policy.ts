import type { Rol } from '../../lib/tokens.ts';

export const RECURSOS_OPERATIVOS = ['senales', 'fallas', 'mantenimientos', 'equipamientos_senal'] as const;

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
  'modelos_senal',
  'origenes_falla',
  'tipos_equipamiento',
  'tipos_falla',
  'tipos_mantenimiento',
  'tipos_senal',
  'usuarios_navegacion',
  'zonas',
] as const;

// Solo lectura: nadie puede escribir la auditoria
export const HISTORIAL_CAMBIOS = ['historial_cambios'] as const;

export const RPC_PERMITIDAS = ['get_dashboard_stats', 'get_fault_analytics', 'get_status_by_zone'] as const;

const METODOS = ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'] as const;
type Metodo = (typeof METODOS)[number];

type Clase = 'operativo' | 'catalogo' | 'historial' | 'rpc';

const METODOS_POR_CLASE: Record<Clase, readonly Metodo[]> = {
  operativo: METODOS,
  catalogo: METODOS,
  historial: METODOS,
  rpc: ['POST'],
};

// Parametros de query que no filtran filas
const PARAMETROS_NO_FILTRO = ['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'] as const;

export interface EntradaAcceso {
  method: string;
  path: string;
  query: URLSearchParams;
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

// path relativo al montaje: /recurso o /rpc/funcion
function clasificar(path: string): Clase | null {
  const segmentos = path.split('/').filter((segmento) => segmento !== '');

  if (segmentos.length === 2 && segmentos[0] === 'rpc') {
    return contiene(RPC_PERMITIDAS, segmentos[1]) ? 'rpc' : null;
  }
  if (segmentos.length !== 1) return null;

  const [recurso] = segmentos;
  if (contiene(RECURSOS_OPERATIVOS, recurso)) return 'operativo';
  if (contiene(CATALOGOS, recurso)) return 'catalogo';
  if (contiene(HISTORIAL_CAMBIOS, recurso)) return 'historial';
  return null;
}

function tienePermiso(clase: Clase, metodo: Metodo, rol: Rol): boolean {
  if (metodo === 'GET' || metodo === 'HEAD') return true;
  if (clase === 'catalogo') return rol === 'administrador';
  return clase !== 'historial';
}

function tieneFiltro(query: URLSearchParams): boolean {
  return [...query.keys()].some((clave) => !contiene(PARAMETROS_NO_FILTRO, clave));
}

export function evaluarAcceso({ method, path, query, rol }: EntradaAcceso): ResultadoAcceso {
  const clase = clasificar(path);
  if (clase === null) return denegado(404, 'No encontrado');

  if (!esMetodo(method) || !contiene(METODOS_POR_CLASE[clase], method)) {
    return denegado(405, 'Metodo no permitido');
  }
  if (!tienePermiso(clase, method, rol)) return denegado(403, 'Sin permisos');
  if ((method === 'PATCH' || method === 'DELETE') && !tieneFiltro(query)) {
    return denegado(400, 'Se requiere un filtro para modificar o eliminar');
  }

  return { permitido: true };
}
