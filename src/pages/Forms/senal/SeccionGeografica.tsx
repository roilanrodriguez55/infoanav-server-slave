import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommandSelect } from '@/components/ui/CommandSelect';
import type { CatalogosSenal, FormDataState, InputChangeHandler, SelectChangeHandler } from './tipos';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface SeccionGeograficaProps {
  formData: FormDataState;
  catalogos: CatalogosSenal;
  onInputChange: InputChangeHandler;
  onSelectChange: SelectChangeHandler;
}

export const SeccionGeografica = ({ formData, catalogos, onInputChange, onSelectChange }: SeccionGeograficaProps) => (
  <div className="space-y-6 mt-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Color */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_color}
          pendiente={esVacio(formData.id_color)}
          onValueChange={(value) => onSelectChange('id_color', value)}
          placeholder="Seleccionar color"
          searchPlaceholder="Buscar color..."
          emptyMessage="No se encontraron colores"
          items={catalogos.colores}
          label="Color"
        />
      </div>

      {/* Forma */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_forma}
          pendiente={esVacio(formData.id_forma)}
          onValueChange={(value) => onSelectChange('id_forma', value)}
          placeholder="Seleccionar forma"
          searchPlaceholder="Buscar forma..."
          emptyMessage="No se encontraron formas"
          items={catalogos.formas}
          label="Forma"
        />
      </div>

      {/* Altura */}
      <div className="space-y-2">
        <Label htmlFor="altura" className="text-blue-900 dark:text-gray-200 font-medium">Altura (m)</Label>
        <Input
          id="altura"
          name="altura"
          type="number"
          step="0.1"
          value={formData.altura}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.altura) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Elevación */}
      <div className="space-y-2">
        <Label htmlFor="elevacion" className="text-blue-900 dark:text-gray-200 font-medium">Elevación (m)</Label>
        <Input
          id="elevacion"
          name="elevacion"
          type="number"
          step="0.1"
          value={formData.elevacion}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.elevacion) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Profundidad */}
      <div className="space-y-2">
        <Label htmlFor="profundidad" className="text-blue-900 dark:text-gray-200 font-medium">Profundidad (m)</Label>
        <Input
          id="profundidad"
          name="profundidad"
          type="number"
          step="0.1"
          value={formData.profundidad}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.profundidad) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Alcance Geográfico */}
      <div className="space-y-2">
        <Label htmlFor="alcancegeografico" className="text-blue-900 dark:text-gray-200 font-medium">Alcance Geográfico (millas)</Label>
        <Input
          id="alcancegeografico"
          name="alcancegeografico"
          type="number"
          step="0.1"
          value={formData.alcancegeografico}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.alcancegeografico) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Latitud */}
      <div className="space-y-2">
        <Label htmlFor="latitud" className="text-blue-900 dark:text-gray-200 font-medium">Latitud</Label>
        <Input
          id="latitud"
          name="latitud"
          type="number"
          step="any"
          placeholder="Ej: 10.2583"
          value={formData.latitud}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(formData.latitud) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Longitud */}
      <div className="space-y-2">
        <Label htmlFor="longitud" className="text-blue-900 dark:text-gray-200 font-medium">Longitud</Label>
        <Input
          id="longitud"
          name="longitud"
          type="number"
          step="any"
          placeholder="Ej: -75.5200"
          value={formData.longitud}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(formData.longitud) && CAMPO_PENDIENTE)}
        />
      </div>

      {/* Mar */}
      <div className="space-y-2">
        <CommandSelect
          value={formData.id_mar}
          pendiente={esVacio(formData.id_mar)}
          onValueChange={(value) => onSelectChange('id_mar', value)}
          placeholder="Seleccionar mar"
          searchPlaceholder="Buscar mar..."
          emptyMessage="No se encontraron mares"
          items={catalogos.mares}
          label="Mar"
        />
      </div>

      {/* Ubicación */}
      <div className="space-y-2 lg:col-span-2">
        <Label htmlFor="ubicacion" className="text-blue-900 dark:text-gray-200 font-medium">Ubicación</Label>
        <Input
          id="ubicacion"
          name="ubicacion"
          placeholder="Descripción de ubicación"
          value={formData.ubicacion}
          onChange={onInputChange}
          className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(formData.ubicacion) && CAMPO_PENDIENTE)}
        />
      </div>
    </div>
  </div>
);
