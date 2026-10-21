import { useState, type FormEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ESTADOS_DEVOLUCION, documentacionService } from '@/services/api/documentacionApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface DevolverDialogProps {
  idPrestamo: string;
  descripcion: string;
  onOpenChange: (abierto: boolean) => void;
  onTerminado: () => void;
}

export default function DevolverDialog({ idPrestamo, descripcion, onOpenChange, onTerminado }: DevolverDialogProps) {
  const [estado, setEstado] = useState<string>(ESTADOS_DEVOLUCION[0]);
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const respuesta = await documentacionService.devolver(idPrestamo, estado, observaciones);
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Devolver libro</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { void guardar(e); }} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Estado al devolver <span className="text-red-500">*</span>
            </Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger className="w-full dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_DEVOLUCION.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>{opcion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-sm font-medium">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(observaciones) && CAMPO_PENDIENTE)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Devolver'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
