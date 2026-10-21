import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { senalesService, type CatalogoItem } from '@/services/api/senalesApi';
import {
  PLANTA_VACIA,
  getEmpresas,
  plantaACampos,
  plantaATexto,
  plantasService,
  type PlantaRegistro,
  type PlantaTexto,
} from '@/services/api/plantasApi';
import { CAMPO_PENDIENTE, cn, esVacio, etiquetaSenal } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Clave = keyof PlantaTexto;

interface CampoDef {
  clave: Clave;
  etiqueta: string;
  textarea?: boolean;
}

const GRUPOS: { titulo: string; campos: CampoDef[] }[] = [
  {
    titulo: 'Identificación',
    campos: [
      { clave: 'marca', etiqueta: 'Marca' },
      { clave: 'modelo', etiqueta: 'Modelo' },
      { clave: 'numero', etiqueta: 'Número' },
      { clave: 'inventario', etiqueta: 'Inventario' },
      { clave: 'serie', etiqueta: 'Serie' },
    ],
  },
  {
    titulo: 'Ubicación',
    campos: [{ clave: 'faro_texto', etiqueta: 'Faro (texto libre)' }],
  },
  {
    titulo: 'Datos técnicos',
    campos: [
      { clave: 'potencia', etiqueta: 'Potencia' },
      { clave: 'consumo', etiqueta: 'Consumo' },
      { clave: 'voltaje', etiqueta: 'Voltaje' },
      { clave: 'frecuencia', etiqueta: 'Frecuencia' },
    ],
  },
  {
    titulo: 'Observaciones',
    campos: [{ clave: 'observaciones', etiqueta: 'Observaciones', textarea: true }],
  },
];

interface PlantaFormProps {
  planta: PlantaRegistro | null;
  onTerminado: () => void;
  onCancelar: () => void;
}

const Grupo = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{titulo}</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

export default function PlantaForm({ planta, onTerminado, onCancelar }: PlantaFormProps) {
  const [valores, setValores] = useState<PlantaTexto>(() => (planta ? plantaATexto(planta) : PLANTA_VACIA));
  const [empresas, setEmpresas] = useState<CatalogoItem[]>([]);
  const [senales, setSenales] = useState<CatalogoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  useEffect(() => {
    void getEmpresas()
      .then(setEmpresas)
      .catch(() => setError('No se pudieron cargar las empresas'));
    void senalesService.getSenales().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setSenales(
          (res.data as { id_senal: string; codigo_lsm: string; nombre: string | null }[]).map((senal) => ({
            id: senal.id_senal,
            nombre: etiquetaSenal(senal.codigo_lsm, senal.nombre),
          }))
        );
      }
    });
  }, []);

  const cambiar = (clave: Clave, valor: string) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const campoTexto = ({ clave, etiqueta, textarea }: CampoDef) => (
    <div key={clave} className={cn('space-y-2', textarea && 'sm:col-span-2')}>
      <Label htmlFor={clave} className="text-sm font-medium">{etiqueta}</Label>
      {textarea ? (
        <Textarea
          id={clave}
          value={valores[clave]}
          onChange={(e) => cambiar(clave, e.target.value)}
          className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(valores[clave]) && CAMPO_PENDIENTE)}
        />
      ) : (
        <Input
          id={clave}
          value={valores[clave]}
          onChange={(e) => cambiar(clave, e.target.value)}
          className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(valores[clave]) && CAMPO_PENDIENTE)}
        />
      )}
    </div>
  );

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const campos = plantaACampos(valores);
    const respuesta = planta
      ? await plantasService.update(planta.id_planta, campos)
      : await plantasService.create(campos);
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  const eliminar = async () => {
    if (!planta) return;
    setGuardando(true);
    const respuesta = await plantasService.delete(planta.id_planta);
    setGuardando(false);
    setConfirmarEliminar(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  return (
    <form onSubmit={(e) => { void guardar(e); }} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <Grupo titulo={GRUPOS[0].titulo}>
        {GRUPOS[0].campos.map(campoTexto)}
        <CommandSelect
          label="Empresa"
          placeholder="Seleccione una empresa"
          searchPlaceholder="Buscar empresa..."
          items={empresas}
          value={valores.id_empresa}
          onValueChange={(valor) => cambiar('id_empresa', valor)}
          pendiente={esVacio(valores.id_empresa)}
        />
      </Grupo>

      <Grupo titulo={GRUPOS[1].titulo}>
        <CommandSelect
          label="Señal"
          placeholder="Sin señal enlazada"
          searchPlaceholder="Buscar por código o nombre..."
          items={senales}
          value={valores.id_senal}
          onValueChange={(valor) => cambiar('id_senal', valor)}
          pendiente={esVacio(valores.id_senal)}
        />
        {GRUPOS[1].campos.map(campoTexto)}
      </Grupo>

      <Grupo titulo={GRUPOS[2].titulo}>{GRUPOS[2].campos.map(campoTexto)}</Grupo>

      <Grupo titulo={GRUPOS[3].titulo}>{GRUPOS[3].campos.map(campoTexto)}</Grupo>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {planta && (
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
          <Button type="submit" variant="brand" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>La planta se eliminará del sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { void eliminar(); }}
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
