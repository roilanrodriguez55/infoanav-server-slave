import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { senalesService, type CatalogoItem } from '@/services/api/senalesApi';
import {
  HECHO_VACIO,
  hechoACampos,
  hechoATexto,
  hechosService,
  type ConcluirHechoTexto,
  type HechoRegistro,
  type HechoTexto,
} from '@/services/api/hechosApi';
import { aTextoLocal } from '@/lib/planMantenimiento';
import { DatePickerField } from '@/components/common/DatePickerField';
import { CAMPO_PENDIENTE, cn, esVacio, etiquetaSenal } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Clave = Exclude<keyof HechoTexto, 'vandalico'>;

interface CampoDef {
  clave: Clave;
  etiqueta: string;
  tipo?: 'text' | 'date' | 'time' | 'number';
  textarea?: boolean;
  ancho?: 'completo';
}

const GRUPOS: { titulo: string; campos: CampoDef[] }[] = [
  {
    titulo: 'Identificación',
    campos: [
      { clave: 'fecha', etiqueta: 'Fecha', tipo: 'date' },
      { clave: 'hora', etiqueta: 'Hora', tipo: 'time' },
      { clave: 'reporta', etiqueta: 'Reporta' },
      { clave: 'ogo', etiqueta: 'OGO' },
      { clave: 'rg', etiqueta: 'RG' },
    ],
  },
  {
    titulo: 'Hecho',
    campos: [
      { clave: 'hecho', etiqueta: 'Hecho', textarea: true, ancho: 'completo' },
      { clave: 'perdidas', etiqueta: 'Pérdidas', textarea: true, ancho: 'completo' },
    ],
  },
  {
    titulo: 'Costos',
    campos: [
      { clave: 'costo_mn', etiqueta: 'Costo (MN)', tipo: 'number' },
      { clave: 'costo_mlc', etiqueta: 'Costo (MLC)', tipo: 'number' },
    ],
  },
  {
    titulo: 'Seguimiento',
    campos: [
      { clave: 'medidas', etiqueta: 'Medidas', textarea: true, ancho: 'completo' },
      { clave: 'fecha_pronostico_conclusion', etiqueta: 'Fecha pronosticada de conclusión', tipo: 'date' },
      { clave: 'observaciones', etiqueta: 'Observaciones', textarea: true, ancho: 'completo' },
    ],
  },
];

interface HechoFormProps {
  // Señal fija (pestaña de la señal). Null muestra el selector de señal.
  idSenal: string | null;
  hecho: HechoRegistro | null;
  onTerminado: () => void;
  onCancelar: () => void;
}

const Grupo = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{titulo}</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

// Fecha de hoy en formato de input date ('YYYY-MM-DD'), hora local.
const hoyLocal = () => aTextoLocal(new Date()).slice(0, 10);

export default function HechoForm({ idSenal, hecho, onTerminado, onCancelar }: HechoFormProps) {
  const [valores, setValores] = useState<HechoTexto>(() => (hecho ? hechoATexto(hecho) : HECHO_VACIO));
  const [idSenalSeleccionada, setIdSenalSeleccionada] = useState(idSenal ?? hecho?.id_senal ?? '');
  const [senales, setSenales] = useState<CatalogoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [concluyendo, setConcluyendo] = useState(false);
  const [conclusion, setConclusion] = useState<ConcluirHechoTexto>({ fecha_conclusion: '', medidas: '', observaciones: '' });

  useEffect(() => {
    if (idSenal !== null) return;
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
  }, [idSenal]);

  const cambiar = <K extends keyof HechoTexto>(clave: K, valor: HechoTexto[K]) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const campoTexto = ({ clave, etiqueta, tipo = 'text', textarea, ancho }: CampoDef) => (
    <div key={clave} className={cn('space-y-2', ancho === 'completo' && 'sm:col-span-2')}>
      <Label htmlFor={clave} className="text-sm font-medium">{etiqueta}</Label>
      {textarea ? (
        <Textarea
          id={clave}
          value={valores[clave]}
          onChange={(e) => cambiar(clave, e.target.value)}
          className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(valores[clave]) && CAMPO_PENDIENTE)}
        />
      ) : tipo === 'date' ? (
        <DatePickerField
          id={clave}
          value={valores[clave]}
          onChange={(valor) => cambiar(clave, valor)}
          className="w-full"
          inputClassName={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(valores[clave]) && CAMPO_PENDIENTE)}
        />
      ) : (
        <Input
          id={clave}
          type={tipo}
          step={tipo === 'number' ? '0.01' : undefined}
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
    if (!idSenal && !idSenalSeleccionada) {
      setError('Seleccione la señal del hecho');
      return;
    }
    setGuardando(true);
    const campos = hechoACampos(idSenal ?? idSenalSeleccionada, valores);
    const respuesta = hecho
      ? await hechosService.update(hecho.id_hecho, campos)
      : await hechosService.create(campos);
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  const eliminar = async () => {
    if (!hecho) return;
    setGuardando(true);
    const respuesta = await hechosService.delete(hecho.id_hecho);
    setGuardando(false);
    setConfirmarEliminar(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  const abrirConcluir = () => {
    setConclusion({
      fecha_conclusion: hoyLocal(),
      medidas: hecho?.medidas ?? '',
      observaciones: hecho?.observaciones ?? '',
    });
    setConcluyendo(true);
  };

  const concluir = async () => {
    if (!hecho) return;
    setError(null);
    setGuardando(true);
    const respuesta = await hechosService.concluir(hecho.id_hecho, conclusion);
    setGuardando(false);
    setConcluyendo(false);
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
        {idSenal === null && (
          <div className="sm:col-span-2">
            <CommandSelect
              label="Señal"
              placeholder="Seleccione una señal"
              searchPlaceholder="Buscar por código o nombre..."
              items={senales}
              value={idSenalSeleccionada}
              onValueChange={setIdSenalSeleccionada}
              pendiente={esVacio(idSenalSeleccionada)}
            />
          </div>
        )}
        {GRUPOS[0].campos.map(campoTexto)}
      </Grupo>

      <Grupo titulo={GRUPOS[1].titulo}>
        {GRUPOS[1].campos.map(campoTexto)}
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="vandalico"
            checked={valores.vandalico}
            onCheckedChange={(marcado) => cambiar('vandalico', marcado === true)}
          />
          <Label htmlFor="vandalico" className="text-sm font-medium">Vandálico</Label>
        </div>
      </Grupo>

      <Grupo titulo={GRUPOS[2].titulo}>{GRUPOS[2].campos.map(campoTexto)}</Grupo>

      <Grupo titulo={GRUPOS[3].titulo}>{GRUPOS[3].campos.map(campoTexto)}</Grupo>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {hecho && (
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
        {hecho && !hecho.concluso && (
          <Button
            type="button"
            variant="outline"
            onClick={abrirConcluir}
            disabled={guardando}
            className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Concluir
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

      <Dialog open={concluyendo} onOpenChange={setConcluyendo}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Concluir hecho</DialogTitle>
            <DialogDescription>Registre la fecha de conclusión y, si corresponde, las medidas adoptadas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_conclusion" className="text-sm font-medium">Fecha de conclusión</Label>
              <DatePickerField
                id="fecha_conclusion"
                value={conclusion.fecha_conclusion}
                onChange={(valor) => setConclusion((previo) => ({ ...previo, fecha_conclusion: valor }))}
                className="w-full"
                inputClassName={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(conclusion.fecha_conclusion) && CAMPO_PENDIENTE)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conclusion_medidas" className="text-sm font-medium">Medidas</Label>
              <Textarea
                id="conclusion_medidas"
                value={conclusion.medidas}
                onChange={(e) => setConclusion((previo) => ({ ...previo, medidas: e.target.value }))}
                className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(conclusion.medidas) && CAMPO_PENDIENTE)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conclusion_observaciones" className="text-sm font-medium">Observaciones</Label>
              <Textarea
                id="conclusion_observaciones"
                value={conclusion.observaciones}
                onChange={(e) => setConclusion((previo) => ({ ...previo, observaciones: e.target.value }))}
                className={cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', esVacio(conclusion.observaciones) && CAMPO_PENDIENTE)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConcluyendo(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => { void concluir(); }} disabled={guardando} className="bg-green-600 text-white hover:bg-green-700">
              {guardando ? 'Guardando...' : 'Concluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>El hecho se eliminará del sistema.</AlertDialogDescription>
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
