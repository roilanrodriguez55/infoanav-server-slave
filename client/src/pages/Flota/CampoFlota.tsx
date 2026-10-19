import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TipoDato } from '@/services/api/flotaApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface CampoFlotaProps {
  id: string;
  etiqueta: string;
  valor: string;
  tipo?: TipoDato;
  onCambiar: (valor: string) => void;
}

const TIPO_ENTRADA: Partial<Record<TipoDato, string>> = {
  entero: 'number',
  decimal: 'number',
  fecha: 'date',
};

// Campo de texto, numero o fecha. Los vacios se marcan en naranja.
export function CampoFlota({ id, etiqueta, valor, tipo = 'texto', onCambiar }: CampoFlotaProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {etiqueta}
      </Label>
      <Input
        id={id}
        type={TIPO_ENTRADA[tipo] ?? 'text'}
        step={tipo === 'entero' ? 1 : tipo === 'decimal' ? 'any' : undefined}
        value={valor}
        onChange={(evento) => onCambiar(evento.target.value)}
        className={cn(
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white',
          esVacio(valor) && CAMPO_PENDIENTE
        )}
      />
    </div>
  );
}
