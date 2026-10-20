import { useEffect, useState } from 'react';
import { AlertCircle, Package, Plus, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useServerList } from '@/hooks/useServerList';
import {
  equiposService,
  MODELOS_EQUIPO_PATH,
  type ModeloEquipo,
  type TipoEquipo,
} from '@/services/api/equiposApi';
import type { Filter } from '@/lib/postgrest';
import { DetailPanel } from '@/components/common/DetailPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { ListCard } from '@/components/common/ListCard';
import { Pagination } from '@/components/common/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModeloForm } from './ModeloForm';

const TODOS = '__all__';

interface FiltrosModelos {
  texto: string;
  id_tipo_equipamiento: string;
}

const FILTROS_INICIALES: FiltrosModelos = { texto: '', id_tipo_equipamiento: '' };

// El texto se aplica como busqueda por nombre (searchColumns), no como filtro.
const toFiltros = (filtros: FiltrosModelos): Filter[] => [
  { column: 'id_tipo_equipamiento', op: 'eq', value: filtros.id_tipo_equipamiento },
];

interface ModelosTabProps {
  // Se llama tras crear, editar o eliminar un modelo, para refrescar los catalogos de la pagina.
  onCambio: () => void;
}

export default function ModelosTab({ onCambio }: ModelosTabProps) {
  const { isAdmin } = useAuth();
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [errorTipos, setErrorTipos] = useState<string | null>(null);
  // null: panel cerrado; { modelo: null }: nuevo modelo.
  const [edicion, setEdicion] = useState<{ modelo: ModeloEquipo | null } | null>(null);

  useEffect(() => {
    equiposService
      .getTipos()
      .then(setTipos)
      .catch(() => setErrorTipos('No se pudieron cargar los tipos de equipamiento'));
  }, []);

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
  } = useServerList<ModeloEquipo, FiltrosModelos>({
    path: MODELOS_EQUIPO_PATH,
    select: '*,tipo:tipos_equipamiento(nombre)',
    pageSize: 20,
    defaultOrder: { column: 'nombre', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['nombre'],
    searchKey: 'texto',
  });

  const filtrosActivos = Object.values(filters).filter((valor) => valor !== '').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Catálogo de modelos por tipo de equipamiento.
        </p>
        {isAdmin && (
          <Button variant="brand" onClick={() => setEdicion({ modelo: null })} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo modelo
          </Button>
        )}
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
              placeholder="Buscar por nombre"
              className="w-full pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </FilterField>

        <FilterField label="Tipo" className="w-full md:w-52">
          <Select
            value={filters.id_tipo_equipamiento || TODOS}
            onValueChange={(valor) => setFilter('id_tipo_equipamiento', valor === TODOS ? '' : valor)}
          >
            <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.id_tipo_equipamiento} value={tipo.id_tipo_equipamiento}>
                  {tipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>

      {(error ?? errorTipos) && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-red-700 dark:text-red-300">
            {error ?? errorTipos}
            {error && (
              <Button variant="outline" size="sm" onClick={reload}>
                Reintentar
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <ListCard
        title="Listado de modelos"
        subtitle={total > 0 ? `${total} registros` : undefined}
        footer={<Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />}
      >
          {loading ? (
            <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando modelos...</p>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title={filtrosActivos > 0 ? 'No se encontraron modelos' : 'No hay modelos registrados'}
              description={filtrosActivos > 0 ? 'Prueba con otros filtros' : undefined}
              action={
                isAdmin &&
                filtrosActivos === 0 && (
                  <Button variant="outline" onClick={() => setEdicion({ modelo: null })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo modelo
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">País</TableHead>
                    <TableHead className="font-semibold">Voltaje</TableHead>
                    <TableHead className="font-semibold">Vatios</TableHead>
                    <TableHead className="font-semibold">Consumo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((modelo) => (
                    <TableRow
                      key={modelo.id_modelo_equipo}
                      onClick={isAdmin ? () => setEdicion({ modelo }) : undefined}
                      className={isAdmin ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : undefined}
                    >
                      <TableCell className="font-medium">{modelo.nombre}</TableCell>
                      <TableCell>{modelo.tipo?.nombre ?? '-'}</TableCell>
                      <TableCell>{modelo.pais ?? '-'}</TableCell>
                      <TableCell>{modelo.voltaje ?? '-'}</TableCell>
                      <TableCell>{modelo.vatios ?? '-'}</TableCell>
                      <TableCell>{modelo.consumo ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </ListCard>

      <DetailPanel
        open={edicion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEdicion(null);
        }}
        title={edicion?.modelo ? 'Editar modelo' : 'Nuevo modelo'}
      >
        {edicion && (
          <ModeloForm
            key={edicion.modelo?.id_modelo_equipo ?? 'nuevo'}
            modelo={edicion.modelo}
            tipos={tipos}
            onTerminado={() => {
              setEdicion(null);
              reload();
              onCambio();
            }}
            onCancelar={() => setEdicion(null)}
          />
        )}
      </DetailPanel>
    </div>
  );
}
