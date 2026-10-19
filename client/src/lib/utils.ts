import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function esVacio(valor: unknown): boolean {
  if (typeof valor === "number") return Number.isNaN(valor);
  if (valor === null || valor === undefined) return true;
  return typeof valor === "string" && valor.trim() === "";
}

export const CAMPO_PENDIENTE =
  "border-orange-400 bg-orange-50 focus-visible:ring-orange-400 dark:border-orange-500 dark:bg-orange-950/30";

// Código LSM seguido del nombre; la señal puede no tener nombre.
export function etiquetaSenal(codigo: string | null | undefined, nombre: string | null | undefined): string {
  const cod = codigo ?? '';
  return nombre ? `${cod} - ${nombre}` : cod;
}
