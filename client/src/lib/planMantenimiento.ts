import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatearDuracion } from './intervalos';

export const fechaHoraLegible = (valor: string | null | undefined): string => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  return isValid(fecha) ? format(fecha, 'dd/MM/yyyy HH:mm', { locale: es }) : '—';
};

export type EstadoPlan = 'pendiente' | 'vencido' | 'cumplido';

export const ETIQUETA_ESTADO_PLAN: Record<EstadoPlan, string> = {
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  cumplido: 'Cumplido',
};

export const CLASE_ESTADO_PLAN: Record<EstadoPlan, string> = {
  pendiente: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  vencido: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  cumplido: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

// Fecha y hora en hora local sin zona: 'YYYY-MM-DDTHH:mm:ss'. Las columnas son timestamp sin zona.
export function aTextoLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}T${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}:${dosDigitos(fecha.getSeconds())}`;
}

// Valor de un input datetime-local ('YYYY-MM-DDTHH:mm') convertido a timestamp sin zona.
export function aTimestampLocal(valor: string | null | undefined): string | null {
  return valor ? `${valor}:00` : null;
}

export interface SenalOpcion {
  id_senal: string;
  codigo_lsm: string;
  nombre: string;
}

export interface TipoOpcion {
  id_tipo_mant: string;
  nombre: string;
}

export function inicioDelDia(ahora: Date = new Date()): Date {
  return new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
}

export function inicioDelMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

// Lee tiempo_empleado como intervalo de Postgres ('2 days 03:30:00') o como horas antiguas (numero).
export function textoTiempoEmpleado(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (typeof valor === 'number') return `${valor} h`;
  const coincidencia = /^(?:(-?\d+) days?\s+)?(-?)(\d+):(\d{2}):(\d{2})/.exec(valor.trim());
  if (!coincidencia) return valor;
  const [, dias = '0', signo = '', horas, minutos, segundos] = coincidencia;
  const segundosTotales = Number(horas) * 3600 + Number(minutos) * 60 + Number(segundos);
  const ms = (Number(dias) * 86_400 + (signo === '-' ? -segundosTotales : segundosTotales)) * 1000;
  return formatearDuracion(ms);
}

// Cumplido si tiene fecha_cumplida; vencido si no y fecha_plan es anterior a hoy; pendiente en otro caso.
export function estadoPlan(
  plan: { fecha_plan: string | null; fecha_cumplida: string | null },
  ahora: Date = new Date()
): EstadoPlan {
  if (plan.fecha_cumplida) return 'cumplido';
  if (plan.fecha_plan && new Date(plan.fecha_plan) < inicioDelDia(ahora)) return 'vencido';
  return 'pendiente';
}
