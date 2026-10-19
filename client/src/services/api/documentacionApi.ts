import api from '@/services/config/axiosConfig';
import type { AxiosError } from 'axios';
import type { CatalogoItem } from './senalesApi';
import { parseContentRange } from '@/lib/postgrest';

export const LIBROS_VISTA_PATH = '/v_libros';
export const LIBROS_PATH = '/libros';
export const PRESTAMOS_PATH = '/prestamos';
export const PRESTAMO_SELECT = '*,libro:libros(titulo,codigo,autor_apellidos)';
export const PLAZO_PRESTAMO_DIAS = 14;
export const ESTADOS_DEVOLUCION = ['Bueno', 'Regular', 'Malo'] as const;

// Catalogos que cualquier usuario autenticado puede crear (clase catalogo_abierto del gateway).
export const CATALOGOS_CREABLES = {
  temas: 'id_tema',
  paises: 'id_pais',
  editoriales: 'id_editorial',
} as const;
export type CatalogoCreable = keyof typeof CATALOGOS_CREABLES;

export interface CatalogosLibros {
  temas: CatalogoItem[];
  tiposDocumento: CatalogoItem[];
  paises: CatalogoItem[];
  editoriales: CatalogoItem[];
  idiomas: CatalogoItem[];
}

// Fila de la vista v_libros: columnas del libro, nombres de catalogos y estado del prestamo abierto.
export interface LibroRegistro {
  id_libro: string;
  titulo: string;
  id_tema: string | null;
  autor_nombre: string | null;
  autor_apellidos: string | null;
  codigo: string | null;
  id_tipo_documento: string | null;
  id_pais: string | null;
  ano_publicacion: number | null;
  id_editorial: string | null;
  paginas: string | null;
  nivel: string | null;
  id_idioma: string | null;
  estado_tecnico: string | null;
  notas: string | null;
  precio: number | null;
  tipo_portada: string | null;
  fecha_compra: string | null;
  ubicacion: string | null;
  tema_nombre: string | null;
  tipo_documento_nombre: string | null;
  pais_nombre: string | null;
  editorial_nombre: string | null;
  idioma_nombre: string | null;
  prestado: boolean;
  id_prestamo_abierto: string | null;
  a_quien_abierto: string | null;
  fecha_a_devolver_abierto: string | null;
  prestamo_vencido: boolean;
}

export interface LibroCampos {
  titulo: string;
  id_tema: string | null;
  autor_nombre: string | null;
  autor_apellidos: string | null;
  codigo: string | null;
  id_tipo_documento: string | null;
  id_pais: string | null;
  ano_publicacion: number | null;
  id_editorial: string | null;
  paginas: string | null;
  nivel: string | null;
  id_idioma: string | null;
  estado_tecnico: string | null;
  notas: string | null;
  precio: number | null;
  tipo_portada: string | null;
  fecha_compra: string | null;
  ubicacion: string | null;
}

// Valores del formulario: todo texto; la conversion ocurre en libroACampos.
export type LibroTexto = { [K in keyof LibroCampos]: string };

export interface PrestamoRegistro {
  id_prestamo: string;
  id_libro: string;
  fecha_prestamo: string;
  fecha_a_devolver: string | null;
  fecha_devolucion: string | null;
  quien_presta: string | null;
  a_quien: string | null;
  estado_devolucion: string | null;
  observaciones: string | null;
  libro: { titulo: string; codigo: string | null; autor_apellidos: string | null } | null;
}

export interface DocumentacionResponse {
  success: boolean;
  message: string;
}

export interface NuevoPrestamo {
  idLibro: string;
  aQuien: string;
  quienPresta: string;
}

export const LIBRO_VACIO: LibroTexto = {
  titulo: '',
  id_tema: '',
  autor_nombre: '',
  autor_apellidos: '',
  codigo: '',
  id_tipo_documento: '',
  id_pais: '',
  ano_publicacion: '',
  id_editorial: '',
  paginas: '',
  nivel: '',
  id_idioma: '',
  estado_tecnico: '',
  notas: '',
  precio: '',
  tipo_portada: '',
  fecha_compra: '',
  ubicacion: '',
};

const textoONulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());
const numeroONulo = (valor: string): number | null => (valor.trim() === '' ? null : Number(valor));
const aTexto = (valor: string | number | null | undefined): string =>
  valor === null || valor === undefined ? '' : String(valor);

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

// Fecha de calendario en hora local ('YYYY-MM-DD'), para columnas date. Nunca toISOString.
export const fechaLocal = (fecha: Date = new Date()): string =>
  `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;

export const sumarDias = (fecha: Date, dias: number): Date =>
  new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);

export const libroATexto = (libro: LibroRegistro): LibroTexto => ({
  titulo: libro.titulo,
  id_tema: aTexto(libro.id_tema),
  autor_nombre: aTexto(libro.autor_nombre),
  autor_apellidos: aTexto(libro.autor_apellidos),
  codigo: aTexto(libro.codigo),
  id_tipo_documento: aTexto(libro.id_tipo_documento),
  id_pais: aTexto(libro.id_pais),
  ano_publicacion: aTexto(libro.ano_publicacion),
  id_editorial: aTexto(libro.id_editorial),
  paginas: aTexto(libro.paginas),
  nivel: aTexto(libro.nivel),
  id_idioma: aTexto(libro.id_idioma),
  estado_tecnico: aTexto(libro.estado_tecnico),
  notas: aTexto(libro.notas),
  precio: aTexto(libro.precio),
  tipo_portada: aTexto(libro.tipo_portada),
  fecha_compra: aTexto(libro.fecha_compra).slice(0, 10),
  ubicacion: aTexto(libro.ubicacion),
});

export const libroACampos = (texto: LibroTexto): LibroCampos => ({
  titulo: texto.titulo.trim(),
  id_tema: textoONulo(texto.id_tema),
  autor_nombre: textoONulo(texto.autor_nombre),
  autor_apellidos: textoONulo(texto.autor_apellidos),
  codigo: textoONulo(texto.codigo),
  id_tipo_documento: textoONulo(texto.id_tipo_documento),
  id_pais: textoONulo(texto.id_pais),
  ano_publicacion: numeroONulo(texto.ano_publicacion),
  id_editorial: textoONulo(texto.id_editorial),
  paginas: textoONulo(texto.paginas),
  nivel: textoONulo(texto.nivel),
  id_idioma: textoONulo(texto.id_idioma),
  estado_tecnico: textoONulo(texto.estado_tecnico),
  notas: textoONulo(texto.notas),
  precio: numeroONulo(texto.precio),
  tipo_portada: textoONulo(texto.tipo_portada),
  fecha_compra: textoONulo(texto.fecha_compra),
  ubicacion: textoONulo(texto.ubicacion),
});

const mensajeError = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? axiosError.message;
};

const catalogo = async (tabla: string, columna: string): Promise<CatalogoItem[]> => {
  const response = await api.get<Record<string, string>[]>(
    `/${tabla}?select=${columna},nombre&deleted_at=is.null&order=nombre.asc`
  );
  return response.data.map((fila) => ({ id: fila[columna], nombre: fila.nombre }));
};

// Cuenta los prestamos abiertos con fecha de devolucion vencida (fecha_a_devolver anterior a hoy).
export async function contarPrestamosVencidos(): Promise<number> {
  const response = await api.get<unknown>(
    `${PRESTAMOS_PATH}?select=id_prestamo&deleted_at=is.null&fecha_devolucion=is.null&fecha_a_devolver=lt.${fechaLocal()}&limit=1`,
    { headers: { Prefer: 'count=exact' } }
  );
  const cabecera = response.headers['content-range'] as string | undefined;
  return parseContentRange(cabecera).total ?? 0;
}

export const documentacionService = {
  getCatalogos: async (): Promise<CatalogosLibros> => {
    const [temas, tiposDocumento, paises, editoriales, idiomas] = await Promise.all([
      catalogo('temas', 'id_tema'),
      catalogo('tipos_documento', 'id_tipo_documento'),
      catalogo('paises', 'id_pais'),
      catalogo('editoriales', 'id_editorial'),
      catalogo('idiomas', 'id_idioma'),
    ]);
    return { temas, tiposDocumento, paises, editoriales, idiomas };
  },

  // Lanza Error con el mensaje del servidor si no se pudo crear.
  crearCatalogo: async (tabla: CatalogoCreable, nombre: string): Promise<CatalogoItem> => {
    try {
      const columna = CATALOGOS_CREABLES[tabla];
      const response = await api.post<Record<string, string>[]>(
        `/${tabla}`,
        { nombre: nombre.trim() },
        { headers: { Prefer: 'return=representation' } }
      );
      const [fila] = response.data;
      return { id: fila[columna], nombre: fila.nombre };
    } catch (error: unknown) {
      throw new Error(mensajeError(error));
    }
  },

  create: async (campos: LibroCampos): Promise<DocumentacionResponse> => {
    try {
      await api.post(LIBROS_PATH, campos);
      return { success: true, message: 'Libro creado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  update: async (id: string, campos: LibroCampos): Promise<DocumentacionResponse> => {
    try {
      await api.patch(`${LIBROS_PATH}?id_libro=eq.${id}`, campos);
      return { success: true, message: 'Libro actualizado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  // La fecha de prestamo es hoy y el plazo de devolucion son PLAZO_PRESTAMO_DIAS dias despues.
  prestar: async ({ idLibro, aQuien, quienPresta }: NuevoPrestamo): Promise<DocumentacionResponse> => {
    try {
      const hoy = new Date();
      await api.post(PRESTAMOS_PATH, {
        id_libro: idLibro,
        a_quien: textoONulo(aQuien),
        quien_presta: textoONulo(quienPresta),
        fecha_prestamo: fechaLocal(hoy),
        fecha_a_devolver: fechaLocal(sumarDias(hoy, PLAZO_PRESTAMO_DIAS)),
      });
      return { success: true, message: 'Préstamo registrado' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },

  devolver: async (
    idPrestamo: string,
    estadoDevolucion: string,
    observaciones: string
  ): Promise<DocumentacionResponse> => {
    try {
      await api.patch(`${PRESTAMOS_PATH}?id_prestamo=eq.${idPrestamo}`, {
        fecha_devolucion: fechaLocal(),
        estado_devolucion: estadoDevolucion,
        observaciones: textoONulo(observaciones),
      });
      return { success: true, message: 'Devolución registrada' };
    } catch (error: unknown) {
      return { success: false, message: mensajeError(error) };
    }
  },
};
