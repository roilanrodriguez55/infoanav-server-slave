import { useState } from 'react';
import { AlertCircle, BookOpen, Plus, Search } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import {
  LIBROS_VISTA_PATH,
  type LibroRegistro,
} from '@/services/api/documentacionApi';
import type { Filter } from '@/lib/postgrest';
import { DetailPanel } from '@/components/common/DetailPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { ListCard } from '@/components/common/ListCard';
import { Pagination } from '@/components/common/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCatalogosDocumentacion } from './useCatalogosDocumentacion';
import LibroFicha from './LibroFicha';
import LibroForm from './LibroForm';

type ModoAnio = '' | 'exacto' | 'rango' | 'antes' | 'despues';
type Disponibilidad = '' | 'disponible' | 'prestado';

interface FiltrosLibros {
  texto: string;
  id_tema: string;
  id_tipo_documento: string;
  id_editorial: string;
  id_idioma: string;
  id_pais: string;
  estado_tecnico: string;
  ubicacion: string;
  anio_modo: ModoAnio;
  anio_a: string;
  anio_b: string;
  disponibilidad: Disponibilidad;
}

type PanelLibro = { modo: 'ficha'; libro: LibroRegistro } | { modo: 'form'; libro: LibroRegistro | null };

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const FILTROS_INICIALES: FiltrosLibros = {
  texto: '',
  id_tema: '',
  id_tipo_documento: '',
  id_editorial: '',
  id_idioma: '',
  id_pais: '',
  estado_tecnico: '',
  ubicacion: '',
  anio_modo: '',
  anio_a: '',
  anio_b: '',
  disponibilidad: '',
};

const filtrosAnio = (filtros: FiltrosLibros): Filter[] => {
  const { anio_modo: modo, anio_a: a, anio_b: b } = filtros;
  if (modo === 'exacto') return [{ column: 'ano_publicacion', op: 'eq', value: a }];
  if (modo === 'rango') return [
    { column: 'ano_publicacion', op: 'gte', value: a },
    { column: 'ano_publicacion', op: 'lte', value: b },
  ];
  if (modo === 'antes') return [{ column: 'ano_publicacion', op: 'lt', value: a }];
  if (modo === 'despues') return [{ column: 'ano_publicacion', op: 'gt', value: a }];
  return [];
};

const toFiltros = (filtros: FiltrosLibros): Filter[] => [
  { column: 'id_tema', op: 'eq', value: filtros.id_tema },
  { column: 'id_tipo_documento', op: 'eq', value: filtros.id_tipo_documento },
  { column: 'id_editorial', op: 'eq', value: filtros.id_editorial },
  { column: 'id_idioma', op: 'eq', value: filtros.id_idioma },
  { column: 'id_pais', op: 'eq', value: filtros.id_pais },
  { column: 'estado_tecnico', op: 'ilike', value: filtros.estado_tecnico },
  { column: 'ubicacion', op: 'ilike', value: filtros.ubicacion },
  ...filtrosAnio(filtros),
  ...(filtros.disponibilidad === ''
    ? []
    : [{ column: 'prestado', op: 'eq' as const, value: filtros.disponibilidad === 'prestado' }]),
];

// Cada filtro con valor cuenta como activo.
const contarActivos = (filtros: FiltrosLibros): number =>
  Object.values(filtros).filter((valor) => valor !== '').length;

const autorDe = (libro: LibroRegistro) =>
  [libro.autor_apellidos, libro.autor_nombre].filter(Boolean).join(', ') || '-';

export default function LibrosTab() {
  const {
    rows,
    total,
    page,
    pageSize,
    setPage,
    filters,
    setFilter,
    resetFilters,
    loading,
    error,
    reload,
  } = useServerList<LibroRegistro, FiltrosLibros>({
    path: LIBROS_VISTA_PATH,
    select: '*',
    pageSize: 20,
    defaultOrder: { column: 'titulo', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['titulo', 'autor_apellidos', 'codigo'],
    searchKey: 'texto',
  });

  const { catalogos, error: errorCatalogos, crearEn } = useCatalogosDocumentacion();
  const [panel, setPanel] = useState<PanelLibro | null>(null);

  const filtrosActivos = contarActivos(filters);

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">Libros de la biblioteca y su disponibilidad</p>
          <Button variant="brand" onClick={() => setPanel({ modo: 'form', libro: null })} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo libro
          </Button>
        </div>

        <FilterBar onReset={resetFilters} activeCount={filtrosActivos}>
          <FilterField label="Buscar" className="w-full md:w-72">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-icon" />
              </div>
              <Input
                value={filters.texto}
                onChange={(e) => setFilter('texto', e.target.value)}
                placeholder="Título, autor o código"
                className="w-full pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </FilterField>

          <SelectFiltro
            etiqueta="Tema"
            valor={filters.id_tema}
            opciones={catalogos.temas}
            onChange={(valor) => setFilter('id_tema', valor)}
          />
          <SelectFiltro
            etiqueta="Tipo"
            valor={filters.id_tipo_documento}
            opciones={catalogos.tiposDocumento}
            onChange={(valor) => setFilter('id_tipo_documento', valor)}
          />
          <SelectFiltro
            etiqueta="Editorial"
            valor={filters.id_editorial}
            opciones={catalogos.editoriales}
            onChange={(valor) => setFilter('id_editorial', valor)}
          />
          <SelectFiltro
            etiqueta="Idioma"
            valor={filters.id_idioma}
            opciones={catalogos.idiomas}
            onChange={(valor) => setFilter('id_idioma', valor)}
          />
          <SelectFiltro
            etiqueta="País"
            valor={filters.id_pais}
            opciones={catalogos.paises}
            onChange={(valor) => setFilter('id_pais', valor)}
          />

          <FilterField label="Estado técnico" className="w-full md:w-40">
            <Input
              value={filters.estado_tecnico}
              onChange={(e) => setFilter('estado_tecnico', e.target.value)}
              className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </FilterField>

          <FilterField label="Ubicación" className="w-full md:w-40">
            <Input
              value={filters.ubicacion}
              onChange={(e) => setFilter('ubicacion', e.target.value)}
              className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </FilterField>

          <FilterField label="Año" className="w-full md:w-44">
            <Select
              value={filters.anio_modo || TODOS}
              onValueChange={(valor) => setFilter('anio_modo', valor === TODOS ? '' : (valor as ModoAnio))}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Cualquiera</SelectItem>
                <SelectItem value="exacto">Exacto</SelectItem>
                <SelectItem value="rango">Desde - hasta</SelectItem>
                <SelectItem value="antes">Antes de</SelectItem>
                <SelectItem value="despues">Después de</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          {filters.anio_modo !== '' && (
            <FilterField label={filters.anio_modo === 'rango' ? 'Año desde' : 'Año'} className="w-full md:w-28">
              <Input
                type="number"
                value={filters.anio_a}
                onChange={(e) => setFilter('anio_a', e.target.value)}
                className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </FilterField>
          )}
          {filters.anio_modo === 'rango' && (
            <FilterField label="Año hasta" className="w-full md:w-28">
              <Input
                type="number"
                value={filters.anio_b}
                onChange={(e) => setFilter('anio_b', e.target.value)}
                className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </FilterField>
          )}

          <FilterField label="Disponibilidad" className="w-full md:w-40">
            <Select
              value={filters.disponibilidad || TODOS}
              onValueChange={(valor) => setFilter('disponibilidad', valor === TODOS ? '' : (valor as Disponibilidad))}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="prestado">Prestado</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </FilterBar>
      </div>

      {(error ?? errorCatalogos) && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-red-700 dark:text-red-300">
            {error ?? errorCatalogos}
            {error && (
              <Button variant="outline" size="sm" onClick={reload}>
                Reintentar
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <ListCard
        title="Listado de libros"
        actions={
          total > 0 ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">({total} registros)</span>
          ) : undefined
        }
        footer={<Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />}
      >
        {loading ? (
          <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando libros...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title={filtrosActivos > 0 ? 'No se encontraron libros con esos filtros' : 'No hay libros registrados'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Título</TableHead>
                  <TableHead className="font-semibold">Autor</TableHead>
                  <TableHead className="font-semibold">Tema</TableHead>
                  <TableHead className="font-semibold">Editorial</TableHead>
                  <TableHead className="font-semibold">Año</TableHead>
                  <TableHead className="font-semibold">Disponibilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((libro) => (
                  <TableRow
                    key={libro.id_libro}
                    onClick={() => setPanel({ modo: 'ficha', libro })}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell className="font-medium">{libro.titulo}</TableCell>
                    <TableCell>{autorDe(libro)}</TableCell>
                    <TableCell>{libro.tema_nombre ?? '-'}</TableCell>
                    <TableCell>{libro.editorial_nombre ?? '-'}</TableCell>
                    <TableCell>{libro.ano_publicacion ?? '-'}</TableCell>
                    <TableCell>
                      {libro.prestado ? (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                          {libro.prestamo_vencido ? 'Prestado (vencido)' : 'Prestado'}
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Disponible</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ListCard>

      <DetailPanel
        open={panel !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setPanel(null);
        }}
        title={panel?.modo === 'form' ? (panel.libro ? 'Editar libro' : 'Nuevo libro') : 'Ficha del libro'}
      >
        {panel?.modo === 'ficha' && (
          <LibroFicha
            libro={panel.libro}
            onEditar={() => setPanel({ modo: 'form', libro: panel.libro })}
            onCambio={() => {
              setPanel(null);
              reload();
            }}
          />
        )}
        {panel?.modo === 'form' && (
          <LibroForm
            key={panel.libro?.id_libro ?? 'nuevo'}
            libro={panel.libro}
            catalogos={catalogos}
            crearEn={crearEn}
            onTerminado={() => {
              setPanel(null);
              reload();
            }}
            onCancelar={() => setPanel(null)}
          />
        )}
      </DetailPanel>
    </div>
  );
}

interface SelectFiltroProps {
  etiqueta: string;
  valor: string;
  opciones: { id: string; nombre: string }[];
  onChange: (valor: string) => void;
}

function SelectFiltro({ etiqueta, valor, opciones, onChange }: SelectFiltroProps) {
  return (
    <FilterField label={etiqueta} className="w-full md:w-52">
      <Select value={valor || TODOS} onValueChange={(nuevo) => onChange(nuevo === TODOS ? '' : nuevo)}>
        <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.id} value={opcion.id}>{opcion.nombre}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterField>
  );
}
