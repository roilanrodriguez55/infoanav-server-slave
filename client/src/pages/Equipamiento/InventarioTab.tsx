import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Package, Plus } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import {
  EQUIPOS_VISTA_PATH,
  equiposService,
  type EquipoRegistro,
  type EquiposCatalogos,
  type TipoEquipo,
} from '@/services/api/equiposApi';
import type { Filter } from '@/lib/postgrest';
import { DatePickerField } from '@/components/common/DatePickerField';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { DetailPanel } from '@/components/common/DetailPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { ListCard } from '@/components/common/ListCard';
import { Pagination } from '@/components/common/Pagination';
import { PillTabs } from '@/components/common/PillTabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { etiquetaSenal } from '@/lib/utils';
import { FichaEquipo } from './FichaEquipo';
import { EquipoForm } from './EquipoForm';
import { CambiarUbicacionDialog } from './CambiarUbicacionDialog';

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

interface FiltrosEquipos {
  inventario: string;
  id_empresa: string;
  id_modelo_equipo: string;
  proveedor: string;
  id_ubicacion_medio: string;
  desde: string;
  hasta: string;
}

const FILTROS_INICIALES: FiltrosEquipos = {
  inventario: '',
  id_empresa: '',
  id_modelo_equipo: '',
  proveedor: '',
  id_ubicacion_medio: '',
  desde: '',
  hasta: '',
};

type Panel =
  | { modo: 'ficha'; equipo: EquipoRegistro }
  | { modo: 'editar'; equipo: EquipoRegistro }
  | { modo: 'nuevo' }
  | null;

function SelectFiltro({
  value,
  onChange,
  opciones,
  todosLabel = 'Todas',
}: {
  value: string;
  onChange: (valor: string) => void;
  opciones: { id: string; nombre: string }[];
  todosLabel?: string;
}) {
  return (
    <Select value={value || TODOS} onValueChange={(valor) => onChange(valor === TODOS ? '' : valor)}>
      <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{todosLabel}</SelectItem>
        {opciones.map((opcion) => (
          <SelectItem key={opcion.id} value={opcion.id}>{opcion.nombre}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ListaEquiposProps {
  tipo: TipoEquipo;
  catalogos: EquiposCatalogos | null;
}

// Se monta con key por tipo: al cambiar de pestaña empieza en la pagina 1 con filtros vacios.
function ListaEquipos({ tipo, catalogos }: ListaEquiposProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const vida = searchParams.get('vida') ?? '';
  const fs = searchParams.get('fs') ?? '';
  const [panel, setPanel] = useState<Panel>(null);
  const [ubicacionDe, setUbicacionDe] = useState<EquipoRegistro | null>(null);

  const actualizarParams = (cambios: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) next.set(clave, valor);
      else next.delete(clave);
    }
    setSearchParams(next);
  };

  const toFilters = (filtros: FiltrosEquipos): Filter[] => [
    { column: 'id_tipo_equipamiento', op: 'eq', value: tipo.id_tipo_equipamiento },
    { column: 'numero_inventario', op: 'ilike', value: filtros.inventario },
    { column: 'id_empresa', op: 'eq', value: filtros.id_empresa },
    { column: 'id_modelo_equipo', op: 'eq', value: filtros.id_modelo_equipo },
    { column: 'proveedor', op: 'ilike', value: filtros.proveedor },
    { column: 'id_ubicacion_medio', op: 'eq', value: filtros.id_ubicacion_medio },
    { column: 'fecha_inicio_servicio', op: 'gte', value: filtros.desde },
    { column: 'fecha_inicio_servicio', op: 'lte', value: filtros.hasta },
    { column: 'vida_util_cumplida', op: 'eq', value: vida === 'cumplida' ? true : vida === 'vigente' ? false : '' },
    { column: 'fuera_servicio', op: 'eq', value: fs === 'fuera' ? true : fs === 'en' ? false : '' },
  ];

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
  } = useServerList<EquipoRegistro, FiltrosEquipos>({
    path: EQUIPOS_VISTA_PATH,
    select: '*',
    pageSize: 20,
    defaultOrder: { column: 'numero_inventario', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters,
  });

  const modelos = (catalogos?.modelos ?? []).filter((modelo) => modelo.id_tipo_equipamiento === tipo.id_tipo_equipamiento);
  const ubicaciones = catalogos?.ubicaciones ?? [];

  // Vida y F/S viven en la URL; el resto de filtros, en el hook.
  const filtrosActivos =
    Object.values(filters).filter((valor) => valor !== '').length + (vida ? 1 : 0) + (fs ? 1 : 0);

  const limpiarFiltros = () => {
    resetFilters();
    actualizarParams({ vida: '', fs: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total > 0 ? `${total} equipos` : 'Sin equipos registrados con estos filtros'}
        </p>
        <Button variant="brand" onClick={() => setPanel({ modo: 'nuevo' })} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo equipo
        </Button>
      </div>

      <FilterBar onReset={limpiarFiltros} activeCount={filtrosActivos}>
        <FilterField label="Inventario" className="w-full md:w-44">
          <DebouncedInput
            value={filters.inventario}
            onValueChange={(valor) => setFilter('inventario', valor)}
            placeholder="Número de inventario"
            className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </FilterField>

        <FilterField label="Empresa" className="w-full md:w-48">
          <SelectFiltro
            value={filters.id_empresa}
            onChange={(valor) => setFilter('id_empresa', valor)}
            opciones={catalogos?.empresas ?? []}
          />
        </FilterField>

        <FilterField label="Modelo" className="w-full md:w-48">
          <SelectFiltro
            value={filters.id_modelo_equipo}
            onChange={(valor) => setFilter('id_modelo_equipo', valor)}
            opciones={modelos.map((modelo) => ({ id: modelo.id_modelo_equipo, nombre: modelo.nombre }))}
          />
        </FilterField>

        <FilterField label="Proveedor" className="w-full md:w-40">
          <DebouncedInput
            value={filters.proveedor}
            onValueChange={(valor) => setFilter('proveedor', valor)}
            className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </FilterField>

        <FilterField label="Ubicación" className="w-full md:w-48">
          <SelectFiltro
            value={filters.id_ubicacion_medio}
            onChange={(valor) => setFilter('id_ubicacion_medio', valor)}
            opciones={ubicaciones.map((ubicacion) => ({ id: ubicacion.id_ubicacion_medio, nombre: ubicacion.nombre }))}
          />
        </FilterField>

        <FilterField label="Vida útil" className="w-full md:w-40">
          <SelectFiltro
            value={vida}
            onChange={(valor) => actualizarParams({ vida: valor })}
            opciones={[
              { id: 'cumplida', nombre: 'Cumplida' },
              { id: 'vigente', nombre: 'Vigente' },
            ]}
          />
        </FilterField>

        <FilterField label="F/S" className="w-full md:w-44">
          <SelectFiltro
            value={fs}
            onChange={(valor) => actualizarParams({ fs: valor })}
            opciones={[
              { id: 'fuera', nombre: 'Fuera de servicio' },
              { id: 'en', nombre: 'En servicio' },
            ]}
          />
        </FilterField>

        <FilterField label="Inicio de servicio desde" className="w-full md:w-44">
          <DatePickerField
            value={filters.desde}
            onChange={(valor) => setFilter('desde', valor)}
            aria-label="Inicio de servicio desde"
            className="w-full"
          />
        </FilterField>

        <FilterField label="Hasta" className="w-full md:w-44">
          <DatePickerField
            value={filters.hasta}
            onChange={(valor) => setFilter('hasta', valor)}
            aria-label="Inicio de servicio hasta"
            className="w-full"
          />
        </FilterField>
      </FilterBar>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-red-700 dark:text-red-300">
            {error}
            <Button variant="outline" size="sm" onClick={reload}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ListCard
        title="Listado de equipos"
        subtitle={tipo.nombre}
        footer={<Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />}
      >
          {loading ? (
            <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando equipos...</p>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Package />}
              title={filtrosActivos > 0 ? 'No se encontraron equipos' : 'No hay equipos de este tipo'}
              description={filtrosActivos > 0 ? 'Prueba con otros filtros' : undefined}
              action={
                filtrosActivos === 0 && (
                  <Button variant="outline" onClick={() => setPanel({ modo: 'nuevo' })}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo equipo
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Inventario</TableHead>
                    <TableHead className="font-semibold">Modelo</TableHead>
                    <TableHead className="font-semibold">Empresa</TableHead>
                    <TableHead className="font-semibold">Ubicación</TableHead>
                    <TableHead className="font-semibold">LSM actual</TableHead>
                    <TableHead className="font-semibold">F/S</TableHead>
                    <TableHead className="font-semibold">Vida útil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((equipo) => (
                    <TableRow
                      key={equipo.id_equipo}
                      onClick={() => setPanel({ modo: 'ficha', equipo })}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="font-medium">{equipo.numero_inventario}</TableCell>
                      <TableCell>{equipo.modelo_nombre ?? '-'}</TableCell>
                      <TableCell>{equipo.empresa_nombre ?? '-'}</TableCell>
                      <TableCell>{equipo.ubicacion_nombre ?? '-'}</TableCell>
                      <TableCell>
                        {equipo.codigo_lsm ? etiquetaSenal(equipo.codigo_lsm, equipo.senal_nombre) : '-'}
                      </TableCell>
                      <TableCell>
                        {equipo.fuera_servicio ? (
                          <Badge variant="destructive">F/S</Badge>
                        ) : (
                          <Badge variant="secondary">En servicio</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {equipo.vida_util_cumplida ? (
                          <Badge variant="destructive">Cumplida</Badge>
                        ) : equipo.dias_vida_restantes !== null ? (
                          `${equipo.dias_vida_restantes} días`
                        ) : (
                          '-'
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
        title={
          panel?.modo === 'nuevo'
            ? 'Nuevo equipo'
            : panel?.modo === 'editar'
              ? 'Editar equipo'
              : panel?.equipo.numero_inventario ?? ''
        }
        description={tipo.nombre}
      >
        {panel?.modo === 'ficha' && (
          <FichaEquipo
            key={panel.equipo.id_equipo}
            equipo={panel.equipo}
            onEditar={() => setPanel({ modo: 'editar', equipo: panel.equipo })}
            onCambiarUbicacion={() => {
              setUbicacionDe(panel.equipo);
            }}
            onEliminado={() => {
              setPanel(null);
              reload();
            }}
          />
        )}
        {(panel?.modo === 'nuevo' || panel?.modo === 'editar') && catalogos && (
          <EquipoForm
            key={panel.modo === 'editar' ? panel.equipo.id_equipo : 'nuevo'}
            tipo={tipo}
            catalogos={catalogos}
            equipo={panel.modo === 'editar' ? panel.equipo : null}
            onTerminado={() => {
              setPanel(null);
              reload();
            }}
            onCancelar={() => setPanel(null)}
          />
        )}
      </DetailPanel>

      <CambiarUbicacionDialog
        equipo={ubicacionDe}
        ubicaciones={ubicaciones}
        onOpenChange={(abierto) => {
          if (!abierto) setUbicacionDe(null);
        }}
        onTerminado={() => {
          setUbicacionDe(null);
          setPanel(null);
          reload();
        }}
      />
    </div>
  );
}

interface InventarioTabProps {
  catalogos: EquiposCatalogos | null;
}

export default function InventarioTab({ catalogos }: InventarioTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [errorTipos, setErrorTipos] = useState<string | null>(null);

  useEffect(() => {
    equiposService
      .getTipos()
      .then(setTipos)
      .catch(() => setErrorTipos('No se pudieron cargar los tipos de equipamiento'));
  }, []);

  const tipoParam = searchParams.get('tipo');
  const tipoActivo = tipos.find((tipo) => tipo.id_tipo_equipamiento === tipoParam) ?? tipos[0];

  const elegirTipo = (idTipo: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tipo', idTipo);
    setSearchParams(next);
  };

  if (errorTipos) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-700 dark:text-red-300">{errorTipos}</AlertDescription>
      </Alert>
    );
  }

  if (!tipoActivo) {
    return <p className="py-12 text-center text-gray-500 dark:text-gray-400">Cargando tipos de equipamiento...</p>;
  }

  return (
    <div className="space-y-6">
      <PillTabs
        tabs={tipos.map((tipo) => ({ value: tipo.id_tipo_equipamiento, label: tipo.nombre }))}
        value={tipoActivo.id_tipo_equipamiento}
        onChange={elegirTipo}
      />

      <ListaEquipos key={tipoActivo.id_tipo_equipamiento} tipo={tipoActivo} catalogos={catalogos} />
    </div>
  );
}
