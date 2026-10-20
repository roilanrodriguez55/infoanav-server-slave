import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { planMantService, type PlanMantenimiento } from '@/services/api/planMantApi';
import {
  aTextoLocal,
  CLASE_ESTADO_PLAN,
  estadoPlan,
  inicioDelMes,
  type SenalOpcion,
  type TipoOpcion,
} from '@/lib/planMantenimiento';
import { cn } from '@/lib/utils';

interface CalendarioPlanProps {
  senales: SenalOpcion[];
  tipos: TipoOpcion[];
  version: number;
  onSeleccionar: (plan: PlanMantenimiento) => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const claveDia = (fecha: Date): string => aTextoLocal(fecha).slice(0, 10);

// Cuadricula de 7 columnas desde el lunes; null son celdas fuera del mes.
const cuadricula = (mes: Date): (Date | null)[] => {
  const offset = (inicioDelMes(mes).getDay() + 6) % 7;
  const diasMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let dia = 1; dia <= diasMes; dia++) {
    celdas.push(new Date(mes.getFullYear(), mes.getMonth(), dia));
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
};

export function CalendarioPlan({ senales, tipos, version, onSeleccionar }: CalendarioPlanProps) {
  const [mes, setMes] = useState(() => inicioDelMes(new Date()));
  const [planes, setPlanes] = useState<PlanMantenimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const inicio = inicioDelMes(mes);
    const fin = new Date(mes.getFullYear(), mes.getMonth() + 1, 1);

    void planMantService
      .list(
        [
          { column: 'fecha_plan', op: 'gte', value: aTextoLocal(inicio) },
          { column: 'fecha_plan', op: 'lt', value: aTextoLocal(fin) },
        ],
        { column: 'fecha_plan', dir: 'asc' }
      )
      .then((respuesta) => {
        if (cancelado) return;
        setCargando(false);
        if (respuesta.success) {
          setPlanes((respuesta.data as PlanMantenimiento[] | null) ?? []);
          setError(null);
        } else {
          setError(respuesta.message);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [mes, version]);

  const cambiarMes = (desplazamiento: number) => {
    setCargando(true);
    setMes((actual) => new Date(actual.getFullYear(), actual.getMonth() + desplazamiento, 1));
  };

  const planesPorDia = new Map<string, PlanMantenimiento[]>();
  for (const plan of planes) {
    if (!plan.fecha_plan) continue;
    const clave = plan.fecha_plan.slice(0, 10);
    planesPorDia.set(clave, [...(planesPorDia.get(clave) ?? []), plan]);
  }

  const senalPorId = new Map(senales.map((senal) => [senal.id_senal, senal.codigo_lsm]));
  const tipoPorId = new Map(tipos.map((tipo) => [tipo.id_tipo_mant, tipo.nombre]));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => cambiarMes(-1)}>
          <ChevronLeft />
        </Button>
        <h3 className="flex items-center gap-2 text-lg font-semibold capitalize text-gray-800 dark:text-white">
          {format(mes, 'MMMM yyyy', { locale: es })}
          {cargando && <Loader2 className="h-4 w-4 animate-spin text-icon" />}
        </h3>
        <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => cambiarMes(1)}>
          <ChevronRight />
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="bg-gray-100 px-2 py-1 text-center text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >
            {dia}
          </div>
        ))}

        {cuadricula(mes).map((dia, indice) =>
          dia ? (
            <div key={claveDia(dia)} className="min-h-24 min-w-0 bg-white p-1.5 dark:bg-gray-800">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{dia.getDate()}</span>
              <div className="mt-1 space-y-1">
                {(planesPorDia.get(claveDia(dia)) ?? []).map((plan) => {
                  const estado = estadoPlan(plan);
                  const senal = senalPorId.get(plan.id_senal) ?? '—';
                  const tipo = plan.id_tipo_mant ? tipoPorId.get(plan.id_tipo_mant) ?? '' : '';
                  return (
                    <button
                      key={plan.id_plan_mantenimiento}
                      type="button"
                      onClick={() => onSeleccionar(plan)}
                      title={`${senal}${tipo ? ' - ' + tipo : ''}`}
                      className={cn(
                        'block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium',
                        CLASE_ESTADO_PLAN[estado]
                      )}
                    >
                      {senal}{tipo ? ` · ${tipo}` : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div key={`vacio-${indice}`} className="min-h-24 bg-gray-50 dark:bg-gray-900" />
          )
        )}
      </div>
    </div>
  );
}
