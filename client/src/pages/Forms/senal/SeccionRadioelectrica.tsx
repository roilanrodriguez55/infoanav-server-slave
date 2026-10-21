import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommandSelect } from '@/components/ui/CommandSelect';
import { DatePickerField } from '@/components/common/DatePickerField';
import { raconService, type RaconTexto } from '@/services/api/raconApi';
import type { CatalogoItem } from '@/services/api/senalesApi';
import type { CheckboxChangeHandler, FormDataState } from './tipos';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

type Clave = keyof RaconTexto;

interface CampoDef {
  clave: Clave;
  etiqueta: string;
  tipo?: 'text' | 'number';
}

interface GrupoDef {
  titulo: string;
  campos: CampoDef[];
}

const GRUPOS: GrupoDef[] = [
  {
    titulo: 'Radio',
    campos: [
      { clave: 'banda', etiqueta: 'Banda' },
      { clave: 'frecuencia', etiqueta: 'Frecuencia' },
      { clave: 'barrido', etiqueta: 'Barrido' },
      { clave: 'supresion_lobulo_lateral', etiqueta: 'Supresión de lóbulo lateral' },
      { clave: 'pulso', etiqueta: 'Pulso' },
      { clave: 'modo_servicio', etiqueta: 'Modo de servicio' },
      { clave: 'identificador', etiqueta: 'Identificador' },
      { clave: 'largo_identificador', etiqueta: 'Largo del identificador' },
      { clave: 'alcance', etiqueta: 'Alcance', tipo: 'number' },
      { clave: 'sensibilidad', etiqueta: 'Sensibilidad' },
      { clave: 'retardo_pulso', etiqueta: 'Retardo de pulso' },
    ],
  },
  {
    titulo: 'Antena',
    campos: [
      { clave: 'antena_tipo', etiqueta: 'Tipo de antena' },
      { clave: 'antena_ganancia', etiqueta: 'Ganancia' },
      { clave: 'antena_directividad', etiqueta: 'Directividad' },
      { clave: 'antena_polarizacion', etiqueta: 'Polarización' },
    ],
  },
  {
    titulo: 'Físico',
    campos: [
      { clave: 'dimensiones', etiqueta: 'Dimensiones' },
      { clave: 'peso', etiqueta: 'Peso' },
      { clave: 'color', etiqueta: 'Color' },
      { clave: 'energia', etiqueta: 'Energía' },
      { clave: 'consumo', etiqueta: 'Consumo' },
    ],
  },
];

const CLASES_INPUT = 'border-blue-200 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white';

interface SeccionRadioelectricaProps {
  formData: FormDataState;
  onCheckboxChange: CheckboxChangeHandler;
  onRaconChange: (clave: Clave, valor: string) => void;
}

export const SeccionRadioelectrica = ({ formData, onCheckboxChange, onRaconChange }: SeccionRadioelectricaProps) => {
  const [empresas, setEmpresas] = useState<CatalogoItem[]>([]);
  const [estaciones, setEstaciones] = useState<CatalogoItem[]>([]);
  const { racon } = formData;

  useEffect(() => {
    if (!formData.esRadioelectrica) return;
    void raconService
      .getCatalogos()
      .then((catalogos) => {
        setEmpresas(catalogos.empresas);
        setEstaciones(catalogos.estaciones);
      })
      .catch((error: unknown) => console.error('Error cargando empresas y estaciones:', error));
  }, [formData.esRadioelectrica]);

  const campoTexto = ({ clave, etiqueta, tipo = 'text' }: CampoDef) => (
    <div key={clave} className="space-y-2">
      <Label htmlFor={clave} className="text-blue-900 dark:text-gray-200 font-medium">{etiqueta}</Label>
      <Input
        id={clave}
        type={tipo}
        step={tipo === 'number' ? '0.1' : undefined}
        min={tipo === 'number' ? '0' : undefined}
        value={racon[clave]}
        onChange={(e) => onRaconChange(clave, e.target.value)}
        className={cn(CLASES_INPUT, esVacio(racon[clave]) && CAMPO_PENDIENTE)}
      />
    </div>
  );

  const campoFecha = (clave: 'fecha_inicio' | 'fecha_baja', etiqueta: string) => (
    <div key={clave} className="space-y-2">
      <Label htmlFor={clave} className="text-blue-900 dark:text-gray-200 font-medium">{etiqueta}</Label>
      <DatePickerField
        id={clave}
        aria-label={etiqueta}
        value={racon[clave]}
        onChange={(valor) => onRaconChange(clave, valor)}
        className={cn('w-full', esVacio(racon[clave]) && CAMPO_PENDIENTE)}
      />
    </div>
  );

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="esRadioelectrica"
          name="esRadioelectrica"
          checked={formData.esRadioelectrica}
          onCheckedChange={(checked) => onCheckboxChange('esRadioelectrica', checked as boolean)}
          className="border-blue-400 text-blue-600 dark:border-gray-500 dark:bg-gray-700"
        />
        <Label htmlFor="esRadioelectrica" className="cursor-pointer text-blue-900 dark:text-gray-200">
          Radioeléctrica
        </Label>
      </div>

      {formData.esRadioelectrica && (
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">Identificación</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campoTexto({ clave: 'numero_orden', etiqueta: 'Número de orden' })}
              {campoTexto({ clave: 'nombre', etiqueta: 'Nombre' })}
              <CommandSelect
                label="Empresa"
                placeholder="Seleccione una empresa"
                searchPlaceholder="Buscar empresa..."
                emptyMessage="No se encontraron empresas"
                items={empresas}
                value={racon.id_empresa}
                onValueChange={(valor) => onRaconChange('id_empresa', valor)}
                pendiente={esVacio(racon.id_empresa)}
              />
              <CommandSelect
                label="Estación"
                placeholder="Seleccione una estación"
                searchPlaceholder="Buscar estación..."
                emptyMessage="No se encontraron estaciones"
                items={estaciones}
                value={racon.id_estacion}
                onValueChange={(valor) => onRaconChange('id_estacion', valor)}
                pendiente={esVacio(racon.id_estacion)}
              />
              {campoTexto({ clave: 'tipo', etiqueta: 'Tipo' })}
            </div>
          </section>

          {GRUPOS.map((grupo) => (
            <section key={grupo.titulo} className="space-y-4">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">{grupo.titulo}</h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {grupo.campos.map(campoTexto)}
              </div>
            </section>
          ))}

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400">Vigencia</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campoFecha('fecha_inicio', 'Fecha de inicio')}
              {campoFecha('fecha_baja', 'Fecha de baja')}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
