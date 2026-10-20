import { useEffect, useState } from 'react';
import { AlertCircle, Plus, Radio, Search } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import { senalesService } from '@/services/api/senalesApi';
import {
  RACON_PATH,
  RACON_SELECT,
  raconService,
  type RaconRegistro,
} from '@/services/api/raconApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import type { Filter } from '@/lib/postgrest';
import { DebouncedInput } from '@/components/common/DebouncedInput';
import { DetailPanel } from '@/components/common/DetailPanel';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { Pagination } from '@/components/common/Pagination';
import RaconForm from '@/components/senal/RaconForm';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { etiquetaSenal } from '@/lib/utils';

interface FiltrosRacon {
  texto: string;
  id_empresa: string;
  id_estacion: string;
  banda: string;
}

interface SenalOpcion {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
}

interface Catalogos {
  empresas: CatalogoItem[];
  estaciones: CatalogoItem[];
}

// Radix Select no admite value vacio; esta opcion equivale a sin filtro.
const TODOS = '__all__';

const FILTROS_INICIALES: FiltrosRacon = {
  texto: '',
  id_empresa: '',
  id_estacion: '',
  banda: '',
};

const toFiltros = (filtros: FiltrosRacon): Filter[] => [
  { column: 'id_empresa', op: 'eq', value: filtros.id_empresa },
  { column: 'id_estacion', op: 'eq', value: filtros.id_estacion },
  { column: 'banda', op: 'ilike', value: filtros.banda },
];

const formatearSenal = (racon: RaconRegistro) =>
  racon.senal ? `${racon.senal.codigo_lsm}${racon.senal.nombre ? ` - ${racon.senal.nombre}` : ''}` : '-';

export default function RadioelectricasPage() {
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
  } = useServerList<RaconRegistro, FiltrosRacon>({
    path: RACON_PATH,
    select: RACON_SELECT,
    pageSize: 20,
    defaultOrder: { column: 'numero_orden', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
    searchColumns: ['nombre', 'numero_orden'],
    searchKey: 'texto',
  });

  const [catalogos, setCatalogos] = useState<Catalogos>({ empresas: [], estaciones: [] });
  const [senales, setSenales] = useState<SenalOpcion[]>([]);
  const [seleccionAbierta, setSeleccionAbierta] = useState(false);
  const [idSenalNueva, setIdSenalNueva] = useState('');
  const [edicion, setEdicion] = useState<{ idSenal: string; racon: RaconRegistro | null } | null>(null);

  useEffect(() => {
    void raconService.getCatalogos().then(setCatalogos).catch(() => undefined);
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

  const continuarNuevo = () => {
    setEdicion({ idSenal: idSenalNueva, racon: null });
    setSeleccionAbierta(false);
    setIdSenalNueva('');
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
            <Radio className="h-5 w-5 text-icon-strong" />
            Radioeléctricas (RACON)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Equipos RACON instalados en las señales marítimas
          </p>
        </div>
        <Button
          onClick={() => setSeleccionAbierta(true)}
          className="w-full bg-gray-800 text-white shadow-md hover:bg-gray-900 sm:w-auto dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo RACON
        </Button>
      </div>

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
                placeholder="Buscar por nombre o número de orden"
                className="w-full pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
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
                {catalogos.empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>{empresa.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Estación" className="w-full md:w-52">
            <Select
              value={filters.id_estacion || TODOS}
              onValueChange={(valor) => setFilter('id_estacion', valor === TODOS ? '' : valor)}
            >
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {catalogos.estaciones.map((estacion) => (
                  <SelectItem key={estacion.id} value={estacion.id}>{estacion.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterField>

          <FilterField label="Banda" className="w-full md:w-40">
            <DebouncedInput
              value={filters.banda}
              onValueChange={(valor) => setFilter('banda', valor)}
              placeholder="Ej. X"
              className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
            />
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

      <Card className="min-w-0 border-gray-200 shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <CardHeader className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardTitle className="text-xl text-gray-800 dark:text-white">
            Listado de RACON
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({total} registros)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando RACON...</p>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              {filtrosActivos > 0 ? 'No se encontraron RACON con esos filtros.' : 'No hay RACON registrados.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Señal</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Banda</TableHead>
                    <TableHead className="font-semibold">Frecuencia</TableHead>
                    <TableHead className="font-semibold">Alcance</TableHead>
                    <TableHead className="font-semibold">Empresa</TableHead>
                    <TableHead className="font-semibold">Estación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((racon) => (
                    <TableRow
                      key={racon.id_racon}
                      onClick={() => setEdicion({ idSenal: racon.id_senal, racon })}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell>{formatearSenal(racon)}</TableCell>
                      <TableCell className="font-medium">{racon.nombre ?? '-'}</TableCell>
                      <TableCell>{racon.banda ?? '-'}</TableCell>
                      <TableCell>{racon.frecuencia ?? '-'}</TableCell>
                      <TableCell>{racon.alcance ?? '-'}</TableCell>
                      <TableCell>{racon.empresa?.nombre ?? '-'}</TableCell>
                      <TableCell>{racon.estacion?.nombre ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-gray-200 bg-transparent px-6 dark:border-gray-700 dark:bg-transparent">
          <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />
        </CardFooter>
      </Card>

      <Dialog open={seleccionAbierta} onOpenChange={setSeleccionAbierta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo RACON</DialogTitle>
            <DialogDescription>Elija la señal donde está instalado el equipo.</DialogDescription>
          </DialogHeader>
          <CommandSelect
            label="Señal"
            placeholder="Seleccione una señal"
            searchPlaceholder="Buscar por código o nombre..."
            items={opcionesSenal}
            value={idSenalNueva}
            onValueChange={setIdSenalNueva}
          />
          <div className="flex justify-end">
            <Button disabled={!idSenalNueva} onClick={continuarNuevo}>
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DetailPanel
        open={edicion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEdicion(null);
        }}
        title={edicion?.racon ? 'Editar RACON' : 'Nuevo RACON'}
        description={edicion ? `Señal: ${senales.find((s) => s.id_senal === edicion.idSenal)?.codigo_lsm ?? ''}` : undefined}
      >
        {edicion && (
          <RaconForm
            key={edicion.racon?.id_racon ?? `nuevo-${edicion.idSenal}`}
            idSenal={edicion.idSenal}
            racon={edicion.racon}
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
