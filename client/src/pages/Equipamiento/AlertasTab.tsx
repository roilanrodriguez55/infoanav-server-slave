import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ListCard } from '@/components/common/ListCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { equiposService, type EstadoEquipo, type TipoEquipo } from '@/services/api/equiposApi';

interface ConteoTipo {
  tipo: TipoEquipo;
  vidaCumplida: number;
  fueraServicio: number;
}

// Enlaza al inventario con el tipo y el filtro de la alerta ya aplicados.
const enlace = (idTipo: string, filtro: 'vida=cumplida' | 'fs=fuera') =>
  `/equipamiento?tab=inventario&tipo=${idTipo}&${filtro}`;

export default function AlertasTab() {
  const [tipos, setTipos] = useState<TipoEquipo[] | null>(null);
  const [estado, setEstado] = useState<EstadoEquipo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([equiposService.getTipos(), equiposService.getEstadoEquipos()])
      .then(([listaTipos, listaEstado]) => {
        setTipos(listaTipos);
        setEstado(listaEstado);
      })
      .catch(() => setError('No se pudieron cargar las alertas de equipamiento'));
  }, []);

  const conteos = useMemo<ConteoTipo[]>(() => {
    if (!tipos || !estado) return [];
    return tipos.map((tipo) => {
      const filas = estado.filter((fila) => fila.id_tipo_equipamiento === tipo.id_tipo_equipamiento);
      return {
        tipo,
        vidaCumplida: filas.filter((fila) => fila.vida_util_cumplida).length,
        fueraServicio: filas.filter((fila) => fila.fuera_servicio).length,
      };
    });
  }, [tipos, estado]);

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!tipos || !estado) {
    return <p className="py-12 text-center text-gray-500 dark:text-gray-400">Cargando alertas...</p>;
  }

  const conAlertas = conteos.filter((conteo) => conteo.vidaCumplida > 0 || conteo.fueraServicio > 0);

  if (conAlertas.length === 0) {
    return (
      <ListCard title="Alertas de equipamiento">
        <EmptyState
          icon={<CheckCircle2 className="text-green-600 dark:text-green-400" />}
          title="No hay equipos con alertas"
        />
      </ListCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {conAlertas.map(({ tipo, vidaCumplida, fueraServicio }) => (
        <ListCard key={tipo.id_tipo_equipamiento} title={tipo.nombre}>
          <div className="space-y-3 px-6 py-4">
            {vidaCumplida > 0 && (
              <Link
                to={enlace(tipo.id_tipo_equipamiento, 'vida=cumplida')}
                className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
              >
                <span>Vida útil cumplida: {vidaCumplida}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {fueraServicio > 0 && (
              <Link
                to={enlace(tipo.id_tipo_equipamiento, 'fs=fuera')}
                className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-300"
              >
                <span>Fuera de servicio: {fueraServicio}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </ListCard>
      ))}
    </div>
  );
}
