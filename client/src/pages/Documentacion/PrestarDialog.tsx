import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PLAZO_PRESTAMO_DIAS, documentacionService, sumarDias, fechaLocal, type LibroRegistro } from '@/services/api/documentacionApi';
import { fechaCorta } from './documentacionFormato';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface PrestarDialogProps {
  libro: LibroRegistro;
  onOpenChange: (abierto: boolean) => void;
  onTerminado: () => void;
}

export default function PrestarDialog({ libro, onOpenChange, onTerminado }: PrestarDialogProps) {
  const { authState } = useAuth();
  const quienPresta = authState.usuario?.usuario ?? '';
  const [aQuien, setAQuien] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const fechaDevolucion = fechaCorta(fechaLocal(sumarDias(new Date(), PLAZO_PRESTAMO_DIAS)));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const respuesta = await documentacionService.prestar({
      idLibro: libro.id_libro,
      aQuien,
      quienPresta,
    });
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
          <DialogTitle>Prestar libro</DialogTitle>
          <DialogDescription>{libro.titulo}</DialogDescription>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="a_quien" className="text-sm font-medium">
              A quién <span className="text-red-500">*</span>
            </Label>
            <Input
              id="a_quien"
              value={aQuien}
              onChange={(e) => setAQuien(e.target.value)}
              className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(aQuien) && CAMPO_PENDIENTE)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quién presta</Label>
              <Input value={quienPresta} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Devolver antes del</Label>
              <Input value={`${fechaDevolucion} (${PLAZO_PRESTAMO_DIAS} días)`} readOnly disabled />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={guardando || esVacio(aQuien) || !quienPresta}
            >
              {guardando ? 'Guardando...' : 'Prestar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
