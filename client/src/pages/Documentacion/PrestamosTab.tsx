import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeftRight, Undo2 } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import {
  PRESTAMO_SELECT,
  PRESTAMOS_PATH,
  contarPrestamosVencidos,
  fechaLocal,
  type PrestamoRegistro,
} from '@/services/api/documentacionApi';
import type { Filter } from '@/lib/postgrest';
import { EmptyState } from '@/components/common/EmptyState';
import { ListCard } from '@/components/common/ListCard';
import { Pagination } from '@/components/common/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fechaCorta } from './documentacionFormato';
import DevolverDialog from './DevolverDialog';

type EstadoPrestamo = 'activos' | 'vencidos' | 'devueltos';

interface FiltrosPrestamos {
  estado: EstadoPrestamo;
}

const FILTROS_INICIALES: FiltrosPrestamos = { estado: 'activos' };

const ETIQUETAS_ESTADO: Record<EstadoPrestamo, string> = {
  activos: 'Activos',
  vencidos: 'Vencidos',
  devueltos: 'Devueltos',
};

// Los filtros de fecha usan el dia local de hoy, igual que contarPrestamosVencidos().
const toFiltros = ({ estado }: FiltrosPrestamos): Filter[] => {
  if (estado === 'devueltos') return [{ column: 'fecha_devolucion', op: 'not_is', value: null }];
  const abiertos: Filter[] = [{ column: 'fecha_devolucion', op: 'is', value: null }];
  if (estado === 'vencidos') abiertos.push({ column: 'fecha_a_devolver', op: 'lt', value: fechaLocal() });
  return abiertos;
};

const estaVencido = (prestamo: PrestamoRegistro): boolean =>
  prestamo.fecha_devolucion === null &&
  prestamo.fecha_a_devolver !== null &&
  prestamo.fecha_a_devolver < fechaLocal();

export default function PrestamosTab() {
  const {
    rows,
    total,
    page,
    pageSize,
    setPage,
    filters,
    setFilter,
    loading,
    error,
    reload,
  } = useServerList<PrestamoRegistro, FiltrosPrestamos>({
    path: PRESTAMOS_PATH,
    select: PRESTAMO_SELECT,
    pageSize: 20,
    defaultOrder: { column: 'fecha_a_devolver', dir: 'asc' },
    initialFilters: FILTROS_INICIALES,
    toFilters: toFiltros,
  });

  const [vencidos, setVencidos] = useState<number | null>(null);
  const [devolviendo, setDevolviendo] = useState<PrestamoRegistro | null>(null);

  const cargarVencidos = useCallback(() => {
    contarPrestamosVencidos()
      .then(setVencidos)
      .catch(() => setVencidos(null));
  }, []);

  useEffect(() => {
    cargarVencidos();
  }, [cargarVencidos]);

  const terminado = () => {
    setDevolviendo(null);
    cargarVencidos();
    reload();
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setFilter('estado', 'vencidos')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setFilter('estado', 'vencidos');
        }}
        className="w-full cursor-pointer border-red-200 shadow-md transition hover:shadow-lg sm:w-72 dark:border-red-800 dark:bg-gray-800"
      >
        <CardContent className="flex items-center gap-4 p-5">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Préstamos vencidos</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-400">{vencidos ?? '-'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(ETIQUETAS_ESTADO) as EstadoPrestamo[]).map((estado) => (
          <Button
            key={estado}
            size="sm"
            variant={filters.estado === estado ? 'default' : 'outline'}
            onClick={() => setFilter('estado', estado)}
            className={filters.estado === estado ? 'bg-blue-600 text-white hover:bg-blue-700' : 'dark:border-gray-600 dark:text-gray-300'}
          >
            {ETIQUETAS_ESTADO[estado]}
          </Button>
        ))}
      </div>

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
        title={`Préstamos ${ETIQUETAS_ESTADO[filters.estado].toLowerCase()}`}
        actions={
          total > 0 ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">({total} registros)</span>
          ) : undefined
        }
        footer={<Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />}
      >
        {loading ? (
          <p className="py-12 text-center text-gray-600 dark:text-gray-300">Cargando préstamos...</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={<ArrowLeftRight />} title="No hay préstamos en esta lista" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Libro</TableHead>
                  <TableHead className="font-semibold">A quién</TableHead>
                  <TableHead className="font-semibold">Quién presta</TableHead>
                  <TableHead className="font-semibold">Préstamo</TableHead>
                  <TableHead className="font-semibold">A devolver</TableHead>
                  <TableHead className="font-semibold">Devuelto</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((prestamo) => {
                  const abierto = prestamo.fecha_devolucion === null;
                  return (
                    <TableRow key={prestamo.id_prestamo} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell>
                        <div className="font-medium">{prestamo.libro?.titulo ?? '-'}</div>
                        {prestamo.libro?.codigo && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{prestamo.libro.codigo}</div>
                        )}
                      </TableCell>
                      <TableCell>{prestamo.a_quien ?? '-'}</TableCell>
                      <TableCell>{prestamo.quien_presta ?? '-'}</TableCell>
                      <TableCell>{fechaCorta(prestamo.fecha_prestamo)}</TableCell>
                      <TableCell>{fechaCorta(prestamo.fecha_a_devolver)}</TableCell>
                      <TableCell>{fechaCorta(prestamo.fecha_devolucion)}</TableCell>
                      <TableCell>
                        {abierto ? (
                          estaVencido(prestamo) ? (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Vencido</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Activo</Badge>
                          )
                        ) : (
                          <span className="text-sm text-gray-700 dark:text-gray-200">
                            {prestamo.estado_devolucion ?? '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {abierto && (
                          <Button size="sm" variant="brand" onClick={() => setDevolviendo(prestamo)}>
                            <Undo2 className="mr-2 h-4 w-4" />
                            Devolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </ListCard>

      {devolviendo && (
        <DevolverDialog
          idPrestamo={devolviendo.id_prestamo}
          descripcion={`${devolviendo.libro?.titulo ?? 'Libro'} (a ${devolviendo.a_quien ?? '-'})`}
          onOpenChange={(abierto) => !abierto && setDevolviendo(null)}
          onTerminado={terminado}
        />
      )}
    </div>
  );
}
