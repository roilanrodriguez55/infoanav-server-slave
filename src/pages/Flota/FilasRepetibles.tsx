import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Esquema, Texto } from '@/services/api/flotaApi';
import { CampoFlota } from './CampoFlota';

// Fila editable: clave local para React, id del registro si ya existe en la base.
export interface FilaEditable<K extends string> {
  clave: string;
  id?: string;
  texto: Texto<K>;
}

interface FilasRepetiblesProps<K extends string> {
  idPrefijo: string;
  esquema: Esquema<K>;
  etiquetas: Record<K, string>;
  filas: FilaEditable<K>[];
  onCambiar: (clave: string, campo: K, valor: string) => void;
  onAgregar: () => void;
  onQuitar: (clave: string) => void;
}

export function FilasRepetibles<K extends string>({
  idPrefijo,
  esquema,
  etiquetas,
  filas,
  onCambiar,
  onAgregar,
  onQuitar,
}: FilasRepetiblesProps<K>) {
  const campos = Object.keys(esquema) as K[];

  return (
    <div className="space-y-4">
      {filas.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Sin registros.</p>
      )}

      {filas.map((fila, indice) => (
        <div
          key={fila.clave}
          className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-600"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-400">Registro {indice + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`Quitar registro ${indice + 1}`}
              onClick={() => onQuitar(fila.clave)}
              className="text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Quitar
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campos.map((campo) => (
              <CampoFlota
                key={campo}
                id={`${idPrefijo}-${fila.clave}-${campo}`}
                etiqueta={etiquetas[campo]}
                valor={fila.texto[campo]}
                tipo={esquema[campo]}
                onCambiar={(valor) => onCambiar(fila.clave, campo, valor)}
              />
            ))}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={onAgregar}>
        <Plus className="mr-2 h-4 w-4" />
        Agregar registro
      </Button>
    </div>
  );
}
