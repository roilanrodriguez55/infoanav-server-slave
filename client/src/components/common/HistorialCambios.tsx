import { useEffect, useState } from 'react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { historialService, type CambioCampo, type RegistroHistorial } from '@/services/api/historialApi';

const CAMPOS_IGNORADOS = new Set(['created_at', 'created_by', 'updated_at', 'updated_by']);
const FORMATO_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const ETIQUETA_OPERACION: Record<RegistroHistorial['operacion'], string> = {
  INSERT: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Baja',
};

const CLASE_OPERACION: Record<RegistroHistorial['operacion'], string> = {
  INSERT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export interface HistorialCambiosProps {
  tabla: string;
  idRegistro: string;
  etiquetas?: Record<string, string>;
  formatearValor?: (campo: string, valor: unknown) => string;
}

const formatearFechaHora = (fecha: string): string => {
  const date = new Date(fecha);
  return isValid(date) ? format(date, "d 'de' MMMM yyyy, HH:mm", { locale: es }) : fecha;
};

const valorPorDefecto = (valor: unknown): string => {
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'string') return FORMATO_ISO.test(valor) ? formatearFechaHora(valor) : valor;
  if (typeof valor === 'number' || typeof valor === 'bigint') return String(valor);
  return JSON.stringify(valor);
};

const textoValor = (
  campo: string,
  valor: unknown,
  formatearValor?: (campo: string, valor: unknown) => string
): string => {
  if (valor === null || valor === undefined) return '—';
  return formatearValor ? formatearValor(campo, valor) : valorPorDefecto(valor);
};

const lineasCambio = (
  registro: RegistroHistorial,
  etiquetas?: Record<string, string>,
  formatearValor?: (campo: string, valor: unknown) => string
): string[] =>
  Object.entries(registro.cambios ?? {})
    .filter(([campo]) => !CAMPOS_IGNORADOS.has(campo))
    .map(([campo, cambio]: [string, CambioCampo]) => {
      const etiqueta = etiquetas?.[campo] ?? campo;
      if (registro.operacion === 'INSERT') {
        return `${etiqueta}: ${textoValor(campo, cambio.despues, formatearValor)}`;
      }
      return `${etiqueta}: ${textoValor(campo, cambio.antes, formatearValor)} → ${textoValor(campo, cambio.despues, formatearValor)}`;
    });

export default function HistorialCambios({ tabla, idRegistro, etiquetas, formatearValor }: HistorialCambiosProps) {
  const [registros, setRegistros] = useState<RegistroHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      setCargando(true);
      setError(null);
      try {
        const datos = await historialService.getByRegistro(tabla, idRegistro);
        if (!cancelado) setRegistros(datos);
      } catch (err: unknown) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar el historial');
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    void cargar();
    return () => {
      cancelado = true;
    };
  }, [tabla, idRegistro, intento]);

  if (cargando) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando historial...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
        <Button variant="outline" size="sm" onClick={() => setIntento((n) => n + 1)}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (registros.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin cambios registrados</p>;
  }

  return (
    <ul className="space-y-3">
      {registros.map((registro) => {
        const lineas = lineasCambio(registro, etiquetas, formatearValor);
        return (
          <li key={registro.id_historial} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge className={CLASE_OPERACION[registro.operacion]}>{ETIQUETA_OPERACION[registro.operacion]}</Badge>
              <span className="text-foreground">{formatearFechaHora(registro.fecha)}</span>
              <span className="text-muted-foreground">por {registro.usuario ?? '—'}</span>
            </div>
            {lineas.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                {lineas.map((linea, indice) => (
                  <li key={indice}>{linea}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
