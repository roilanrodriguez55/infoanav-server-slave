// Fecha 'YYYY-MM-DD' (columna date) mostrada como dd/mm/yyyy, sin pasar por Date para no cambiar el dia por zona horaria.
export function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return '-';
  const [anio, mes, dia] = valor.slice(0, 10).split('-');
  if (!anio || !mes || !dia) return valor;
  return `${dia}/${mes}/${anio}`;
}
