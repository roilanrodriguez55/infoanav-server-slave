import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Copy, ShieldAlert } from 'lucide-react';

interface CodigoRecuperacionProps {
  codigo: string;
  onConfirmar: () => void;
}

export default function CodigoRecuperacion({ codigo, onConfirmar }: CodigoRecuperacionProps) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
        <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-300">
          Guárdalo en un lugar seguro, no se vuelve a mostrar.
        </AlertDescription>
      </Alert>

      <div className="rounded-md border border-border bg-muted p-4 text-center">
        <p className="font-mono text-lg font-semibold tracking-widest break-all select-all" data-testid="codigo-recuperacion">
          {codigo}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => void copiar()} className="w-full sm:w-auto">
          {copiado ? <Check className="h-4 w-4 mr-2 text-green-600" /> : <Copy className="h-4 w-4 mr-2 text-icon" />}
          {copiado ? 'Copiado' : 'Copiar'}
        </Button>
        <Button type="button" onClick={onConfirmar} className="w-full sm:w-auto">
          Ya lo guardé
        </Button>
      </div>
    </div>
  );
}
