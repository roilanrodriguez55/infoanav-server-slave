import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommandSelect } from '@/components/ui/CommandSelect';
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
import {
  RACON_VACIO,
  raconACampos,
  raconATexto,
  raconService,
  type RaconRegistro,
  type RaconTexto,
} from '@/services/api/raconApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

type Clave = keyof RaconTexto;

interface CampoDef {
  clave: Clave;
  etiqueta: string;
  tipo?: 'text' | 'number' | 'date';
}

const GRUPOS: { titulo: string; campos: CampoDef[] }[] = [
  {
    titulo: 'Radio',
    campos: [
      { clave: 'banda', etiqueta: 'Banda' },
      { clave: 'frecuencia', etiqueta: 'Frecuencia' },
      { clave: 'barrido', etiqueta: 'Barrido' },
      { clave: 'supresion_lobulo_lateral', etiqueta: 'Supresión de lóbulo lateral' },
      { clave: 'pulso', etiqueta: 'Pulso' },
      { clave: 'modo_servicio', etiqueta: 'Modo de servicio' },
      { clave: 'identificador', etiqueta: 'Identificador' },
      { clave: 'largo_identificador', etiqueta: 'Largo del identificador' },
      { clave: 'alcance', etiqueta: 'Alcance', tipo: 'number' },
      { clave: 'sensibilidad', etiqueta: 'Sensibilidad' },
      { clave: 'retardo_pulso', etiqueta: 'Retardo de pulso' },
    ],
  },
  {
    titulo: 'Antena',
    campos: [
      { clave: 'antena_tipo', etiqueta: 'Tipo de antena' },
      { clave: 'antena_ganancia', etiqueta: 'Ganancia' },
      { clave: 'antena_directividad', etiqueta: 'Directividad' },
      { clave: 'antena_polarizacion', etiqueta: 'Polarización' },
    ],
  },
  {
    titulo: 'Físico',
    campos: [
      { clave: 'dimensiones', etiqueta: 'Dimensiones' },
      { clave: 'peso', etiqueta: 'Peso' },
      { clave: 'color', etiqueta: 'Color' },
      { clave: 'energia', etiqueta: 'Energía' },
      { clave: 'consumo', etiqueta: 'Consumo' },
    ],
  },
  {
    titulo: 'Vigencia',
    campos: [
      { clave: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'date' },
      { clave: 'fecha_baja', etiqueta: 'Fecha de baja', tipo: 'date' },
    ],
  },
];

interface Catalogos {
  empresas: CatalogoItem[];
  estaciones: CatalogoItem[];
}

interface RaconFormProps {
  idSenal: string;
  racon: RaconRegistro | null;
  onTerminado: () => void;
  onCancelar: () => void;
}

const Grupo = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{titulo}</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

export default function RaconForm({ idSenal, racon, onTerminado, onCancelar }: RaconFormProps) {
  const [valores, setValores] = useState<RaconTexto>(() => (racon ? raconATexto(racon) : RACON_VACIO));
  const [catalogos, setCatalogos] = useState<Catalogos>({ empresas: [], estaciones: [] });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  useEffect(() => {
    void raconService
      .getCatalogos()
      .then(setCatalogos)
      .catch(() => setError('No se pudieron cargar las empresas y las estaciones'));
  }, []);

  const cambiar = (clave: Clave, valor: string) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const campoTexto = ({ clave, etiqueta, tipo = 'text' }: CampoDef) => (
    <div key={clave} className="space-y-2">
      <Label htmlFor={clave} className="text-sm font-medium">{etiqueta}</Label>
      <Input
        id={clave}
        type={tipo}
        value={valores[clave]}
        onChange={(e) => cambiar(clave, e.target.value)}
        className={cn(
          'dark:border-gray-600 dark:bg-gray-800 dark:text-white',
          esVacio(valores[clave]) && CAMPO_PENDIENTE
        )}
      />
    </div>
  );

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const campos = raconACampos(idSenal, valores);
    const respuesta = racon
      ? await raconService.update(racon.id_racon, campos)
      : await raconService.create(campos);
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  const eliminar = async () => {
    if (!racon) return;
    setGuardando(true);
    const respuesta = await raconService.delete(racon.id_racon);
    setGuardando(false);
    setConfirmarEliminar(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <Grupo titulo="Identificación">
        {campoTexto({ clave: 'numero_orden', etiqueta: 'Número de orden' })}
        {campoTexto({ clave: 'nombre', etiqueta: 'Nombre' })}
        <CommandSelect
          label="Empresa"
          placeholder="Seleccione una empresa"
          searchPlaceholder="Buscar empresa..."
          items={catalogos.empresas}
          value={valores.id_empresa}
          onValueChange={(valor) => cambiar('id_empresa', valor)}
          pendiente={esVacio(valores.id_empresa)}
        />
        <CommandSelect
          label="Estación"
          placeholder="Seleccione una estación"
          searchPlaceholder="Buscar estación..."
          items={catalogos.estaciones}
          value={valores.id_estacion}
          onValueChange={(valor) => cambiar('id_estacion', valor)}
          pendiente={esVacio(valores.id_estacion)}
        />
        {campoTexto({ clave: 'tipo', etiqueta: 'Tipo' })}
      </Grupo>

      {GRUPOS.map((grupo) => (
        <Grupo key={grupo.titulo} titulo={grupo.titulo}>
          {grupo.campos.map(campoTexto)}
        </Grupo>
      ))}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {racon && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmarEliminar(true)}
            disabled={guardando}
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando} className="bg-blue-600 text-white hover:bg-blue-700">
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              El RACON {racon?.numero_orden ?? racon?.nombre ?? ''} se eliminará del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={eliminar}
              disabled={guardando}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
