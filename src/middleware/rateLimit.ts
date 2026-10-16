import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Solo cuentan los intentos fallidos
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos' },
});
