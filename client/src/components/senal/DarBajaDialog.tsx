import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePickerField } from '@/components/common/DatePickerField';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/services/config/axiosConfig';
import { senalesService } from '@/services/api/senalesApi';

interface DarBajaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idSenal: string;
  codigoLsm: string | null;
  onDadaDeBaja: () => void;
}

const fechaHoy = () => format(new Date(), 'yyyy-MM-dd');

// Radix desmonta el contenido al cerrar, por eso el estado del formulario se reinicia solo en cada apertura.
function FormularioBaja({ idSenal, codigoLsm, onOpenChange, onDadaDeBaja }: Omit<DarBajaDialogProps, 'open'>) {
  const [fecha, setFecha] = useState(fechaHoy);
  const [causa, setCausa] = useState('');
  const [fallasAbiertas, setFallasAbiertas] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    api
      .get<{ id_falla: string }[]>(
        `/fallas?id_senal=eq.${idSenal}&fecha_restablecer=is.null&deleted_at=is.null&select=id_falla`
      )
      .then((respuesta) => {
        if (!cancelado) setFallasAbiertas(respuesta.data.length);
      })
      .catch(() => undefined);

    return () => {
      cancelado = true;
    };
  }, [idSenal]);

  const confirmar = async () => {
    setGuardando(true);
    setError(null);
    const respuesta = await senalesService.darBaja(idSenal, {
      fecha: fecha || undefined,
      causa: causa.trim() || undefined,
    });
    setGuardando(false);

    if (!respuesta.success) {
      setError(respuesta.message || 'Error desconocido');
      return;
    }
    onOpenChange(false);
    onDadaDeBaja();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Dar de baja la señal</DialogTitle>
        <DialogDescription>
          {codigoLsm ? `Señal ${codigoLsm}. ` : ''}La señal quedará marcada como retirada.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="baja-fecha">Fecha de retirada</Label>
          <DatePickerField id="baja-fecha" value={fecha} onChange={setFecha} />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Si la dejas vacía se usa la fecha actual.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="baja-causa">Causa de retirada</Label>
          <Textarea
            id="baja-causa"
            value={causa}
            onChange={(e) => setCausa(e.target.value)}
            placeholder="Opcional"
            className="dark:bg-gray-800 dark:text-white"
          />
        </div>

        {fallasAbiertas !== null && fallasAbiertas > 0 && (
          <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Esta señal tiene {fallasAbiertas} falla(s) abierta(s). La baja no las cierra.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <AlertDescription className="text-red-700 dark:text-red-300">
              Error al dar de baja: {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          onClick={() => void confirmar()}
          disabled={guardando}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {guardando ? 'Guardando...' : 'Dar de baja'}
        </Button>
      </DialogFooter>
    </>
  );
}

export function DarBajaDialog({ open, onOpenChange, idSenal, codigoLsm, onDadaDeBaja }: DarBajaDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <FormularioBaja
          idSenal={idSenal}
          codigoLsm={codigoLsm}
          onOpenChange={onOpenChange}
          onDadaDeBaja={onDadaDeBaja}
        />
      </DialogContent>
    </Dialog>
  );
}
