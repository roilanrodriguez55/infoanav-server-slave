import pg from 'pg';

import { env } from '../config/env.ts';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

pool.on('error', (error) => {
  console.error('Error en el pool de PostgreSQL:', error);
});

export async function closePool(): Promise<void> {
  await pool.end();
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
