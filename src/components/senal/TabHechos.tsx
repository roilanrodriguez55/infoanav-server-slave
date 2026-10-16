import { useState } from 'react';
import { AlertCircle, AlertTriangle, Plus } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import { HECHOS_PATH, HECHOS_SELECT, type HechoRegistro } from '@/services/api/hechosApi';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Pagination } from '@/components/common/Pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import HechoForm from './HechoForm';

interface TabHechosProps {
  idSenal: string;
}

const SIN_FILTROS: Record<string, never> = {};

// Las fechas de tipo date llegan como 'YYYY-MM-DD'; se interpretan en hora local para no restar un dia.
const formatearFecha = (fecha: string | null) =>
  fecha ? new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES') : '-';

export default function TabHechos({ idSenal }: TabHechosProps) {
  const { rows, total, page, pageSize, setPage, loading, error, reload } = useServerList<
    HechoRegistro,
    Record<string, never>
  >({
    path: HECHOS_PATH,
    select: HECHOS_SELECT,
    pageSize: 20,
    defaultOrder: { column: 'fecha', dir: 'desc' },
    initialFilters: SIN_FILTROS,
    toFilters: () => [{ column: 'id_senal', op: 'eq', value: idSenal }],
  });

  const [panel, setPanel] = useState<{ hecho: HechoRegistro | null } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Hechos extraordinarios
        </h3>
        <Button
          onClick={() => setPanel({ hecho: null })}
          className="bg-gray-800 text-white shadow-md hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar hecho
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
        <p className="py-8 text-center text-gray-600 dark:text-gray-300">Cargando hechos...</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">Esta señal no tiene hechos registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700">
                <TableHead className="font-semibold">Fecha</TableHead>
                <TableHead className="font-semibold">Hecho</TableHead>
                <TableHead className="font-semibold">Reporta</TableHead>
                <TableHead className="font-semibold">Vandálico</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="font-semibold">Fecha de conclusión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((hecho) => (
                <TableRow
                  key={hecho.id_hecho}
                  onClick={() => setPanel({ hecho })}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell className="font-medium">{formatearFecha(hecho.fecha)}</TableCell>
                  <TableCell className="max-w-xs truncate">{hecho.hecho ?? '-'}</TableCell>
                  <TableCell>{hecho.reporta ?? '-'}</TableCell>
                  <TableCell>{hecho.vandalico ? 'Sí' : 'No'}</TableCell>
                  <TableCell>
                    <Badge variant={hecho.concluso ? 'secondary' : 'outline'}>
                      {hecho.concluso ? 'Concluido' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatearFecha(hecho.fecha_conclusion)}</TableCell>
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
        title={panel?.hecho ? 'Editar hecho' : 'Nuevo hecho'}
        description="Hecho extraordinario de la señal"
      >
        {panel && (
          <HechoForm
            key={panel.hecho?.id_hecho ?? 'nuevo'}
            idSenal={idSenal}
            hecho={panel.hecho}
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
