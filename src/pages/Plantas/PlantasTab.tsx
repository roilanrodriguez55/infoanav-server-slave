import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Plus, RotateCcw, Search, Zap } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import {
  PLANTAS_PATH,
  PLANTAS_SELECT,
  plantasService,
  type PlantaFalla,
  type PlantaRegistro,
} from '@/services/api/plantasApi';
import type { Filter } from '@/lib/postgrest';
import { aValorDatetimeLocal, diferenciaMs, formatearDuracion } from '@/lib/intervalos';
import { aTextoLocal, aTimestampLocal, fechaHoraLegible } from '@/lib/planMantenimiento';
import { etiquetaSenal } from '@/lib/utils';
import { DetailPanel } from '@/components/common/DetailPanel';
import { FilterBar, FilterField } from '@/components/common/FilterBar';
import { Pagination } from '@/components/common/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import PlantaForm from './PlantaForm';

interface FiltrosPlantas {
  texto: string;
}

const FILTROS_INICIALES: FiltrosPlantas = { texto: '' };

const toFilters = (): Filter[] => [];

// Faro: la señal enlazada tiene prioridad sobre el texto libre.
const formatearFaro = (planta: PlantaRegistro) =>
  planta.senal ? etiquetaSenal(planta.senal.codigo_lsm, planta.senal.nombre) : planta.faro_texto ?? '-';

const DatoFicha = ({ etiqueta, valor }: { etiqueta: string; valor: string | null }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{etiqueta}</dt>
    <dd className="text-sm text-gray-800 dark:text-gray-100">{valor ?? '-'}</dd>
  </div>
);

export default function PlantasTab() {
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
  } = useServerList<PlantaRegistro, FiltrosPlantas>({
    path: PLANTAS_PATH,
    select: PLANTAS_SELECT,
    pageSize: 20,
    defaultOrder: { column: 'marca', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters,
    searchColumns: ['marca', 'modelo', 'numero', 'inventario', 'faro_texto'],
    searchKey: 'texto',
  });

  const [idFicha, setIdFicha] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<{ planta: PlantaRegistro | null } | null>(null);
  const [fallas, setFallas] = useState<PlantaFalla[]>([]);
  const [errorFallas, setErrorFallas] = useState<string | null>(null);
  const [versionFallas, setVersionFallas] = useState(0);
  const [registrandoFalla, setRegistrandoFalla] = useState(false);
  const [fechaFalla, setFechaFalla] = useState('');
  const [causaFalla, setCausaFalla] = useState('');
  const [guardandoFalla, setGuardandoFalla] = useState(false);

  // La ficha se toma de la lista para mostrar los datos ya guardados tras recargar.
  const planta = rows.find((fila) => fila.id_planta === idFicha) ?? null;
  const filtrosActivos = Object.values(filters).filter((valor) => valor !== '').length;

  useEffect(() => {
    if (!idFicha) return;
    let ignorar = false;
    plantasService
      .listFallas(idFicha)
      .then((lista) => {
        if (ignorar) return;
        setFallas(lista);
        setErrorFallas(null);
      })
      .catch(() => {
        if (ignorar) return;
        setErrorFallas('No se pudieron cargar las fallas');
      });
    return () => {
      ignorar = true;
    };
  }, [idFicha, versionFallas]);

  const abrirFicha = (id: string) => {
    setFallas([]);
    setErrorFallas(null);
    setIdFicha(id);
  };

  const cerrarFicha = () => setIdFicha(null);

  const abrirRegistrarFalla = () => {
    setFechaFalla(aValorDatetimeLocal(new Date()));
    setCausaFalla('');
    setErrorFallas(null);
    setRegistrandoFalla(true);
  };

  const registrarFalla = async (e: FormEvent) => {
    e.preventDefault();
    if (!idFicha) return;
    setGuardandoFalla(true);
    const respuesta = await plantasService.registrarFalla(idFicha, aTimestampLocal(fechaFalla), causaFalla);
    setGuardandoFalla(false);
    if (respuesta.success) {
      setRegistrandoFalla(false);
      setVersionFallas((version) => version + 1);
    } else {
      setErrorFallas(respuesta.message);
      setRegistrandoFalla(false);
    }
  };

  const restablecer = async (falla: PlantaFalla) => {
    const respuesta = await plantasService.restablecerFalla(falla.id_planta_falla, aTextoLocal(new Date()));
    if (respuesta.success) {
      setVersionFallas((version) => version + 1);
    } else {
      setErrorFallas(respuesta.message);
    }
  };

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Grupos electrógenos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Plantas de energía de las señales marítimas y sus fallas
          </p>
        </div>
        <Button
          onClick={() => setEdicion({ planta: null })}
          className="w-full bg-gray-800 text-white shadow-md hover:bg-gray-900 sm:w-auto dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva planta
        </Button>
      </div>

      <div className="mb-6">
        <FilterBar onReset={resetFilters} activeCount={filtrosActivos}>
          <FilterField label="Buscar" className="w-full md:w-72">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <Input
                value={filters.texto}
                onChange={(e) => setFilter('texto', e.target.value)}
                placeholder="Marca, modelo, número, inventario o faro"
                className="w-full pl-10 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
              />
            </div>
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
            Listado de plantas
            {total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({total} registros)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando plantas...</p>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              {filtrosActivos > 0 ? 'No se encontraron plantas con esos filtros.' : 'No hay plantas registradas.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700">
                    <TableHead className="font-semibold">Faro</TableHead>
                    <TableHead className="font-semibold">Marca</TableHead>
                    <TableHead className="font-semibold">Modelo</TableHead>
                    <TableHead className="font-semibold">Potencia</TableHead>
                    <TableHead className="font-semibold">Número</TableHead>
                    <TableHead className="font-semibold">Empresa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((fila) => (
                    <TableRow
                      key={fila.id_planta}
                      onClick={() => abrirFicha(fila.id_planta)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <TableCell className="font-medium">{formatearFaro(fila)}</TableCell>
                      <TableCell>{fila.marca ?? '-'}</TableCell>
                      <TableCell>{fila.modelo ?? '-'}</TableCell>
                      <TableCell>{fila.potencia ?? '-'}</TableCell>
                      <TableCell>{fila.numero ?? '-'}</TableCell>
                      <TableCell>{fila.empresa?.nombre ?? '-'}</TableCell>
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

      <DetailPanel
        open={planta !== null && edicion === null}
        onOpenChange={(abierto) => {
          if (!abierto) cerrarFicha();
        }}
        title={planta ? `Planta ${planta.marca ?? ''} ${planta.modelo ?? ''}`.trim() : 'Planta'}
        description={planta ? `Faro: ${formatearFaro(planta)}` : undefined}
      >
        {planta && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setEdicion({ planta })}>
                Editar datos
              </Button>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">Datos técnicos</h3>
              <dl className="grid grid-cols-2 gap-4">
                <DatoFicha etiqueta="Marca" valor={planta.marca} />
                <DatoFicha etiqueta="Modelo" valor={planta.modelo} />
                <DatoFicha etiqueta="Número" valor={planta.numero} />
                <DatoFicha etiqueta="Inventario" valor={planta.inventario} />
                <DatoFicha etiqueta="Serie" valor={planta.serie} />
                <DatoFicha etiqueta="Empresa" valor={planta.empresa?.nombre ?? null} />
                <DatoFicha etiqueta="Potencia" valor={planta.potencia} />
                <DatoFicha etiqueta="Consumo" valor={planta.consumo} />
                <DatoFicha etiqueta="Voltaje" valor={planta.voltaje} />
                <DatoFicha etiqueta="Frecuencia" valor={planta.frecuencia} />
                <div className="col-span-2">
                  <DatoFicha etiqueta="Observaciones" valor={planta.observaciones} />
                </div>
              </dl>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">Fallas</h3>
                <Button size="sm" onClick={abrirRegistrarFalla}>
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar falla
                </Button>
              </div>

              {errorFallas && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                  <AlertDescription className="text-red-700 dark:text-red-300">{errorFallas}</AlertDescription>
                </Alert>
              )}

              {fallas.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Sin fallas registradas.</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 dark:bg-gray-700">
                        <TableHead className="font-semibold">Inicio F/S</TableHead>
                        <TableHead className="font-semibold">Restablecimiento</TableHead>
                        <TableHead className="font-semibold">Días F/S</TableHead>
                        <TableHead className="font-semibold">Causa</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fallas.map((falla) => (
                        <TableRow key={falla.id_planta_falla}>
                          <TableCell>{fechaHoraLegible(falla.fecha_fs)}</TableCell>
                          <TableCell>{fechaHoraLegible(falla.fecha_restablecimiento)}</TableCell>
                          <TableCell>
                            {formatearDuracion(
                              diferenciaMs(falla.fecha_fs, falla.fecha_restablecimiento ?? aTextoLocal(new Date()))
                            ) || '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{falla.causa ?? '-'}</TableCell>
                          <TableCell>
                            {!falla.fecha_restablecimiento && (
                              <Button size="sm" variant="outline" onClick={() => restablecer(falla)}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restablecer
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        )}
      </DetailPanel>

      <Dialog open={registrandoFalla} onOpenChange={setRegistrandoFalla}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={registrarFalla} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Registrar falla</DialogTitle>
              <DialogDescription>La planta queda fuera de servicio desde la fecha indicada.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="fecha_falla" className="text-sm font-medium">Inicio F/S</Label>
              <Input
                id="fecha_falla"
                type="datetime-local"
                value={fechaFalla}
                onChange={(e) => setFechaFalla(e.target.value)}
                className="dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="causa_falla" className="text-sm font-medium">Causa</Label>
              <Textarea
                id="causa_falla"
                value={causaFalla}
                onChange={(e) => setCausaFalla(e.target.value)}
                className="dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRegistrandoFalla(false)} disabled={guardandoFalla}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardandoFalla} className="bg-blue-600 text-white hover:bg-blue-700">
                {guardandoFalla ? 'Guardando...' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DetailPanel
        open={edicion !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setEdicion(null);
        }}
        title={edicion?.planta ? 'Editar planta' : 'Nueva planta'}
        description="Grupo electrógeno"
      >
        {edicion && (
          <PlantaForm
            key={edicion.planta?.id_planta ?? 'nueva'}
            planta={edicion.planta}
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
