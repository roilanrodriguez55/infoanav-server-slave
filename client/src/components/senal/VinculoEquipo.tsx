import { useEffect, useState } from 'react';
import { AlertCircle, Link2, Unlink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { equiposService } from '@/services/api/equiposApi';
import type { CatalogoItem } from '@/services/api/senalesApi';

interface VinculoEquipoProps {
  // Linea de equipamientos_senal que se vincula.
  idEquipamiento: string;
  // Tipo de la linea: solo se ofrecen equipos de ese mismo tipo.
  idTipoEquipamiento: string | null;
  // Equipo vinculado al cargar (equipamientos_senal.id_equipo).
  idEquipo: string | null;
  // Se llama tras guardar con el nuevo id_equipo (null si se desvinculo).
  onVinculado?: (idEquipo: string | null) => void;
}

// Vinculo manual de una linea de equipamiento de la señal con un equipo fisico.
// Si la linea cambia de equipo desde fuera, montar de nuevo con una key distinta.
export function VinculoEquipo({ idEquipamiento, idTipoEquipamiento, idEquipo, onVinculado }: VinculoEquipoProps) {
  const [opciones, setOpciones] = useState<CatalogoItem[]>([]);
  const [seleccion, setSeleccion] = useState(idEquipo ?? '');
  const [vinculado, setVinculado] = useState<string | null>(idEquipo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idTipoEquipamiento) return;
    equiposService
      .getEquiposDeTipo(idTipoEquipamiento)
      .then((equipos) =>
        setOpciones(
          equipos.map((equipo) => ({
            id: equipo.id_equipo,
            nombre: equipo.modelo_nombre
              ? `${equipo.numero_inventario} - ${equipo.modelo_nombre}`
              : equipo.numero_inventario,
          }))
        )
      )
      .catch(() => setError('No se pudieron cargar los equipos de este tipo'));
  }, [idTipoEquipamiento]);

  const guardar = async (nuevo: string | null) => {
    setError(null);
    setGuardando(true);
    const respuesta = await equiposService.vincularEquipamiento(idEquipamiento, nuevo);
    setGuardando(false);
    if (respuesta.success) {
      setVinculado(nuevo);
      setSeleccion(nuevo ?? '');
      onVinculado?.(nuevo);
    } else {
      setError(respuesta.message);
    }
  };

  if (!idTipoEquipamiento) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Asigne un tipo de equipamiento a esta línea para poder vincularle un equipo.
      </p>
    );
  }

  const nombreVinculado = vinculado
    ? opciones.find((opcion) => opcion.id === vinculado)?.nombre ?? 'Equipo vinculado'
    : 'Sin vincular';

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium">Equipo: </span>
        {nombreVinculado}
      </p>

      {opciones.length === 0 && !error ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No hay equipos registrados de este tipo.
        </p>
      ) : (
        <CommandSelect
          label="Equipo del mismo tipo"
          placeholder="Seleccione un equipo"
          searchPlaceholder="Buscar por inventario o modelo..."
          items={opciones}
          value={seleccion}
          onValueChange={setSeleccion}
          pendiente={!seleccion}
          disabled={guardando}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={guardando || !seleccion || seleccion === vinculado}
          onClick={() => void guardar(seleccion)}
        >
          <Link2 className="mr-2 h-4 w-4" />
          Vincular
        </Button>
        {vinculado && (
          <Button
            size="sm"
            variant="outline"
            disabled={guardando}
            onClick={() => void guardar(null)}
          >
            <Unlink className="mr-2 h-4 w-4" />
            Desvincular
          </Button>
        )}
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default VinculoEquipo;
