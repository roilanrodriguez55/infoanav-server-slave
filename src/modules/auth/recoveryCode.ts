import { randomInt } from 'node:crypto';

import bcrypt from 'bcrypt';

// Mismo coste que las contrasenas
export const COSTE_HASH = 10;

// Sin 0, O, 1, I y L para que no se confundan al copiarlo
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LONGITUD = 20;
const TAMANO_GRUPO = 5;

export function normalizarCodigo(codigo: string): string {
  return codigo.toUpperCase().replace(/[-\s]/g, '');
}

// Devuelve el codigo para mostrar una vez y el hash para guardar. El hash se calcula sobre la forma normalizada
export async function crearCodigoRecuperacion(): Promise<{ codigo: string; hash: string }> {
  let normalizado = '';
  for (let i = 0; i < LONGITUD; i++) {
    normalizado += ALFABETO[randomInt(ALFABETO.length)];
  }

  const grupos: string[] = [];
  for (let i = 0; i < LONGITUD; i += TAMANO_GRUPO) {
    grupos.push(normalizado.slice(i, i + TAMANO_GRUPO));
  }

  return { codigo: grupos.join('-'), hash: await bcrypt.hash(normalizado, COSTE_HASH) };
}

export async function codigoCoincide(codigo: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(normalizarCodigo(codigo), hash);
  } catch {
    return false;
  }
}
