import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Search, ShieldAlert } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import { senalesService, type CatalogoItem } from '@/services/api/senalesApi';
import {
  HECHOS_PATH,
  HECHOS_SELECT,
  getEmpresas,
  type HechoRegistro,
} from '@/services/api/hechosApi';
import type { Filter } from '@/lib/postgrest';
import { etiquetaSenal } from '@/lib/utils';
import { DatePickerField } from '@/components/common/DatePickerField';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { DetailPanel } from '@/components/common/DetailPanel';
import { EmptyState } from '@/components/common/EmptyState';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { ListCard } from '@/components/common/ListCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import HechoForm from '@/components/senal/HechoForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FiltrosHechos {
  texto: string;
  id_senal: string;
  id_empresa: string;
  anio: string;
  desde: string;
  hasta: string;
  vandalico: string;
  estado: string;
}

interface SenalOpcion {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
}

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const FILTROS_INICIALES: FiltrosHechos = {
  texto: '',
  id_senal: '',
  id_empresa: '',
  anio: '',
  desde: '',
  hasta: '',
  vandalico: '',
  estado: '',
};

const toFiltros = (filtros: FiltrosHechos): Filter[] => {
  const anio = /^\d{4}$/.test(filtros.anio) ? filtros.anio : '';
  const vandalico = filtros.vandalico === 'si' ? true : filtros.vandalico === 'no' ? false : '';
  const concluso = filtros.estado === 'concluidos' ? true : filtros.estado === 'pendientes' ? false : '';

  return [
    { column: 'id_senal', op: 'eq', value: filtros.id_senal },
    { column: 'senal.id_empresa', op: 'eq', value: filtros.id_empresa },
    { column: 'fecha', op: 'gte', value: anio ? `${anio}-01-01` : '' },
    { column: 'fecha', op: 'lte', value: anio ? `${anio}-12-31` : '' },
    { column: 'fecha', op: 'gte', value: filtros.desde },
    { column: 'fecha', op: 'lte', value: filtros.hasta },
    { column: 'vandalico', op: 'eq', value: vandalico },
    { column: 'concluso', op: 'eq', value: concluso },
  ];
};

// Las fechas de tipo date llegan como 'YYYY-MM-DD'; se interpretan en hora local para no restar un dia.
const formatearFecha = (fecha: string | null) =>
  fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES') : '-';

export default function HechosPage() {
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
  } = useServerList<HechoRegistro, FiltrosHechos>({
    path: HECHOS_PATH,
    select: HECHOS_SELECT,
    pageSize: 20,
    defaultOrder: { column: 'fecha', dir: 'desc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['hecho', 'reporta', 'ogo'],
    searchKey: 'texto',
  });

  const [empresas, setEmpresas] = useState<CatalogoItem[]>([]);
  const [senales, setSenales] = useState<SenalOpcion[]>([]);
  const [edicion, setEdicion] = useState<{ hecho: HechoRegistro | null } | null>(null);

  useEffect(() => {
    void getEmpresas().then(setEmpresas).catch(() => undefined);
    void senalesService.getSenales().then((res) => {
      if (res.success && Array.isArray(res.data)) setSenales(res.data as SenalOpcion[]);
    });
  }, []);

  const opcionesSenal: CatalogoItem[] = senales.map((senal) => ({
    id: senal.id_senal,
    nombre: etiquetaSenal(senal.codigo_lsm, senal.nombre),
  }));

  // Cada campo con valor cuenta como filtro activo.
  const filtrosActivos = Object.values(filters).filter((valor) => valor !== '').length;

  return (
    <div className="w-full min-w-0">
      <PageHeader
        icon={<ShieldAlert />}
        title="Hechos extraordinarios"
        subtitle="Hechos ocurridos en las señales marítimas"
        actions={
          <Button
            variant="brand"
            onClick={() => setEdicion({ hecho: null })}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo hecho
          </Button>
        }
      />

      <div className="mb-6">
        <FilterBar onReset={resetFilters} activeCount={filtrosActivos}>
          <FilterField label="Buscar" className="w-full md:w-72">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-icon" />
              </div>
              <Input
                value={filters.texto}
                onChange={(e) => setFilter('texto', e.target.value)}
                placeholder="Buscar por hecho, reporta u OGO"
                className="w-full pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </FilterField>

          <FilterField label="Señal" className="w-full md:w-72">
            <CommandSelect
              hideLabel
              label="Señal"
              className="h-8 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Todas"
              searchPlaceholder="Buscar por código o nombre..."
              items={opcionesSenal}
              value={filters.id_senal}
              onValueChange={(valor) => setFilter('id_senal', valor)}
            />
          </FilterField>

          <FilterField label="Empresa" className="w-full md:w-52">
            <Select
              value={filters.id_empresa || TODOS}
              onValueChange={(valor) => setFilter('id_empresa', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>{empresa.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Año" className="w-full md:w-28">
            <DebouncedInput
              type="number"
              value={filters.anio}
              onValueChange={(valor) => setFilter('anio', valor)}
              placeholder="Ej. 2026"
              className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
          </FilterField>

          <FilterField label="Desde" className="w-full md:w-44">
            <DatePickerField
              value={filters.desde}
              onChange={(valor) => setFilter('desde', valor)}
              aria-label="Desde"
              className="w-full"
            />
          </FilterField>

          <FilterField label="Hasta" className="w-full md:w-44">
            <DatePickerField
              value={filters.hasta}
              onChange={(valor) => setFilter('hasta', valor)}
              aria-label="Hasta"
              className="w-full"
            />
          </FilterField>

          <FilterField label="Vandálico" className="w-full md:w-36">
            <Select
              value={filters.vandalico || TODOS}
              onValueChange={(valor) => setFilter('vandalico', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                <SelectItem value="si">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Estado" className="w-full md:w-40">
            <Select
              value={filters.estado || TODOS}
              onValueChange={(valor) => setFilter('estado', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                <SelectItem value="pendientes">Pendientes</SelectItem>
                <SelectItem value="concluidos">Concluidos</SelectItem>
              </SelectContent>
            </Select>
          </FilterField>
        </FilterBar>
      </div>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
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
        title="Listado de hechos"
        actions={total > 0 ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">({total} registros)</span>
        ) : undefined}
        footer={
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />
        }
      >
        {loading ? (
          <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando hechos...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ShieldAlert />}
            title={filtrosActivos > 0 ? 'No se encontraron hechos con esos filtros.' : 'No hay hechos registrados.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Señal</TableHead>
                  <TableHead className="font-semibold">Hecho</TableHead>
                  <TableHead className="font-semibold">Reporta</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Vandálico</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((hecho) => (
                  <TableRow
                    key={hecho.id_hecho}
                    onClick={() => setEdicion({ hecho })}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell className="font-medium">{formatearFecha(hecho.fecha)}</TableCell>
                    <TableCell>
                      {hecho.senal ? etiquetaSenal(hecho.senal.codigo_lsm, hecho.senal.nombre) : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{hecho.hecho ?? '-'}</TableCell>
                    <TableCell>{hecho.reporta ?? '-'}</TableCell>
                    <TableCell>{hecho.senal?.empresa?.nombre ?? '-'}</TableCell>
                    <TableCell>{hecho.vandalico ? 'Sí' : 'No'}</TableCell>
                    <TableCell>
                      <Badge variant={hecho.concluso ? 'secondary' : 'outline'}>
                        {hecho.concluso ? 'Concluido' : 'Pendiente'}
                      </Badge>
                    </TableCell>
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
        title={edicion?.hecho ? 'Editar hecho' : 'Nuevo hecho'}
        description={edicion?.hecho?.senal ? etiquetaSenal(edicion.hecho.senal.codigo_lsm, edicion.hecho.senal.nombre) : undefined}
      >
        {edicion && (
          <HechoForm
            key={edicion.hecho?.id_hecho ?? 'nuevo'}
            idSenal={null}
            hecho={edicion.hecho}
            onTerminado={() => {
              setEdicion(null);
              reload();
            }}
            onCancelar={() => setEdicion(null)}
          />
        )}
      </DetailPanel>
    </div>
  );
}
