import type { NextFunction, Request, Response } from 'express';

import { type AccessClaims, verifyAccessToken } from '../lib/tokens.ts';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const coincidencia = /^Bearer (.+)$/.exec(req.get('authorization') ?? '');
  const claims = coincidencia ? verifyAccessToken(coincidencia[1] ?? '') : null;

  if (!claims) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  res.locals.auth = claims;
  next();
}

export function getAuth(res: Response): AccessClaims {
  const auth: AccessClaims | undefined = res.locals.auth;
  if (!auth) {
    throw new Error('getAuth llamado sin authenticate previo');
  }
  return auth;
}
