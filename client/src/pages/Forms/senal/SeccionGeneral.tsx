import { DatePickerField } from '@/components/common/DatePickerField';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CommandSelect } from '@/components/ui/CommandSelect';
import type {
  CatalogosSenal,
  CheckboxChangeHandler,
  FormDataState,
  InputChangeHandler,
  SelectChangeHandler
} from './tipos';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface SeccionGeneralProps {
  formData: FormDataState;
  catalogos: CatalogosSenal;
  onInputChange: InputChangeHandler;
  onCheckboxChange: CheckboxChangeHandler;
  onSelectChange: SelectChangeHandler;
}

export const SeccionGeneral = ({
  formData,
  catalogos,
  onInputChange,
  onCheckboxChange,
  onSelectChange
}: SeccionGeneralProps) => (
  <div className="space-y-6 mt-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Categoría */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_categoria}
          pendiente={esVacio(formData.id_categoria)}
          onValueChange={(value) => onSelectChange('id_categoria', value)}
          placeholder="Seleccionar categoría"
          searchPlaceholder="Buscar categoría..."
          emptyMessage="No se encontraron categorías"
          items={catalogos.categorias}
          label="Categoría"
        />
      </div>

      {/* Modelo */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_modelo}
          pendiente={esVacio(formData.id_modelo)}
          onValueChange={(value) => onSelectChange('id_modelo', value)}
          placeholder="Seleccionar modelo"
          searchPlaceholder="Buscar modelo..."
          emptyMessage="No se encontraron modelos"
          items={catalogos.modelos}
          label="Modelo"
        />
      </div>

      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="nombre" className="text-blue-900 dark:text-gray-200 font-medium">
          Nombre
        </Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Nombre de la señal"
          value={formData.nombre}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(formData.nombre) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Estación */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_estacion}
          pendiente={esVacio(formData.id_estacion)}
          onValueChange={(value) => onSelectChange('id_estacion', value)}
          placeholder="Seleccionar estación"
          searchPlaceholder="Buscar estación..."
          emptyMessage="No se encontraron estaciones"
          items={catalogos.estaciones}
          label="Estación"
        />
      </div>

      {/* Checkbox de Señalización Lumínica */}
      <div className="flex items-center space-x-2 pt-6">
        <Checkbox
          id="luminica"
          name="luminica"
          checked={formData.luminica}
          onCheckedChange={(checked) => onCheckboxChange('luminica', checked as boolean)}
          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
        />
        <Label htmlFor="luminica" className="cursor-pointer text-blue-900 dark:text-gray-200">
          Señalización Lumínica
        </Label>
      </div>

      {/* Fecha instalación */}
      <div className="space-y-2">
        <Label htmlFor="fecha_instalacion" className="text-blue-900 dark:text-gray-200 font-medium">Fecha de Instalación</Label>
        <DatePickerField
          id="fecha_instalacion"
          withTime
          value={formData.fecha_instalacion}
          onChange={(valor) => onSelectChange('fecha_instalacion', valor)}
          className="w-full"
          inputClassName={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.fecha_instalacion) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Secreta */}
      <div className="flex items-center space-x-2 pt-6">
        <Checkbox
          id="secreta"
          name="secreta"
          checked={formData.secreta}
          onCheckedChange={(checked) => onCheckboxChange('secreta', checked as boolean)}
          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
        />
        <Label htmlFor="secreta" className="cursor-pointer text-blue-900 dark:text-gray-200">Secreta</Label>
      </div>

      {/* Usuario */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_usuario_navegacion}
          pendiente={esVacio(formData.id_usuario_navegacion)}
          onValueChange={(value) => onSelectChange('id_usuario_navegacion', value)}
          placeholder="Seleccionar usuario"
          searchPlaceholder="Buscar usuario..."
          emptyMessage="No se encontraron usuarios"
          items={catalogos.usuarios}
          label="Usuario"
        />
      </div>

      {/* Monitoreo */}
      <div className="space-y-2">
        <Label htmlFor="monitoreo" className="text-blue-900 dark:text-gray-200 font-medium">Monitoreo</Label>
        <Input
          id="monitoreo"
          name="monitoreo"
          placeholder="Tipo de monitoreo"
          value={formData.monitoreo}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(formData.monitoreo) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Zona */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_zona}
          pendiente={esVacio(formData.id_zona)}
          onValueChange={(value) => onSelectChange('id_zona', value)}
          placeholder="Seleccionar zona"
          searchPlaceholder="Buscar zona..."
          emptyMessage="No se encontraron zonas"
          items={catalogos.zonas}
          label="Zona"
        />
      </div>

      {/* Reflector radar */}
      <div className="flex items-center space-x-2 pt-6">
        <Checkbox
          id="reflector_radar"
          name="reflector_radar"
          checked={formData.reflector_radar}
          onCheckedChange={(checked) => onCheckboxChange('reflector_radar', checked as boolean)}
          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
        />
        <Label htmlFor="reflector_radar" className="cursor-pointer text-blue-900 dark:text-gray-200">Reflector Radar</Label>
      </div>

      {/* Repetición */}
      <div className="flex items-center space-x-2 pt-6">
        <Checkbox
          id="repeticion"
          name="repeticion"
          checked={formData.repeticion}
          onCheckedChange={(checked) => onCheckboxChange('repeticion', checked as boolean)}
          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
        />
        <Label htmlFor="repeticion" className="cursor-pointer text-blue-900 dark:text-gray-200">Repetición</Label>
      </div>

      {/* Estado */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_estado}
          pendiente={esVacio(formData.id_estado)}
          onValueChange={(value) => onSelectChange('id_estado', value)}
          placeholder="Seleccionar estado"
          searchPlaceholder="Buscar estado..."
          emptyMessage="No se encontraron estados"
          items={catalogos.estados}
          label="Estado de la señal"
        />
      </div>

      {/* Material */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_material}
          pendiente={esVacio(formData.id_material)}
          onValueChange={(value) => onSelectChange('id_material', value)}
          placeholder="Seleccionar material"
          searchPlaceholder="Buscar material..."
          emptyMessage="No se encontraron materiales"
          items={catalogos.materiales}
          label="Material"
        />
      </div>

      {/* Control a distancia */}
      <div className="flex items-center space-x-2 pt-6">
        <Checkbox
          id="control_distancia"
          name="control_distancia"
          checked={formData.control_distancia}
          onCheckedChange={(checked) => onCheckboxChange('control_distancia', checked as boolean)}
          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
        />
        <Label htmlFor="control_distancia" className="cursor-pointer text-blue-900 dark:text-gray-200">Control a distancia</Label>
      </div>

      {/* Energía */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_energia}
          pendiente={esVacio(formData.id_energia)}
          onValueChange={(value) => onSelectChange('id_energia', value)}
          placeholder="Seleccionar energía"
          searchPlaceholder="Buscar energía..."
          emptyMessage="No se encontraron energías"
          items={catalogos.energias}
          label="Energía"
        />
      </div>

      {/* Marca de tope */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_marca_tope}
          pendiente={esVacio(formData.id_marca_tope)}
          onValueChange={(value) => onSelectChange('id_marca_tope', value)}
          placeholder="Seleccionar marca"
          searchPlaceholder="Buscar marca..."
          emptyMessage="No se encontraron marcas"
          items={catalogos.marcasTope}
          label="Marca de tope"
        />
      </div>

      {/* Complejidad */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_complejidad}
          pendiente={esVacio(formData.id_complejidad)}
          onValueChange={(value) => onSelectChange('id_complejidad', value)}
          placeholder="Seleccionar complejidad"
          searchPlaceholder="Buscar complejidad..."
          emptyMessage="No se encontraron complejidades"
          items={catalogos.complejidades}
          label="Complejidad"
        />
      </div>
    </div>

    {/* Observaciones */}
    <div className="space-y-2 mt-4">
      <Label htmlFor="observaciones" className="text-blue-900 dark:text-gray-200 font-medium">Observaciones</Label>
      <Textarea
        id="observaciones"
        name="observaciones"
        placeholder="Observaciones adicionales..."
        rows={3}
        value={formData.observaciones}
        onChange={onInputChange}
        className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(formData.observaciones) && CAMPO_PENDIENTE)}
      />
    </div>
  </div>
);
