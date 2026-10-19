import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { senalesService } from '@/services/api/senalesApi';
import { mantenimientosService } from '@/services/api/mantenApi';
import { planMantService, type PlanMantenimiento } from '@/services/api/planMantApi';
import type { SenalOpcion, TipoOpcion } from '@/lib/planMantenimiento';
import { CalendarioPlan } from './CalendarioPlan';
import { ListaPlan } from './ListaPlan';
import { PlanFormPanel } from './PlanFormPanel';

type Vista = 'calendario' | 'lista';

interface Mensaje {
  tipo: 'success' | 'error';
  texto: string;
}

export default function PlanMantenimientoPage() {
  const [vista, setVista] = useState<Vista>('calendario');
  const [senales, setSenales] = useState<SenalOpcion[]>([]);
  const [tipos, setTipos] = useState<TipoOpcion[]>([]);
  // Incrementa tras guardar o eliminar para que calendario y lista recarguen
  const [version, setVersion] = useState(0);
  const [panel, setPanel] = useState<{ plan: PlanMantenimiento | null } | null>(null);
  const [planAEliminar, setPlanAEliminar] = useState<PlanMantenimiento | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);

  useEffect(() => {
    // Los catalogos solo llenan los selectores; si fallan, quedan vacios.
    void senalesService.getSenales().then((res) => {
      if (res.success && Array.isArray(res.data)) setSenales(res.data as SenalOpcion[]);
    });
    void mantenimientosService.getTiposMantenimiento().then((res) => {
      if (res.success && Array.isArray(res.data)) setTipos(res.data as TipoOpcion[]);
    });
  }, []);

  const abrirNuevo = () => setPanel({ plan: null });

  const abrirEditar = (plan: PlanMantenimiento) => setPanel({ plan });

  const guardado = () => {
    setVersion((actual) => actual + 1);
    setMensaje({ tipo: 'success', texto: 'Plan guardado correctamente' });
  };

  const handleEliminar = async () => {
    if (!planAEliminar) return;

    setEliminando(true);
    const respuesta = await planMantService.delete(planAEliminar.id_plan_mantenimiento);
    setEliminando(false);
    setPlanAEliminar(null);

    if (respuesta.success) {
      setVersion((actual) => actual + 1);
      setMensaje({ tipo: 'success', texto: 'Plan eliminado correctamente' });
    } else {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar: ' + (respuesta.message || 'Error desconocido') });
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-white">
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Plan de Mantenimiento
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Planifique los mantenimientos de las señales marítimas
            </p>
          </div>
          <nav className="flex gap-2 text-sm" aria-label="Vistas de mantenimiento">
            <Link
              to="/gestion-mant"
              className="rounded-md px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Realizados
            </Link>
            <Link to="/plan-mantenimiento" aria-current="page" className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white">
              Plan
            </Link>
          </nav>
        </div>

        <Button onClick={abrirNuevo} className="w-full bg-gray-800 text-white shadow-md hover:bg-gray-900 sm:w-auto dark:bg-gray-700 dark:hover:bg-gray-600">
          <Plus className="mr-2 h-4 w-4" />
          Planificar
        </Button>
      </div>

      {mensaje && (
        <Alert
          className={mensaje.tipo === 'success'
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}
        >
          <AlertDescription className={mensaje.tipo === 'success'
            ? 'text-green-700 dark:text-green-300'
            : 'text-red-700 dark:text-red-300'}>
            {mensaje.texto}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={vista} onValueChange={(valor) => setVista(valor as Vista)}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start bg-blue-100 sm:w-auto dark:bg-gray-700">
          <TabsTrigger value="calendario" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Calendario
          </TabsTrigger>
          <TabsTrigger value="lista" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:text-gray-300">
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendario" className="mt-4">
          <CalendarioPlan senales={senales} tipos={tipos} version={version} onSeleccionar={abrirEditar} />
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <ListaPlan
            senales={senales}
            tipos={tipos}
            version={version}
            onEditar={abrirEditar}
            onEliminar={setPlanAEliminar}
          />
        </TabsContent>
      </Tabs>

      {panel && (
        <PlanFormPanel
          plan={panel.plan}
          senales={senales}
          tipos={tipos}
          onCerrar={() => setPanel(null)}
          onGuardado={guardado}
        />
      )}

      <AlertDialog open={planAEliminar !== null} onOpenChange={(abierto) => { if (!abierto) setPlanAEliminar(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el plan de mantenimiento
              {planAEliminar && (
                <span className="font-semibold"> {senales.find((s) => s.id_senal === planAEliminar.id_senal)?.codigo_lsm ?? ''}</span>
              )}
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminando}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
