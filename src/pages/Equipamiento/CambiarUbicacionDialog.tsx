import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { equiposService, type EquipoRegistro, type UbicacionMedio } from '@/services/api/equiposApi';
import { senalesService } from '@/services/api/senalesApi';
import { etiquetaSenal } from '@/lib/utils';

interface SenalOpcion {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
}

interface CambiarUbicacionDialogProps {
  equipo: EquipoRegistro | null;
  ubicaciones: UbicacionMedio[];
  onOpenChange: (abierto: boolean) => void;
  onTerminado: () => void;
}

export function CambiarUbicacionDialog({ equipo, ubicaciones, onOpenChange, onTerminado }: CambiarUbicacionDialogProps) {
  return (
    <Dialog open={equipo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {equipo && (
          <ContenidoCambioUbicacion
            key={equipo.id_equipo}
            equipo={equipo}
            ubicaciones={ubicaciones}
            onCancelar={() => onOpenChange(false)}
            onTerminado={onTerminado}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ContenidoProps {
  equipo: EquipoRegistro;
  ubicaciones: UbicacionMedio[];
  onCancelar: () => void;
  onTerminado: () => void;
}

// Se monta con key por equipo: cada apertura empieza con los campos vacios.
function ContenidoCambioUbicacion({ equipo, ubicaciones, onCancelar, onTerminado }: ContenidoProps) {
  const [idUbicacion, setIdUbicacion] = useState('');
  const [idSenal, setIdSenal] = useState('');
  const [senales, setSenales] = useState<SenalOpcion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    void senalesService.getSenales().then((res) => {
      if (res.success && Array.isArray(res.data)) setSenales(res.data as SenalOpcion[]);
      else setError('No se pudieron cargar las señales');
    });
  }, []);

  const ubicacionElegida = ubicaciones.find((ubicacion) => ubicacion.id_ubicacion_medio === idUbicacion);
  // El LSM actual solo aplica a ubicaciones en servicio.
  const pideLsm = ubicacionElegida !== undefined && !ubicacionElegida.fuera_servicio;

  const guardar = async () => {
    if (!idUbicacion) return;
    setError(null);
    setGuardando(true);
    const respuesta = await equiposService.cambiarUbicacion(
      equipo.id_equipo,
      idUbicacion,
      pideLsm && idSenal ? idSenal : null
    );
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cambiar ubicación</DialogTitle>
        <DialogDescription>
          Equipo {equipo.numero_inventario}. La ubicación actual queda cerrada con la fecha de hoy.
        </DialogDescription>
      </DialogHeader>

      <CommandSelect
        label="Nueva ubicación"
        placeholder="Seleccione una ubicación"
        searchPlaceholder="Buscar ubicación..."
        items={ubicaciones.map((ubicacion) => ({ id: ubicacion.id_ubicacion_medio, nombre: ubicacion.nombre }))}
        value={idUbicacion}
        onValueChange={(valor) => {
          setIdUbicacion(valor);
          setIdSenal('');
        }}
        required
        pendiente={!idUbicacion}
        disabled={guardando}
      />

      {pideLsm && (
        <CommandSelect
          label="LSM actual"
          placeholder="Seleccione una señal"
          searchPlaceholder="Buscar por código o nombre..."
          items={senales.map((senal) => ({
            id: senal.id_senal,
            nombre: etiquetaSenal(senal.codigo_lsm, senal.nombre),
          }))}
          value={idSenal}
          onValueChange={setIdSenal}
          pendiente={!idSenal}
          disabled={guardando}
        />
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button disabled={guardando || !idUbicacion} onClick={() => void guardar()}>
          {guardando ? 'Guardando...' : 'Cambiar ubicación'}
        </Button>
      </div>
    </>
  );
}

export default CambiarUbicacionDialog;
