import { Anchor, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FondeoControl } from './tipos';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface SeccionFondeoProps {
  esBoya: boolean;
  fondeo: FondeoControl;
}

export const SeccionFondeo = ({ esBoya, fondeo }: SeccionFondeoProps) => (
  <div className="space-y-6 mt-4">
    {!esBoya ? (
      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          El sistema de fondeo solo está disponible para boyas.
        </AlertDescription>
      </Alert>
    ) : (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 flex items-center gap-2">
          <Anchor className="h-5 w-5" />
          Sistema de Fondeo (se guardará como JSON)
        </h3>

        {/* Número de Serie Flotador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-blue-900 dark:text-gray-200 font-medium">N° Serie Flotador</Label>
            <Input
              value={fondeo.noSerieFlotador}
              onChange={(e) => fondeo.setNoSerieFlotador(e.target.value)}
              type="text"
              placeholder="Número de serie del flotador"
              className={cn("border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(fondeo.noSerieFlotador) && CAMPO_PENDIENTE)}
            />
          </div>
        </div>

        {/* Cadenas */}
        <div className="space-y-2">
          <Label className="text-blue-900 dark:text-gray-200 font-medium">Cadenas</Label>
          {fondeo.cadenas.map((cadena, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Diámetro (mm)"
                className={cn("w-40 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(cadena.diametro) && CAMPO_PENDIENTE)}
                value={cadena.diametro}
                onChange={(e) => fondeo.actualizarCadena(index, 'diametro', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Cantidad"
                className={cn("w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(cadena.cantidad) && CAMPO_PENDIENTE)}
                value={cadena.cantidad}
                onChange={(e) => fondeo.actualizarCadena(index, 'cantidad', parseInt(e.target.value))}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fondeo.eliminarCadena(index)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={fondeo.agregarCadena}
          >
            <Plus className="h-4 w-4 mr-2" /> Agregar cadena
          </Button>
        </div>

        {/* Pesos Muertos */}
        <div className="space-y-2">
          <Label className="text-blue-900 dark:text-gray-200 font-medium">Pesos Muertos</Label>
          {fondeo.pesosMuertos.map((peso, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Peso (kg)"
                className={cn("w-40 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(peso.peso) && CAMPO_PENDIENTE)}
                value={peso.peso}
                onChange={(e) => fondeo.actualizarPesoMuerto(index, 'peso', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Cantidad"
                className={cn("w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(peso.cantidad) && CAMPO_PENDIENTE)}
                value={peso.cantidad}
                onChange={(e) => fondeo.actualizarPesoMuerto(index, 'cantidad', parseInt(e.target.value))}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fondeo.eliminarPesoMuerto(index)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={fondeo.agregarPesoMuerto}
          >
            <Plus className="h-4 w-4 mr-2" /> Agregar peso muerto
          </Button>
        </div>

        {/* Bridas */}
        <div className="space-y-2">
          <Label className="text-blue-900 dark:text-gray-200 font-medium">Bridas</Label>
          {fondeo.bridas.map((brida, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Tipo"
                className={cn("w-40 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(brida.tipo) && CAMPO_PENDIENTE)}
                value={brida.tipo}
                onChange={(e) => fondeo.actualizarBrida(index, 'tipo', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Cantidad"
                className={cn("w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(brida.cantidad) && CAMPO_PENDIENTE)}
                value={brida.cantidad}
                onChange={(e) => fondeo.actualizarBrida(index, 'cantidad', parseInt(e.target.value))}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fondeo.eliminarBrida(index)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={fondeo.agregarBrida}
          >
            <Plus className="h-4 w-4 mr-2" /> Agregar brida
          </Button>
        </div>

        {/* Grectos */}
        <div className="space-y-2">
          <Label className="text-blue-900 dark:text-gray-200 font-medium">Grectos</Label>
          {fondeo.grectos.map((grecto, index) => (
            <div key={index} className="flex gap-2 items-center flex-wrap">
              <Input
                placeholder="Tipo"
                className={cn("w-32 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(grecto.tipo) && CAMPO_PENDIENTE)}
                value={grecto.tipo}
                onChange={(e) => fondeo.actualizarGrecto(index, 'tipo', e.target.value)}
              />
              <Input
                type="number"
                placeholder="Cant"
                className={cn("w-24 border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400", esVacio(grecto.cantidad) && CAMPO_PENDIENTE)}
                value={grecto.cantidad}
                onChange={(e) => fondeo.actualizarGrecto(index, 'cantidad', parseInt(e.target.value))}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`giratorio-${index}`}
                  checked={grecto.giratorio}
                  onCheckedChange={(checked) => fondeo.actualizarGrecto(index, 'giratorio', checked)}
                  className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
                />
                <Label htmlFor={`giratorio-${index}`} className="text-blue-900 dark:text-gray-200">Giratorio</Label>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fondeo.eliminarGrecto(index)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={fondeo.agregarGrecto}
          >
            <Plus className="h-4 w-4 mr-2" /> Agregar grecto
          </Button>
        </div>
      </div>
    )}
  </div>
);
