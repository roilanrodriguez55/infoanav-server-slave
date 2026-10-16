import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommandSelect } from '@/components/ui/CommandSelect';
import type { CatalogosSenal, EquipamientoItem } from './tipos';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface SeccionEquipamientoProps {
  luminica: boolean;
  equipamiento: EquipamientoItem[];
  tiposEquipamiento: CatalogosSenal['tiposEquipamiento'];
  agregarEquipamiento: () => void;
  eliminarEquipamiento: (index: number) => void;
  actualizarEquipamiento: (index: number, campo: keyof EquipamientoItem, valor: string | number) => void;
}

export const SeccionEquipamiento = ({
  luminica,
  equipamiento,
  tiposEquipamiento,
  agregarEquipamiento,
  eliminarEquipamiento,
  actualizarEquipamiento
}: SeccionEquipamientoProps) => (
  <div className="space-y-6 mt-4">
    {!luminica ? (
      <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          La señalización lumínica está desactivada. Active la opción en Datos Generales para configurar el equipamiento.
        </AlertDescription>
      </Alert>
    ) : (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400">Equipamiento de la Señal</h3>
          <Button
            onClick={agregarEquipamiento}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" /> Agregar Equipamiento
          </Button>
        </div>

        {/* Lista de equipamiento */}
        {equipamiento.map((item, index) => (
          <Card key={index} className="border border-blue-200 dark:border-gray-700 dark:bg-gray-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                  <CommandSelect
                    value={item.id_tipo_equipamiento}
                    pendiente={esVacio(item.id_tipo_equipamiento)}
                    onValueChange={(value) => actualizarEquipamiento(index, 'id_tipo_equipamiento', value)}
                    placeholder="Seleccionar tipo"
                    searchPlaceholder="Buscar tipo..."
                    emptyMessage="No se encontraron tipos"
                    items={tiposEquipamiento.map(t => ({ id: t.id_tipo_equipamiento, nombre: t.nombre }))}
                    label="Tipo de Equipamiento"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-gray-200 font-medium">Nombre</Label>
                  <Input
                    placeholder="Nombre del equipo"
                    value={item.nombre}
                    onChange={(e) => actualizarEquipamiento(index, 'nombre', e.target.value)}
                    className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400", esVacio(item.nombre) && CAMPO_PENDIENTE)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-gray-200 font-medium">Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => actualizarEquipamiento(index, 'cantidad', parseInt(e.target.value))}
                    className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white", esVacio(item.cantidad) && CAMPO_PENDIENTE)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-900 dark:text-gray-200 font-medium">N° Inventario</Label>
                  <Input
                    placeholder="Número de inventario"
                    value={item.num_inventario}
                    onChange={(e) => actualizarEquipamiento(index, 'num_inventario', e.target.value)}
                    className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400", esVacio(item.num_inventario) && CAMPO_PENDIENTE)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminarEquipamiento(index)}
                    disabled={equipamiento.length === 1}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
);
