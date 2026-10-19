import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CloudSun } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PRONOSTICO_VACIO,
  pronosticoACampos,
  pronosticoATexto,
  pronosticoService,
  type PronosticoRegistro,
  type PronosticoTexto,
} from '@/services/api/pronosticoApi';
import { CAMPO_PENDIENTE, cn, esVacio } from '@/lib/utils';

interface TabPronosticoProps {
  idSenal: string;
}

type Clave = keyof PronosticoTexto;

const CAMPOS: { clave: Clave; etiqueta: string }[] = [
  { clave: 'disponibilidad_deseada', etiqueta: 'Disponibilidad deseada' },
  { clave: 'criterios_bateria', etiqueta: 'Criterios de batería' },
  { clave: 'panel', etiqueta: 'Panel' },
  { clave: 'destellador_bombillo', etiqueta: 'Destellador y bombillo' },
  { clave: 'tmef_1', etiqueta: 'TMEF 1' },
  { clave: 'tmef_2', etiqueta: 'TMEF 2' },
  { clave: 'tmef_3', etiqueta: 'TMEF 3' },
  { clave: 'tmef_senal', etiqueta: 'TMEF de la señal' },
  { clave: 'tmpr_pronosticado', etiqueta: 'TMPR pronosticado' },
  { clave: 'tmrf', etiqueta: 'TMRF' },
  { clave: 'tmpr_real', etiqueta: 'TMPR real' },
  { clave: 'disponibilidad_pronosticada', etiqueta: 'Disponibilidad pronosticada' },
  { clave: 'tiempo_informacion', etiqueta: 'Tiempo de información' },
  { clave: 'tiempo_preparacion', etiqueta: 'Tiempo de preparación' },
  { clave: 'tiempo_travesia', etiqueta: 'Tiempo de travesía' },
  { clave: 'tiempo_reposicion', etiqueta: 'Tiempo de reposición' },
];

const CLASE_CAMPO = 'dark:border-gray-600 dark:bg-gray-800 dark:text-white';

export default function TabPronostico({ idSenal }: TabPronosticoProps) {
  const [registro, setRegistro] = useState<PronosticoRegistro | null>(null);
  const [valores, setValores] = useState<PronosticoTexto>(PRONOSTICO_VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    const cargar = async () => {
      try {
        const existente = await pronosticoService.getPorSenal(idSenal);
        if (!vigente) return;
        setRegistro(existente);
        setValores(existente ? pronosticoATexto(existente) : PRONOSTICO_VACIO);
      } catch {
        if (vigente) setError('No se pudo cargar el pronóstico');
      } finally {
        if (vigente) setCargando(false);
      }
    };
    void cargar();
    return () => {
      vigente = false;
    };
  }, [idSenal]);

  const cambiar = (clave: Clave, valor: string) => {
    setValores((previo) => ({ ...previo, [clave]: valor }));
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setGuardando(true);
    const campos = pronosticoACampos(idSenal, valores);
    const respuesta = registro
      ? await pronosticoService.update(registro.id_pronostico, campos)
      : await pronosticoService.create(campos);
    setGuardando(false);
    if (respuesta.success && respuesta.registro) {
      setRegistro(respuesta.registro);
      setValores(pronosticoATexto(respuesta.registro));
      setMensaje(respuesta.message);
    } else {
      setError(respuesta.message);
    }
  };

  if (cargando) {
    return <p className="py-8 text-center text-gray-600 dark:text-gray-300">Cargando pronóstico...</p>;
  }

  return (
    <form onSubmit={(e) => void guardar(e)} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
          <CloudSun className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Pronóstico
        </h3>
        <Button
          type="submit"
          disabled={guardando}
          className="bg-gray-800 text-white shadow-md hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {guardando ? 'Guardando...' : 'Guardar pronóstico'}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {mensaje && !error && (
        <p className="text-sm text-green-700 dark:text-green-300">{mensaje}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAMPOS.map(({ clave, etiqueta }) => (
          <div key={clave} className="space-y-2">
            <Label htmlFor={clave} className="text-sm font-medium">
              {etiqueta}
            </Label>
            <Input
              id={clave}
              value={valores[clave]}
              onChange={(e) => cambiar(clave, e.target.value)}
              className={cn(CLASE_CAMPO, esVacio(valores[clave]) && CAMPO_PENDIENTE)}
            />
          </div>
        ))}
      </div>
    </form>
  );
}
