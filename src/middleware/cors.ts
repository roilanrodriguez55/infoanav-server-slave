import cors from 'cors';
import type { RequestHandler } from 'express';

import { env } from '../config/env.ts';

export function corsMiddleware(): RequestHandler {
  if (env.corsOrigins.length === 0) {
    return (_req, _res, next) => next();
  }

  const permitidos = new Set(env.corsOrigins);

  return cors({
    // Sin origin (curl o mismo origen) se permite; un origen ajeno recibe respuesta sin cabeceras CORS
    origin: (origin, callback) => {
      callback(null, !origin || permitidos.has(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Prefer', 'Range', 'Range-Unit', 'Accept-Profile', 'Content-Profile'],
    exposedHeaders: ['Content-Range'],
    maxAge: 600,
  });
}
