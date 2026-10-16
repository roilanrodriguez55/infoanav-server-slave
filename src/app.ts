import express, { type Express } from 'express';

import { montarDocs } from './docs.ts';
import { env } from './config/env.ts';
import { pool } from './db/pool.ts';
import { corsMiddleware } from './middleware/cors.ts';
import { errorHandler, notFoundHandler } from './middleware/errors.ts';
import { applyTrustProxy, securityMiddleware } from './middleware/security.ts';
import { authRouter } from './modules/auth/auth.routes.ts';
import { dataRouter } from './modules/data/proxy.ts';
import { usersRouter } from './modules/users/users.routes.ts';

const TIMEOUT_POSTGREST_MS = 2000;

// Cualquier respuesta HTTP cuenta como arriba, incluso 401
export async function postgrestResponde(): Promise<boolean> {
  try {
    const respuesta = await fetch(env.POSTGREST_URL, { signal: AbortSignal.timeout(TIMEOUT_POSTGREST_MS) });
    await respuesta.body?.cancel();
    return true;
  } catch {
    return false;
  }
}

async function bdResponde(): Promise<boolean> {
  try {
    await pool.query('select 1');
    return true;
  } catch {
    return false;
  }
}

export function createApp(): Express {
  const app = express();

  applyTrustProxy(app);
  app.use(securityMiddleware());
  app.use(corsMiddleware());

  app.get('/api/health', async (_req, res) => {
    const [db, postgrest] = await Promise.all([bdResponde(), postgrestResponde()]);
    const ok = db && postgrest;
    res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'error', db, postgrest });
  });

  // El proxy necesita el cuerpo sin parsear, por eso va antes de express.json
  app.use('/api/data', dataRouter);

  app.use(express.json({ limit: '100kb' }));
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);

  if (env.ENABLE_DOCS) {
    montarDocs(app);
  }

  // El servidor no sirve el cliente: cualquier ruta no declarada responde 404 JSON
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
