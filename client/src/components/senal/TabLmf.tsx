import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, Anchor, Plus, Trash2 } from 'lucide-react';
import { useServerList } from '@/hooks/useServerList';
import { flotaService } from '@/services/api/flotaApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';
import {
  GIRATORIO_SI,
  LMF_PATH,
  LMF_VACIO,
  fusionarSistemaFondeo,
  lmfACampos,
  lmfATexto,
  lmfService,
  precargaDesdeFondeo,
  type LmfRegistro,
  type LmfTexto,
} from '@/services/api/lmfApi';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Pagination } from '@/components/common/Pagination';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface TabLmfProps {
  idSenal: string;
}

interface Mensaje {
  tipo: 'success' | 'warning' | 'error';
  texto: string;
}

type Clave = keyof LmfTexto;

const SIN_FILTROS: Record<string, never> = {};
const SIN_DEFINIR = '__sin_definir__';

const formatearFecha = (fecha: string | null) =>
  fecha ? new Date(fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const ESTILOS_MENSAJE: Record<Mensaje['tipo'], string> = {
  success: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  error: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
};

const CLASE_CAMPO = 'dark:border-gray-600 dark:bg-gray-800 dark:text-white';

interface LmfFormProps {
  idSenal: string;
  lmf: LmfRegistro | null;
  inicial: Partial<LmfTexto>;
  aviso: string | null;
  onTerminado: (mensaje: Mensaje) => void;
  onCancelar: () => void;
}

const Grupo = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{titulo}</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

function LmfForm({ idSenal, lmf, inicial, aviso, onTerminado, onCancelar }: LmfFormProps) {
  const [valores, setValores] = useState<LmfTexto>(() => (lmf ? lmfATexto(lmf) : { ...LMF_VACIO, ...inicial }));
  const [actualizarFondeo, setActualizarFondeo] = useState(true);
  const [buques, setBuques] = useState<CatalogoItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  useEffect(() => {
    void flotaService.getBuquesCatalogo().then(setBuques).catch(() => undefined);
  }, []);

  const cambiar = (clave: Clave, valor: string) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const quitarBuque = () => {
    setValores((previo) => ({ ...previo, id_buque_ejecutor: '', buque_ejecutor: '' }));
  };

  const campo = (clave: Clave, etiqueta: string, tipo = 'text') => (
    <div key={clave} className="space-y-2">
      <Label htmlFor={clave} className="text-sm font-medium">{etiqueta}</Label>
      <Input
        id={clave}
        type={tipo}
        step={tipo === 'number' ? 'any' : undefined}
        value={valores[clave]}
        onChange={(e) => cambiar(clave, e.target.value)}
        className={cn(CLASE_CAMPO, esVacio(valores[clave]) && CAMPO_PENDIENTE)}
      />
    </div>
  );

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    // El nombre del buque elegido se guarda en buque_ejecutor para informes; sin buque elegido se conserva el texto antiguo.
    const nombreBuque = buques.find((buque) => buque.id === valores.id_buque_ejecutor)?.nombre;
    const campos = lmfACampos(idSenal, { ...valores, buque_ejecutor: nombreBuque ?? valores.buque_ejecutor });
    const avisos: string[] = [];
    let fondeoJson: string | null = null;

    // Al crear, el fondeo de la señal se reescribe solo si la casilla esta marcada.
    if (!lmf && actualizarFondeo) {
      try {
        const fusion = fusionarSistemaFondeo(await lmfService.getSistemaFondeo(idSenal), campos);
        if ('error' in fusion) {
          avisos.push(`${fusion.error} Se guardó solo la operación de Leva, Mantenimiento y Fondeo (LMF), sin cambiar el fondeo.`);
        } else {
          fondeoJson = fusion.json;
        }
      } catch {
        avisos.push('No se pudo leer el fondeo actual de la señal. Se guardó solo la operación.');
      }
    }

    const respuesta = lmf ? await lmfService.update(lmf.id_lmf, campos) : await lmfService.create(campos);
    if (!respuesta.success) {
      setGuardando(false);
      setError(respuesta.message);
      return;
    }

    if (fondeoJson !== null) {
      const fondeo = await lmfService.guardarSistemaFondeo(idSenal, fondeoJson);
      if (!fondeo.success) {
        avisos.push('La operación se guardó, pero no se pudo actualizar el fondeo de la señal.');
      }
    }

    onTerminado(avisos.length > 0 ? { tipo: 'warning', texto: avisos.join(' ') } : { tipo: 'success', texto: respuesta.message });
  };

  const eliminar = async () => {
    if (!lmf) return;
    setGuardando(true);
    const respuesta = await lmfService.delete(lmf.id_lmf);
    setConfirmarEliminar(false);
    if (respuesta.success) {
      onTerminado({ tipo: 'success', texto: respuesta.message });
    } else {
      setGuardando(false);
      setError(respuesta.message);
    }
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      {aviso && (
        <Alert className={ESTILOS_MENSAJE.warning}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{aviso}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className={ESTILOS_MENSAJE.error}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Grupo titulo="Operación">
        {campo('fecha_leva', 'Fecha de leva', 'datetime-local')}
        {campo('fecha_fondeo', 'Fecha de fondeo', 'datetime-local')}
        <div key="id_buque_ejecutor" className="space-y-2">
          <CommandSelect
            value={valores.id_buque_ejecutor}
            onValueChange={(valor) => cambiar('id_buque_ejecutor', valor)}
            placeholder="Seleccionar buque de la flota"
            searchPlaceholder="Buscar buque..."
            emptyMessage="No se encontraron buques"
            items={buques}
            label="Buque ejecutor"
            pendiente={esVacio(valores.id_buque_ejecutor)}
          />
          {!valores.id_buque_ejecutor && valores.buque_ejecutor && (
            <p className="text-sm text-gray-600 dark:text-gray-300">Registrado como: {valores.buque_ejecutor}</p>
          )}
          {valores.id_buque_ejecutor && (
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={quitarBuque}>
              Quitar buque
            </Button>
          )}
        </div>
        {campo('capitan', 'Capitán')}
        {campo('responsable', 'Responsable')}
        {campo('dirigente', 'Dirigente')}
        <div key="observaciones" className="space-y-2 sm:col-span-2">
          <Label htmlFor="observaciones" className="text-sm font-medium">Observaciones</Label>
          <Textarea
            id="observaciones"
            value={valores.observaciones}
            onChange={(e) => cambiar('observaciones', e.target.value)}
            className={cn(CLASE_CAMPO, esVacio(valores.observaciones) && CAMPO_PENDIENTE)}
          />
        </div>
      </Grupo>

      <Grupo titulo="Condiciones">
        {campo('marea', 'Marea')}
        {campo('mar', 'Mar')}
        {campo('viento', 'Viento')}
        {campo('estado_tiempo', 'Estado del tiempo')}
        {campo('metodo_posicion', 'Método de posición')}
        {campo('tipo_fondo', 'Tipo de fondo')}
        {campo('latitud', 'Latitud', 'number')}
        {campo('longitud', 'Longitud', 'number')}
      </Grupo>

      <Grupo titulo="Sistema de fondeo usado">
        {campo('profundidad', 'Profundidad', 'number')}
        {campo('cadena_cantidad', 'Cadena, cantidad', 'number')}
        {campo('cadena_diametro', 'Cadena, diámetro', 'number')}
        {campo('pesos_muertos_cantidad', 'Pesos muertos, cantidad', 'number')}
        {campo('pesos_muertos_tipo', 'Pesos muertos, tipo')}
        {campo('grilletes_union_cantidad', 'Grilletes de unión, cantidad', 'number')}
        {campo('grilletes_union_tipo', 'Grilletes de unión, tipo')}
        <div key="grillete_giratorio" className="space-y-2">
          <Label className="text-sm font-medium">Grillete giratorio</Label>
          <Select
            value={valores.grillete_giratorio || SIN_DEFINIR}
            onValueChange={(valor) => cambiar('grillete_giratorio', valor === SIN_DEFINIR ? '' : valor)}
          >
            <SelectTrigger
              className={cn('w-full', CLASE_CAMPO, esVacio(valores.grillete_giratorio) && CAMPO_PENDIENTE)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_DEFINIR}>Sin definir</SelectItem>
              <SelectItem value={GIRATORIO_SI}>Sí</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {campo('brida_tipo', 'Brida, tipo')}
        {campo('brida_cantidad', 'Brida, cantidad', 'number')}

        {!lmf && (
          <label className="flex items-start gap-3 text-sm sm:col-span-2">
            <Checkbox
              checked={actualizarFondeo}
              onCheckedChange={(marcada) => setActualizarFondeo(marcada === true)}
              className="mt-0.5"
            />
            <span>Actualizar el fondeo actual de la señal con estos datos</span>
          </label>
        )}
      </Grupo>

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        {lmf && (
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
              La operación de Leva, Mantenimiento y Fondeo (LMF) del {formatearFecha(lmf?.fecha_leva ?? null)} se eliminará del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} disabled={guardando} className="bg-red-600 text-white hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

export default function TabLmf({ idSenal }: TabLmfProps) {
  const { rows, total, page, pageSize, setPage, loading, error, reload } = useServerList<
    LmfRegistro,
    Record<string, never>
  >({
    path: LMF_PATH,
    pageSize: 20,
    defaultOrder: { column: 'fecha_leva', dir: 'desc' },
    initialFilters: SIN_FILTROS,
    toFilters: () => [{ column: 'id_senal', op: 'eq', value: idSenal }],
  });

  const [panel, setPanel] = useState<{ lmf: LmfRegistro | null; inicial: Partial<LmfTexto>; aviso: string | null } | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [precargando, setPrecargando] = useState(false);

  // Al registrar, el grupo de fondeo se precarga con el sistema_fondeo actual de la señal.
  const registrar = async () => {
    setMensaje(null);
    setPrecargando(true);
    let inicial: Partial<LmfTexto> = {};
    let aviso: string | null = null;
    try {
      const precarga = precargaDesdeFondeo(await lmfService.getSistemaFondeo(idSenal));
      if ('error' in precarga) {
        aviso = `${precarga.error} El fondeo no se precargó.`;
      } else {
        inicial = precarga.valores;
      }
    } catch {
      aviso = 'No se pudo leer el fondeo actual de la señal. El fondeo no se precargó.';
    }
    setPrecargando(false);
    setPanel({ lmf: null, inicial, aviso });
  };

  const terminar = (resultado: Mensaje) => {
    setPanel(null);
    setMensaje(resultado);
    reload();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
            <Anchor className="h-5 w-5 text-icon-strong" />
            Leva, Mantenimiento y Fondeo (LMF)
          </h3>
        </div>
        <Button
          onClick={registrar}
          disabled={precargando}
          className="bg-gray-800 text-white shadow-md hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          {precargando ? 'Cargando fondeo...' : 'Registrar Leva, Mantenimiento y Fondeo (LMF)'}
        </Button>
      </div>

      {mensaje && (
        <Alert className={ESTILOS_MENSAJE[mensaje.tipo]}>
          <AlertDescription>{mensaje.texto}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className={ESTILOS_MENSAJE.error}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            {error}
            <Button variant="outline" size="sm" onClick={reload}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="py-8 text-center text-gray-600 dark:text-gray-300">Cargando operaciones de Leva, Mantenimiento y Fondeo (LMF)...</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-gray-500 dark:text-gray-400">Esta señal no tiene operaciones de Leva, Mantenimiento y Fondeo (LMF) registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700">
                <TableHead className="font-semibold">Fecha de leva</TableHead>
                <TableHead className="font-semibold">Fecha de fondeo</TableHead>
                <TableHead className="font-semibold">Buque ejecutor</TableHead>
                <TableHead className="font-semibold">Responsable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lmf) => (
                <TableRow
                  key={lmf.id_lmf}
                  onClick={() => setPanel({ lmf, inicial: {}, aviso: null })}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell className="font-medium">{formatearFecha(lmf.fecha_leva)}</TableCell>
                  <TableCell>{formatearFecha(lmf.fecha_fondeo)}</TableCell>
                  <TableCell>{lmf.buque_ejecutor ?? '-'}</TableCell>
                  <TableCell>{lmf.responsable ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} loading={loading} />

      <DetailPanel
        open={panel !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setPanel(null);
        }}
        title={panel?.lmf ? 'Editar Leva, Mantenimiento y Fondeo (LMF)' : 'Registrar Leva, Mantenimiento y Fondeo (LMF)'}
        description="Operación de leva, mantenimiento y fondeo de la señal"
      >
        {panel && (
          <LmfForm
            key={panel.lmf?.id_lmf ?? 'nuevo'}
            idSenal={idSenal}
            lmf={panel.lmf}
            inicial={panel.inicial}
            aviso={panel.aviso}
            onTerminado={terminar}
            onCancelar={() => setPanel(null)}
          />
        )}
      </DetailPanel>
    </div>
  );
}
