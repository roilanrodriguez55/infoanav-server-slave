import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, ArrowRightLeft, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ETIQUETA_UNIDAD_VIDA,
  equiposService,
  TIPO_ESTRUCTURA,
  vidaDesdeDias,
  type EquipoRegistro,
  type EstanciaEquipo,
} from '@/services/api/equiposApi';
import { etiquetaSenal } from '@/lib/utils';

interface FichaEquipoProps {
  equipo: EquipoRegistro;
  onEditar: () => void;
  onCambiarUbicacion: () => void;
  onEliminado: () => void;
}

const fechaCorta = (valor: string | null) => (valor ? valor.slice(0, 10) : '-');

const fechaHora = (valor: string | null) =>
  valor ? new Date(valor).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const textoVida = (dias: number | null): string => {
  if (dias === null) return '-';
  const { vida_cantidad, vida_unidad } = vidaDesdeDias(dias);
  return `${vida_cantidad} ${ETIQUETA_UNIDAD_VIDA[vida_unidad].toLowerCase()}`;
};

const Dato = ({ etiqueta, children }: { etiqueta: string; children: ReactNode }) => (
  <div>
    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{etiqueta}</dt>
    <dd className="text-sm text-gray-800 dark:text-gray-200">{children}</dd>
  </div>
);

export function FichaEquipo({ equipo, onEditar, onCambiarUbicacion, onEliminado }: FichaEquipoProps) {
  const [historial, setHistorial] = useState<EstanciaEquipo[] | null>(null);
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esEstructura = equipo.tipo_nombre?.toLowerCase() === TIPO_ESTRUCTURA;

  useEffect(() => {
    equiposService
      .getHistorial(equipo.id_equipo)
      .then(setHistorial)
      .catch(() => setErrorHistorial('No se pudo cargar el historial de ubicaciones'));
  }, [equipo.id_equipo]);

  const eliminar = async () => {
    setEliminando(true);
    const respuesta = await equiposService.delete(equipo.id_equipo);
    setEliminando(false);
    if (respuesta.success) {
      setConfirmarEliminar(false);
      onEliminado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEditar}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button variant="outline" size="sm" onClick={onCambiarUbicacion}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Cambiar ubicación
        </Button>
        <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setConfirmarEliminar(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">Ubicación actual</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dato etiqueta="Ubicación">{equipo.ubicacion_nombre ?? 'Sin ubicación'}</Dato>
          <Dato etiqueta="Desde">{fechaHora(equipo.fecha_inicio_ubicacion)}</Dato>
          <Dato etiqueta="LSM actual">
            {equipo.codigo_lsm ? etiquetaSenal(equipo.codigo_lsm, equipo.senal_nombre) : '-'}
          </Dato>
          <Dato etiqueta="F/S">
            {equipo.fuera_servicio ? <Badge variant="destructive">Fuera de servicio</Badge> : 'En servicio'}
          </Dato>
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">Datos del equipo</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dato etiqueta="Inventario">{equipo.numero_inventario}</Dato>
          <Dato etiqueta="Modelo">{equipo.modelo_nombre ?? '-'}</Dato>
          <Dato etiqueta="Empresa">{equipo.empresa_nombre ?? '-'}</Dato>
          <Dato etiqueta="Proveedor">{equipo.proveedor ?? '-'}</Dato>
          <Dato etiqueta="Inicio de servicio">{fechaCorta(equipo.fecha_inicio_servicio)}</Dato>
          <Dato etiqueta="Vida útil">{textoVida(equipo.vida_util_dias)}</Dato>
          <Dato etiqueta="Estado de la vida útil">
            {equipo.vida_util_cumplida ? (
              <Badge variant="destructive">Cumplida</Badge>
            ) : equipo.dias_vida_restantes !== null ? (
              `Quedan ${equipo.dias_vida_restantes} días`
            ) : (
              '-'
            )}
          </Dato>
          {esEstructura && <Dato etiqueta="Garantía">{equipo.garantia ?? '-'}</Dato>}
        </dl>
        {equipo.observaciones && (
          <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{equipo.observaciones}</p>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">Historial de ubicaciones</h3>
        {errorHistorial ? (
          <p className="text-sm text-red-600 dark:text-red-400">{errorHistorial}</p>
        ) : historial === null ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Sin ubicaciones registradas.</p>
        ) : (
          <ol className="space-y-2">
            {historial.map((estancia) => (
              <li
                key={estancia.id_equipo_ubicacion}
                className="rounded-lg border border-blue-100 p-3 text-sm dark:border-gray-700"
              >
                <p className="font-medium text-gray-800 dark:text-gray-200">{estancia.ubicacion?.nombre ?? '-'}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {estancia.senal
                    ? etiquetaSenal(estancia.senal.codigo_lsm, estancia.senal.nombre)
                    : 'Sin LSM'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {fechaHora(estancia.fecha_inicio)} → {estancia.fecha_fin ? fechaHora(estancia.fecha_fin) : 'Actual'}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              El equipo {equipo.numero_inventario} dejará de aparecer en el inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={eliminando}
              onClick={(e) => {
                e.preventDefault();
                void eliminar();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
