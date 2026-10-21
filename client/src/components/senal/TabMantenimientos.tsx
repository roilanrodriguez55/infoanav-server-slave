import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Loader2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mantenimientosService } from '@/services/api/mantenApi';
import { planMantService, type PlanMantenimiento } from '@/services/api/planMantApi';
import { CLASE_ESTADO_PLAN, ETIQUETA_ESTADO_PLAN, estadoPlan, fechaHoraLegible } from '@/lib/planMantenimiento';

interface MantenimientoSenal {
  id_mantenimiento: string;
  fecha_inicio: string | null;
  id_tipo_mant: string | null;
  trabajo_realizado: string | null;
}

interface TabMantenimientosProps {
  idSenal: string;
}

export default function TabMantenimientos({ idSenal }: TabMantenimientosProps) {
  const navigate = useNavigate();
  const [mantenimientos, setMantenimientos] = useState<MantenimientoSenal[]>([]);
  const [planes, setPlanes] = useState<PlanMantenimiento[]>([]);
  const [tipos, setTipos] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError(null);
      const [mantRes, planRes, tiposRes] = await Promise.all([
        mantenimientosService.getBySenal(idSenal),
        planMantService.list(
          [
            { column: 'id_senal', op: 'eq', value: idSenal },
            { column: 'fecha_cumplida', op: 'is', value: 'null' },
          ],
          { column: 'fecha_plan', dir: 'asc' }
        ),
        mantenimientosService.getTiposMantenimiento(),
      ]);
      if (cancelado) return;

      const fallo = [mantRes, planRes].find((respuesta) => !respuesta.success);
      if (fallo) {
        setError(fallo.message);
      } else {
        setMantenimientos((mantRes.data as MantenimientoSenal[] | null) ?? []);
        setPlanes((planRes.data as PlanMantenimiento[] | null) ?? []);
      }

      const listaTipos = (tiposRes.data as { id_tipo_mant: string; nombre: string }[] | null) ?? [];
      setTipos(Object.fromEntries(listaTipos.map((tipo) => [tipo.id_tipo_mant, tipo.nombre])));
      setCargando(false);
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [idSenal]);

  const nombreTipo = (idTipo: string | null): string => (idTipo ? tipos[idTipo] ?? '—' : '—');

  const registrar = () => {
    void navigate(`/gestion-mant/nuevo?senal=${idSenal}`);
  };

  const cumplir = (idPlan: string) => {
    void navigate(`/gestion-mant/nuevo?senal=${idSenal}&plan=${idPlan}`);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-icon" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button onClick={registrar}>
          <Plus />
          Registrar mantenimiento
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-blue-900 dark:text-white">Mantenimientos realizados</h3>
        {mantenimientos.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Esta señal no tiene mantenimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Trabajo realizado</TableHead>
                  <TableHead className="font-semibold text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mantenimientos.map((mant) => (
                  <TableRow key={mant.id_mantenimiento}>
                    <TableCell>{fechaHoraLegible(mant.fecha_inicio)}</TableCell>
                    <TableCell>{nombreTipo(mant.id_tipo_mant)}</TableCell>
                    <TableCell className="max-w-xs truncate" title={mant.trabajo_realizado ?? undefined}>
                      {mant.trabajo_realizado ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={`/gestion-mant/${mant.id_mantenimiento}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-blue-900 dark:text-white">Planes pendientes y vencidos</h3>
        {planes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No hay planes pendientes para esta señal.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  <TableHead className="font-semibold">Fecha plan</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Trabajo y medios</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planes.map((plan) => {
                  const estado = estadoPlan(plan);
                  return (
                    <TableRow key={plan.id_plan_mantenimiento}>
                      <TableCell>{fechaHoraLegible(plan.fecha_plan)}</TableCell>
                      <TableCell>{nombreTipo(plan.id_tipo_mant)}</TableCell>
                      <TableCell className="max-w-xs truncate" title={plan.trabajo_medios ?? undefined}>
                        {plan.trabajo_medios ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={CLASE_ESTADO_PLAN[estado]}>{ETIQUETA_ESTADO_PLAN[estado]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" onClick={() => cumplir(plan.id_plan_mantenimiento)}>
                          <Check />
                          Cumplir
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
