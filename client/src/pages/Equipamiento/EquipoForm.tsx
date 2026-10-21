import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { DatePickerField } from '@/components/common/DatePickerField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  equipoACampos,
  equipoATexto,
  EQUIPO_VACIO,
  equiposService,
  ETIQUETA_UNIDAD_VIDA,
  TIPO_ESTRUCTURA,
  type EquipoRegistro,
  type EquipoTexto,
  type EquiposCatalogos,
  type TipoEquipo,
  type UnidadVida,
} from '@/services/api/equiposApi';
import { senalesService } from '@/services/api/senalesApi';
import { CAMPO_PENDIENTE, cn, esVacio, etiquetaSenal } from '@/lib/utils';

// Radix Select no admite value vacio; esta opcion equivale a sin asignar.
const SIN_ASIGNAR = '__none__';

interface SenalOpcion {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
}

interface EquipoFormProps {
  tipo: TipoEquipo;
  catalogos: EquiposCatalogos;
  equipo: EquipoRegistro | null;
  onTerminado: () => void;
  onCancelar: () => void;
}

const Grupo = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="space-y-4">
    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{titulo}</h3>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

export function EquipoForm({ tipo, catalogos, equipo, onTerminado, onCancelar }: EquipoFormProps) {
  const [valores, setValores] = useState<EquipoTexto>(() => (equipo ? equipoATexto(equipo) : EQUIPO_VACIO));
  const [senales, setSenales] = useState<SenalOpcion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const esEstructura = tipo.nombre.toLowerCase() === TIPO_ESTRUCTURA;
  const modelos = catalogos.modelos.filter((modelo) => modelo.id_tipo_equipamiento === tipo.id_tipo_equipamiento);

  useEffect(() => {
    if (esEstructura) return;
    void senalesService.getSenales().then((res) => {
      if (res.success && Array.isArray(res.data)) setSenales(res.data as SenalOpcion[]);
      else setError('No se pudieron cargar las señales');
    });
  }, [esEstructura]);

  const cambiar = (clave: keyof EquipoTexto, valor: string) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const inventarioVacio = esVacio(valores.numero_inventario);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (inventarioVacio) return;
    setError(null);
    setGuardando(true);
    const campos = equipoACampos(tipo.id_tipo_equipamiento, valores, esEstructura);
    const respuesta = equipo
      ? await equiposService.update(equipo.id_equipo, campos)
      : await equiposService.create(campos);
    setGuardando(false);
    if (respuesta.success) {
      onTerminado();
    } else {
      setError(respuesta.message);
    }
  };

  const claseCampo = (vacio: boolean) =>
    cn('dark:border-gray-600 dark:bg-gray-800 dark:text-white', vacio && CAMPO_PENDIENTE);

  return (
    <form onSubmit={guardar} className="space-y-8">
      <Grupo titulo="Identificación">
        <div className="space-y-2">
          <Label htmlFor="numero_inventario" className="text-sm font-medium">
            Número de inventario <span className="text-red-500">*</span>
          </Label>
          <Input
            id="numero_inventario"
            value={valores.numero_inventario}
            onChange={(e) => cambiar('numero_inventario', e.target.value)}
            className={claseCampo(inventarioVacio)}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tipo</Label>
          <Input value={tipo.nombre} disabled />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Modelo</Label>
          <Select
            value={valores.id_modelo_equipo || SIN_ASIGNAR}
            onValueChange={(valor) => cambiar('id_modelo_equipo', valor === SIN_ASIGNAR ? '' : valor)}
          >
            <SelectTrigger className={claseCampo(esVacio(valores.id_modelo_equipo)) + ' w-full'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_ASIGNAR}>Sin asignar</SelectItem>
              {modelos.map((modelo) => (
                <SelectItem key={modelo.id_modelo_equipo} value={modelo.id_modelo_equipo}>
                  {modelo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Empresa</Label>
          <Select
            value={valores.id_empresa || SIN_ASIGNAR}
            onValueChange={(valor) => cambiar('id_empresa', valor === SIN_ASIGNAR ? '' : valor)}
          >
            <SelectTrigger className={claseCampo(esVacio(valores.id_empresa)) + ' w-full'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SIN_ASIGNAR}>Sin asignar</SelectItem>
              {catalogos.empresas.map((empresa) => (
                <SelectItem key={empresa.id} value={empresa.id}>{empresa.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Grupo>

      <Grupo titulo="Adquisición y vida útil">
        <div className="space-y-2">
          <Label htmlFor="proveedor" className="text-sm font-medium">Proveedor</Label>
          <Input
            id="proveedor"
            value={valores.proveedor}
            onChange={(e) => cambiar('proveedor', e.target.value)}
            className={claseCampo(esVacio(valores.proveedor))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha_inicio_servicio" className="text-sm font-medium">Inicio de servicio</Label>
          <DatePickerField
            id="fecha_inicio_servicio"
            value={valores.fecha_inicio_servicio}
            onChange={(valor) => cambiar('fecha_inicio_servicio', valor)}
            className="w-full"
            inputClassName={claseCampo(esVacio(valores.fecha_inicio_servicio))}
          />
        </div>
        {esEstructura && (
          <div className="space-y-2">
            <Label htmlFor="garantia" className="text-sm font-medium">Garantía</Label>
            <Input
              id="garantia"
              value={valores.garantia}
              onChange={(e) => cambiar('garantia', e.target.value)}
              className={claseCampo(esVacio(valores.garantia))}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="vida_cantidad" className="text-sm font-medium">Vida útil</Label>
          <div className="flex gap-2">
            <Input
              id="vida_cantidad"
              type="number"
              min="0"
              step="any"
              value={valores.vida_cantidad}
              onChange={(e) => cambiar('vida_cantidad', e.target.value)}
              className={cn(claseCampo(esVacio(valores.vida_cantidad)), 'w-28')}
            />
            <Select
              value={valores.vida_unidad}
              onValueChange={(valor) => cambiar('vida_unidad', valor)}
            >
              <SelectTrigger className="flex-1 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ETIQUETA_UNIDAD_VIDA) as UnidadVida[]).map((unidad) => (
                  <SelectItem key={unidad} value={unidad}>{ETIQUETA_UNIDAD_VIDA[unidad]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {!esEstructura && (
          <div className="space-y-2 sm:col-span-2">
            <CommandSelect
              label="LSM inicial"
              placeholder="Seleccione una señal"
              searchPlaceholder="Buscar por código o nombre..."
              items={senales.map((senal) => ({
                id: senal.id_senal,
                nombre: etiquetaSenal(senal.codigo_lsm, senal.nombre),
              }))}
              value={valores.id_senal_inicial}
              onValueChange={(valor) => cambiar('id_senal_inicial', valor)}
              pendiente={esVacio(valores.id_senal_inicial)}
            />
          </div>
        )}
      </Grupo>

      <Grupo titulo="Observaciones">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observaciones" className="text-sm font-medium">Observaciones</Label>
          <Textarea
            id="observaciones"
            rows={3}
            value={valores.observaciones}
            onChange={(e) => cambiar('observaciones', e.target.value)}
            className={claseCampo(esVacio(valores.observaciones))}
          />
        </div>
      </Grupo>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={guardando || inventarioVacio}>
          {guardando ? 'Guardando...' : equipo ? 'Guardar cambios' : 'Crear equipo'}
        </Button>
      </div>
    </form>
  );
}

export default EquipoForm;
