const MINUTO_MS = 60_000;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

// Diferencia fin - inicio en milisegundos. Null si falta alguna fecha o no es valida.
export function diferenciaMs(
  inicio: string | null | undefined,
  fin: string | null | undefined
): number | null {
  if (!inicio || !fin) return null;
  const diferencia = new Date(fin).getTime() - new Date(inicio).getTime();
  return Number.isNaN(diferencia) ? null : diferencia;
}

// Cadena de intervalo de Postgres, p. ej. '3 days 04:00:00' o '-1 days -02:00:00'.
export function aIntervaloPostgres(ms: number): string {
  const totalSeg = Math.round(Math.abs(ms) / 1000);
  const signo = ms < 0 && totalSeg > 0 ? '-' : '';
  const dias = Math.floor(totalSeg / 86400);
  const resto = totalSeg % 86400;
  const horas = Math.floor(resto / 3600);
  const minutos = Math.floor((resto % 3600) / 60);
  const segundos = resto % 60;
  const hora = `${signo}${dosDigitos(horas)}:${dosDigitos(minutos)}:${dosDigitos(segundos)}`;
  if (dias === 0) return hora;
  return `${signo}${dias} days ${hora}`;
}

// Texto legible para mostrar, p. ej. "3 días 4 h 0 min".
export function formatearDuracion(ms: number | null): string {
  if (ms === null) return '';
  const totalMin = Math.round(Math.abs(ms) / MINUTO_MS);
  const dias = Math.floor(totalMin / (DIA_MS / MINUTO_MS));
  const horas = Math.floor((totalMin % (DIA_MS / MINUTO_MS)) / 60);
  const minutos = totalMin % 60;

  const partes: string[] = [];
  if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
  if (horas > 0) partes.push(`${horas} h`);
  if (minutos > 0 || partes.length === 0) partes.push(`${minutos} min`);

  return `${ms < 0 && totalMin > 0 ? '-' : ''}${partes.join(' ')}`;
}

// Valor para input datetime-local (hora local) a partir de una fecha ISO o Date.
export function aValorDatetimeLocal(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  const desfase = fecha.getTimezoneOffset() * MINUTO_MS;
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16);
}
