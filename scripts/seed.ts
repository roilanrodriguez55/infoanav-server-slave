import { readFile } from 'node:fs/promises';
import pg from 'pg';

try {
  process.loadEnvFile();
} catch {}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL no esta definida');
}

const archivos = ['catalogos.sql', 'equipos.sql'];

const cliente = new pg.Client({ connectionString: url });
await cliente.connect();

async function sembrar(archivo: string): Promise<void> {
  let sql: string;
  try {
    sql = await readFile(new URL(`../prisma/seed/${archivo}`, import.meta.url), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const tablas = [...new Set([...sql.matchAll(/(?:INSERT INTO|UPDATE) api\.(\w+)/g)].map((m) => m[1] as string))];

  async function contar(): Promise<Record<string, number>> {
    const conteos: Record<string, number> = {};
    for (const tabla of tablas) {
      const { rows } = await cliente.query<{ n: number }>(`SELECT count(*)::int AS n FROM api.${tabla}`);
      conteos[tabla] = rows[0]?.n ?? 0;
    }
    return conteos;
  }

  try {
    await cliente.query('BEGIN');
    const antes = await contar();
    await cliente.query(sql);
    const despues = await contar();
    await cliente.query('COMMIT');

    const reporte = tablas.map((tabla) => ({
      tabla,
      antes: antes[tabla],
      despues: despues[tabla],
      insertadas: (despues[tabla] ?? 0) - (antes[tabla] ?? 0),
    }));
    console.log(`\n${archivo}`);
    console.table(reporte);
    const total = reporte.reduce((suma, fila) => suma + fila.insertadas, 0);
    console.log(`Total de filas insertadas: ${total}`);
  } catch (error) {
    await cliente.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

try {
  for (const archivo of archivos) {
    await sembrar(archivo);
  }
} finally {
  await cliente.end();
}
