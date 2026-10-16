import type { Express } from 'express';
import helmet from 'helmet';

import { env } from '../config/env.ts';

export function securityMiddleware() {
  // Swagger UI usa scripts inline, asi que la CSP por defecto lo bloquearia
  return helmet(env.ENABLE_DOCS ? { contentSecurityPolicy: false } : {});
}

export function applyTrustProxy(app: Express): void {
  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) {
    app.set('trust proxy', env.TRUST_PROXY);
  }
}
