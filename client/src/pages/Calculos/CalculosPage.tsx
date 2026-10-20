import { useState, type FormEvent } from 'react';
import { Calculator } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  calcularAlcanceDiurno,
  calcularAlcanceNocturno,
  calcularIntensidadDiurna,
  calcularIntensidadNocturna,
  luminanceValue,
  nightThreshold,
  type AlcanceResultado,
  type IntensidadResultado,
} from '@/lib/alcanceLuminico';

type Magnitud = 'alcance' | 'intensidad';
type Condicion = 'nocturno' | 'diurno';

type Resultado =
  | { tipo: 'alcance'; datos: AlcanceResultado }
  | { tipo: 'intensidad'; datos: IntensidadResultado };

interface Valores {
  intensidadOptica: string;
  alcanceOperacional: string;
  factorAcristalamiento: string;
  factorColor: string;
  factorServicio: string;
  nivelFondo: string;
  codigoLuminancia: string;
  visibilidad: string;
}

const VALORES_INICIALES: Valores = {
  intensidadOptica: '',
  alcanceOperacional: '',
  factorAcristalamiento: '',
  factorColor: '',
  factorServicio: '',
  nivelFondo: '1',
  codigoLuminancia: '1',
  visibilidad: '',
};

const NIVELES_FONDO = [1, 2, 3];
const CODIGOS_LUMINANCIA = [1, 2, 3, 4, 5, 6, 7];

const NUMERO = new Intl.NumberFormat('es-ES', { maximumSignificantDigits: 6 });

function campos(magnitud: Magnitud, condicion: Condicion): (keyof Valores)[] {
  const principal: keyof Valores = magnitud === 'alcance' ? 'intensidadOptica' : 'alcanceOperacional';
  const ambiente: keyof Valores = condicion === 'nocturno' ? 'nivelFondo' : 'codigoLuminancia';
  return [principal, 'factorAcristalamiento', 'factorColor', 'factorServicio', ambiente, 'visibilidad'];
}

function leerNumero(texto: string): number | null {
  const n = Number(texto);
  return texto.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null;
}

function calcular(
  magnitud: Magnitud,
  condicion: Condicion,
  v: Valores
): { resultado: Resultado; entradas: { etiqueta: string; valor: string }[] } | { errores: Partial<Record<keyof Valores, string>> } {
  const errores: Partial<Record<keyof Valores, string>> = {};
  const num: Partial<Record<keyof Valores, number>> = {};

  for (const campo of campos(magnitud, condicion)) {
    if (campo === 'nivelFondo' || campo === 'codigoLuminancia') continue;
    const n = leerNumero(v[campo]);
    if (n === null) errores[campo] = 'Ingresa un número mayor que 0.';
    else num[campo] = n;
  }

  if (Object.keys(errores).length > 0) return { errores };

  const nivel = Number(v.nivelFondo);
  const codigo = Number(v.codigoLuminancia);
  const ambienteEtiqueta =
    condicion === 'nocturno' ? `Nivel ${nivel} (${nightThreshold(nivel)} µlx)` : `${luminanceValue(codigo)} cd/m²`;

  const base = {
    factorAcristalamiento: num.factorAcristalamiento!,
    factorColor: num.factorColor!,
    factorServicio: num.factorServicio!,
    visibilidad: num.visibilidad!,
  };

  const entradas: { etiqueta: string; valor: string }[] = [];

  if (magnitud === 'alcance') {
    const intensidadOptica = num.intensidadOptica!;
    const datos =
      condicion === 'nocturno'
        ? calcularAlcanceNocturno({ ...base, intensidadOptica, nivelFondo: nivel })
        : calcularAlcanceDiurno({ ...base, intensidadOptica, codigoLuminancia: codigo });
    entradas.push(
      { etiqueta: 'Intensidad óptica', valor: `${NUMERO.format(intensidadOptica)} cd` },
      { etiqueta: 'Factor de acristalamiento', valor: NUMERO.format(base.factorAcristalamiento) },
      { etiqueta: 'Factor de color', valor: NUMERO.format(base.factorColor) },
      { etiqueta: 'Factor de servicio', valor: NUMERO.format(base.factorServicio) },
      {
        etiqueta: condicion === 'nocturno' ? 'Iluminación de fondo' : 'Luminancia del cielo',
        valor: ambienteEtiqueta,
      },
      { etiqueta: 'Visibilidad', valor: `${NUMERO.format(base.visibilidad)} millas náuticas` }
    );
    return { resultado: { tipo: 'alcance', datos }, entradas };
  }

  const alcanceOperacional = num.alcanceOperacional!;
  const datos =
    condicion === 'nocturno'
      ? calcularIntensidadNocturna({ ...base, alcanceOperacional, nivelFondo: nivel })
      : calcularIntensidadDiurna({ ...base, alcanceOperacional, codigoLuminancia: codigo });
  entradas.push(
    { etiqueta: 'Alcance operacional', valor: `${NUMERO.format(alcanceOperacional)} millas náuticas` },
    { etiqueta: 'Factor de acristalamiento', valor: NUMERO.format(base.factorAcristalamiento) },
    { etiqueta: 'Factor de color', valor: NUMERO.format(base.factorColor) },
    { etiqueta: 'Factor de servicio', valor: NUMERO.format(base.factorServicio) },
    {
      etiqueta: condicion === 'nocturno' ? 'Iluminación de fondo' : 'Luminancia del cielo',
      valor: ambienteEtiqueta,
    },
    { etiqueta: 'Visibilidad', valor: `${NUMERO.format(base.visibilidad)} millas náuticas` }
  );
  return { resultado: { tipo: 'intensidad', datos }, entradas };
}

function Campo({
  id,
  etiqueta,
  valor,
  onChange,
  error,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-700 dark:text-gray-200">
        {etiqueta}
      </Label>
      <Input
        id={id}
        type="number"
        step="any"
        inputMode="decimal"
        min="0"
        value={valor}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectorAmbiente({
  id,
  etiqueta,
  valor,
  onChange,
  opciones,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
  opciones: { valor: string; texto: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-700 dark:text-gray-200">
        {etiqueta}
      </Label>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full border-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.texto}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Selector({
  etiqueta,
  opciones,
  valor,
  onChange,
}: {
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div role="group" aria-label={etiqueta} className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{etiqueta}</p>
      <div className="flex flex-wrap gap-2">
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <Button
              key={o.valor}
              type="button"
              size="sm"
              variant={activo ? 'default' : 'outline'}
              aria-pressed={activo}
              className="shrink-0"
              onClick={() => onChange(o.valor)}
            >
              {o.texto}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

const MAGNITUDES: { valor: Magnitud; texto: string }[] = [
  { valor: 'alcance', texto: 'Alcance' },
  { valor: 'intensidad', texto: 'Intensidad' },
];

const CONDICIONES: { valor: Condicion; texto: string }[] = [
  { valor: 'nocturno', texto: 'Nocturno' },
  { valor: 'diurno', texto: 'Diurno' },
];

const OPCIONES_FONDO = NIVELES_FONDO.map((n) => ({
  valor: String(n),
  texto: `Nivel ${n} (${nightThreshold(n)} µlx)`,
}));

const OPCIONES_LUMINANCIA = CODIGOS_LUMINANCIA.map((c) => ({
  valor: String(c),
  texto: `${NUMERO.format(luminanceValue(c))} cd/m²`,
}));

export default function CalculosPage() {
  const [magnitud, setMagnitud] = useState<Magnitud>('alcance');
  const [condicion, setCondicion] = useState<Condicion>('nocturno');
  const [valores, setValores] = useState<Valores>(VALORES_INICIALES);
  const [errores, setErrores] = useState<Partial<Record<keyof Valores, string>>>({});
  const [resultado, setResultado] = useState<{ resultado: Resultado; entradas: { etiqueta: string; valor: string }[] } | null>(null);

  const cambiarValor = (campo: keyof Valores, valor: string) => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    setResultado(null);
    setErrores({});
  };

  const cambiarMagnitud = (nueva: Magnitud) => {
    setMagnitud(nueva);
    setResultado(null);
    setErrores({});
  };

  const cambiarCondicion = (nueva: Condicion) => {
    setCondicion(nueva);
    setResultado(null);
    setErrores({});
  };

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const salida = calcular(magnitud, condicion, valores);
    if ('errores' in salida) {
      setErrores(salida.errores);
      setResultado(null);
      return;
    }
    setErrores({});
    setResultado(salida);
  };

  const campoNumerico = (campo: keyof Valores, etiqueta: string) => (
    <Campo
      id={campo}
      etiqueta={etiqueta}
      valor={valores[campo]}
      error={errores[campo]}
      onChange={(v) => cambiarValor(campo, v)}
    />
  );

  return (
    <>
      <PageMeta title="Cálculos" description="Cálculos de alcance e intensidad luminosa de las ayudas visuales" />
      <div className="w-full min-w-0 space-y-6">
        <PageHeader
          icon={<Calculator />}
          title="Cálculos"
          subtitle="Calcula el alcance o la intensidad luminosa de una ayuda visual según la ley de Allard."
        />

        <Card className="shadow-xl border-blue-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 dark:text-white">Calculadora</CardTitle>
            <CardDescription>Elige la magnitud a calcular y la condición de iluminación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Selector
                etiqueta="Magnitud"
                opciones={MAGNITUDES}
                valor={magnitud}
                onChange={(v) => cambiarMagnitud(v as Magnitud)}
              />
              <Selector
                etiqueta="Condición"
                opciones={CONDICIONES}
                valor={condicion}
                onChange={(v) => cambiarCondicion(v as Condicion)}
              />
            </div>

            <form onSubmit={enviar} noValidate className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {magnitud === 'alcance'
                  ? campoNumerico('intensidadOptica', 'Intensidad óptica (cd)')
                  : campoNumerico('alcanceOperacional', 'Alcance operacional (millas náuticas)')}
                {campoNumerico('factorAcristalamiento', 'Factor de acristalamiento')}
                {campoNumerico('factorColor', 'Factor de color')}
                {campoNumerico('factorServicio', 'Factor de servicio')}
                {condicion === 'nocturno' ? (
                  <SelectorAmbiente
                    id="nivelFondo"
                    etiqueta="Iluminación de fondo"
                    valor={valores.nivelFondo}
                    onChange={(v) => cambiarValor('nivelFondo', v)}
                    opciones={OPCIONES_FONDO}
                  />
                ) : (
                  <SelectorAmbiente
                    id="codigoLuminancia"
                    etiqueta="Luminancia del cielo"
                    valor={valores.codigoLuminancia}
                    onChange={(v) => cambiarValor('codigoLuminancia', v)}
                    opciones={OPCIONES_LUMINANCIA}
                  />
                )}
                {campoNumerico('visibilidad', 'Visibilidad (millas náuticas)')}
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="brand">Calcular</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {resultado && (
          <Card className="shadow-xl border-blue-200 dark:border-gray-700 dark:bg-gray-800" aria-live="polite">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 dark:text-white">Resultado</CardTitle>
              <CardDescription>
                {magnitud === 'alcance' ? 'Alcance' : 'Intensidad'} {condicion === 'nocturno' ? 'nocturno' : 'diurno'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {resultado.resultado.tipo === 'alcance' ? (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Alcance operacional</dt>
                    <dd className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {NUMERO.format(resultado.resultado.datos.alcanceOperacional)} millas náuticas
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Alcance nominal</dt>
                    <dd className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {NUMERO.format(resultado.resultado.datos.alcanceNominal)} millas náuticas
                    </dd>
                  </div>
                </dl>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Intensidad óptica</dt>
                    <dd className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {NUMERO.format(resultado.resultado.datos.intensidadOptica)} cd
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Alcance nominal</dt>
                    <dd className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {NUMERO.format(resultado.resultado.datos.alcanceNominal)} millas náuticas
                    </dd>
                  </div>
                </dl>
              )}

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Entradas usadas</h3>
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {resultado.entradas.map((entrada) => (
                    <div key={entrada.etiqueta} className="flex justify-between gap-4 border-b border-blue-100 pb-1 dark:border-gray-700">
                      <dt className="text-gray-500 dark:text-gray-400">{entrada.etiqueta}</dt>
                      <dd className="text-gray-800 dark:text-white">{entrada.valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
