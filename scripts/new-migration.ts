import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const nameArg = process.argv[2];

// Solo para SQL puro: Prisma no modela funciones, triggers, grants, reglas ni vistas.
if (!nameArg || !/^[a-z][a-z0-9_]*$/.test(nameArg)) {
  console.error(
    [
      'Uso: npm run migration:new -- <nombre_en_snake_case>',
      'Solo para SQL puro: funciones, triggers, grants, reglas o vistas.',
      'Para tablas, columnas, relaciones, enums o indices edita prisma/schema.prisma y ejecuta:',
      '  npm run migrate:create -- --name <nombre>',
    ].join('\n'),
  );
  process.exit(1);
}

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const folderName = `${formatUtcTimestamp(new Date())}_${nameArg}`;
const folderPath = join(projectRoot, 'prisma', 'migrations', folderName);

if (existsSync(folderPath)) {
  console.error(`La migracion ya existe: ${folderPath}`);
  process.exit(1);
}

mkdirSync(folderPath, { recursive: true });
writeFileSync(
  join(folderPath, 'migration.sql'),
  [
    `-- Migracion: ${nameArg}`,
    '-- SQL puro para objetos que Prisma no modela (funciones, triggers, grants, reglas, vistas).',
    '-- Para tablas, columnas, relaciones, enums o indices usa schema.prisma y npm run migrate:create.',
    '-- Escribe SQL idempotente cuando sea posible (IF NOT EXISTS / IF EXISTS).',
    '',
  ].join('\n'),
);

console.log(join('prisma', 'migrations', folderName, 'migration.sql'));

function formatUtcTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join('');
}
