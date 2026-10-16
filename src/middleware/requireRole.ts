import type { RequestHandler } from 'express';

import type { Rol } from '../lib/tokens.ts';
import { getAuth } from './authenticate.ts';

export function requireRole(...roles: Rol[]): RequestHandler {
  return (_req, res, next) => {
    const { rol } = getAuth(res);
    if (!roles.includes(rol)) {
      res.status(403).json({ error: 'Sin permisos' });
      return;
    }
    next();
  };
}
