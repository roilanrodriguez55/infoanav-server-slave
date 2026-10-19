import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommandSelect } from '@/components/ui/CommandSelect';
import type { CatalogosSenal, FormDataState, InputChangeHandler, SelectChangeHandler } from './tipos';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface SeccionLuminicaProps {
  formData: FormDataState;
  catalogos: CatalogosSenal;
  onInputChange: InputChangeHandler;
  onSelectChange: SelectChangeHandler;
}

export const SeccionLuminica = ({ formData, catalogos, onInputChange, onSelectChange }: SeccionLuminicaProps) => (
  <div className="space-y-6 mt-4">
    {!formData.luminica ? (
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          La señalización lumínica está desactivada. Active la opción en Datos Generales para configurar estos campos.
        </AlertDescription>
      </Alert>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Alcance Lumínico */}
        <div className="space-y-2">
          <Label htmlFor="alcanceluminico" className="text-blue-900 dark:text-gray-200 font-medium">Alcance Lumínico (millas)</Label>
          <Input
            id="alcanceluminico"
            name="alcanceluminico"
            type="number"
            min="0"
            step="0.1"
            value={formData.alcanceluminico}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.alcanceluminico) && CAMPO_PENDIENTE)}
          />
        </div>

        {/* Intensidad Lumínica */}
        <div className="space-y-2">
          <Label htmlFor="intensidadluminica" className="text-blue-900 dark:text-gray-200 font-medium">Intensidad Lumínica (cd)</Label>
          <Input
            id="intensidadluminica"
            name="intensidadluminica"
            type="number"
            step="0.1"
            value={formData.intensidadluminica}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.intensidadluminica) && CAMPO_PENDIENTE)}
          />
        </div>

        {/* Color de Luz */}
        <div className="space-y-2">
          <CommandSelect
            value={formData.id_colorluz}
            pendiente={esVacio(formData.id_colorluz)}
            onValueChange={(value) => onSelectChange('id_colorluz', value)}
            placeholder="Seleccionar color de luz"
            searchPlaceholder="Buscar color..."
            emptyMessage="No se encontraron colores"
            items={catalogos.coloresLuz}
            label="Color de Luz"
          />
        </div>

        {/* Característica */}
        <div className="space-y-2">
          <CommandSelect
            value={formData.id_caracteristica}
            pendiente={esVacio(formData.id_caracteristica)}
            onValueChange={(value) => onSelectChange('id_caracteristica', value)}
            placeholder="Seleccionar característica"
            searchPlaceholder="Buscar característica..."
            emptyMessage="No se encontraron características"
            items={catalogos.caracteristicas}
            label="Característica"
          />
        </div>

        {/* Periodo */}
        <div className="space-y-2">
          <Label htmlFor="periodo" className="text-blue-900 dark:text-gray-200 font-medium">Periodo (seg)</Label>
          <Input
            id="periodo"
            name="periodo"
            type="number"
            step="0.1"
            value={formData.periodo}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.periodo) && CAMPO_PENDIENTE)}
          />
        </div>

        {/* Oscuridad */}
        <div className="space-y-2">
          <Label htmlFor="oscuridad" className="text-blue-900 dark:text-gray-200 font-medium">Oscuridad (seg)</Label>
          <Input
            id="oscuridad"
            name="oscuridad"
            type="number"
            step="0.1"
            value={formData.oscuridad}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.oscuridad) && CAMPO_PENDIENTE)}
          />
        </div>

        {/* Tiempo de Luz */}
        <div className="space-y-2">
          <Label htmlFor="tiempoluz" className="text-blue-900 dark:text-gray-200 font-medium">Tiempo de Luz (seg)</Label>
          <Input
            id="tiempoluz"
            name="tiempoluz"
            type="number"
            step="0.1"
            value={formData.tiempoluz}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.tiempoluz) && CAMPO_PENDIENTE)}
          />
        </div>

        {/* Potencia del Bombillo */}
        <div className="space-y-2">
          <Label htmlFor="potenciabombillo" className="text-blue-900 dark:text-gray-200 font-medium">Potencia del Bombillo (W)</Label>
          <Input
            id="potenciabombillo"
            name="potenciabombillo"
            type="number"
            step="1"
            value={formData.potenciabombillo}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.potenciabombillo) && CAMPO_PENDIENTE)}
          />
        </div>

        {/* Voltaje del Bombillo */}
        <div className="space-y-2">
          <Label htmlFor="voltagebombillo" className="text-blue-900 dark:text-gray-200 font-medium">Voltaje del Bombillo (V)</Label>
          <Input
            id="voltagebombillo"
            name="voltagebombillo"
            type="number"
            step="1"
            value={formData.voltagebombillo}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.voltagebombillo) && CAMPO_PENDIENTE)}
          />
        </div>

        {/* Consumo Destellador */}
        <div className="space-y-2">
          <Label htmlFor="consumodestellador" className="text-blue-900 dark:text-gray-200 font-medium">Consumo Destellador (W)</Label>
          <Input
            id="consumodestellador"
            name="consumodestellador"
            type="number"
            step="0.1"
            value={formData.consumodestellador}
            onChange={onInputChange}
            className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white", esVacio(formData.consumodestellador) && CAMPO_PENDIENTE)}
          />
        </div>
      </div>
    )}
  </div>
);
