import { useState, type FormEvent } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MODELO_VACIO,
  modeloACampos,
  modeloATexto,
  equiposService,
  type ModeloEquipo,
  type ModeloTexto,
  type TipoEquipo,
} from '@/services/api/equiposApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface ModeloFormProps {
  modelo: ModeloEquipo | null;
  tipos: TipoEquipo[];
  onTerminado: () => void;
  onCancelar: () => void;
}

// Solo administradores llegan aqui (el CRUD de modelos es exclusivo).
export function ModeloForm({ modelo, tipos, onTerminado, onCancelar }: ModeloFormProps) {
  const [valores, setValores] = useState<ModeloTexto>(() => (modelo ? modeloATexto(modelo) : MODELO_VACIO));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const cambiar = (clave: keyof ModeloTexto, valor: string) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const claseCampo = (vacio: boolean) =>
    cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', vacio && CAMPO_PENDIENTE);

  const nombreVacio = esVacio(valores.nombre);
  const tipoVacio = esVacio(valores.id_tipo_equipamiento);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (nombreVacio || tipoVacio) return;
    setError(null);
    setGuardando(true);
    const campos = modeloACampos(valores);
    const respuesta = modelo
      ? await equiposService.updateModelo(modelo.id_modelo_equipo, campos)
      : await equiposService.createModelo(campos);
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  const eliminar = async () => {
    if (!modelo) return;
    setGuardando(true);
    const respuesta = await equiposService.deleteModelo(modelo.id_modelo_equipo);
    setGuardando(false);
    if (respuesta.success) {
      setConfirmarEliminar(false);
      onTerminado();
    } else {
      setConfirmarEliminar(false);
      setError(respuesta.message);
    }
  };

  return (
    <form onSubmit={(e) => { void guardar(e); }} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="modelo_nombre" className="text-sm font-medium">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="modelo_nombre"
            value={valores.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            className={claseCampo(nombreVacio)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="text-sm font-medium">
            Tipo de equipamiento <span className="text-red-500">*</span>
          </Label>
          <Select value={valores.id_tipo_equipamiento} onValueChange={(valor) => cambiar('id_tipo_equipamiento', valor)}>
            <SelectTrigger className={cn('w-full', claseCampo(tipoVacio))}>
              <SelectValue placeholder="Seleccione un tipo" />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((tipo) => (
                <SelectItem key={tipo.id_tipo_equipamiento} value={tipo.id_tipo_equipamiento}>
                  {tipo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo_pais" className="text-sm font-medium">País</Label>
          <Input
            id="modelo_pais"
            value={valores.pais}
            onChange={(e) => cambiar('pais', e.target.value)}
            className={claseCampo(esVacio(valores.pais))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo_consumo" className="text-sm font-medium">Consumo</Label>
          <Input
            id="modelo_consumo"
            value={valores.consumo}
            onChange={(e) => cambiar('consumo', e.target.value)}
            className={claseCampo(esVacio(valores.consumo))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo_voltaje" className="text-sm font-medium">Voltaje</Label>
          <Input
            id="modelo_voltaje"
            type="number"
            step="any"
            value={valores.voltaje}
            onChange={(e) => cambiar('voltaje', e.target.value)}
            className={claseCampo(esVacio(valores.voltaje))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo_vatios" className="text-sm font-medium">Vatios</Label>
          <Input
            id="modelo_vatios"
            type="number"
            step="any"
            value={valores.vatios}
            onChange={(e) => cambiar('vatios', e.target.value)}
            className={claseCampo(esVacio(valores.vatios))}
          />
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {modelo ? (
          <Button
            type="button"
            variant="outline"
            disabled={guardando}
            className="text-red-600 dark:text-red-400"
            onClick={() => setConfirmarEliminar(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando || nombreVacio || tipoVacio}>
            {guardando ? 'Guardando...' : modelo ? 'Guardar cambios' : 'Crear modelo'}
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              El modelo {valores.nombre} dejará de aparecer en el catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={guardando}
              onClick={(e) => {
                e.preventDefault();
                void eliminar();
              }}
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

export default ModeloForm;
