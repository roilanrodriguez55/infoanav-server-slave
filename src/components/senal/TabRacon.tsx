import { useState } from 'react';
import { AlertCircle, Plus, Radio } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import { RACON_PATH, RACON_SELECT, type RaconRegistro } from '@/services/api/raconApi';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Pagination } from '@/components/common/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RaconForm from './RaconForm';

interface TabRaconProps {
  idSenal: string;
}

const SIN_FILTROS: Record<string, never> = {};

const formatearFecha = (fecha: string | null) => (fecha ? new Date(fecha).toLocaleDateString('es-ES') : '-');

export default function TabRacon({ idSenal }: TabRaconProps) {
  const { rows, total, page, pageSize, setPage, loading, error, reload } = useServerList<
    RaconRegistro,
    Record<string, never>
  >({
    path: RACON_PATH,
    select: RACON_SELECT,
    pageSize: 20,
    defaultOrder: { column: 'numero_orden', dir: 'asc' },
    initialFilters: SIN_FILTROS,
    toFilters: () => [{ column: 'id_senal', op: 'eq', value: idSenal }],
  });

  const [panel, setPanel] = useState<{ racon: RaconRegistro | null } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
          <Radio className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          RACON instalados
        </h3>
        <Button
          onClick={() => setPanel({ racon: null })}
          className="bg-gray-800 text-white shadow-md hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar RACON
        </Button>
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

      {loading ? (
        <p className="py-8 text-center text-gray-600 dark:text-gray-300">Cargando RACON...</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">Esta señal no tiene RACON registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700">
                <TableHead className="font-semibold">Número de orden</TableHead>
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">Banda</TableHead>
                <TableHead className="font-semibold">Frecuencia</TableHead>
                <TableHead className="font-semibold">Alcance</TableHead>
                <TableHead className="font-semibold">Fecha de inicio</TableHead>
                <TableHead className="font-semibold">Fecha de baja</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((racon) => (
                <TableRow
                  key={racon.id_racon}
                  onClick={() => setPanel({ racon })}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell className="font-medium">{racon.numero_orden ?? '-'}</TableCell>
                  <TableCell>{racon.nombre ?? '-'}</TableCell>
                  <TableCell>{racon.banda ?? '-'}</TableCell>
                  <TableCell>{racon.frecuencia ?? '-'}</TableCell>
                  <TableCell>{racon.alcance ?? '-'}</TableCell>
                  <TableCell>{formatearFecha(racon.fecha_inicio)}</TableCell>
                  <TableCell>{formatearFecha(racon.fecha_baja)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />

      <DetailPanel
        open={panel !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setPanel(null);
        }}
        title={panel?.racon ? 'Editar RACON' : 'Nuevo RACON'}
        description="Equipo radioeléctrico instalado en la señal"
      >
        {panel && (
          <RaconForm
            key={panel.racon?.id_racon ?? 'nuevo'}
            idSenal={idSenal}
            racon={panel.racon}
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
