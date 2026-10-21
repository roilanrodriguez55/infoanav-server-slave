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

export const setupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Solo cuentan los intentos fallidos
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Intenta de nuevo mas tarde' },
});

export const resetPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Solo cuentan los intentos fallidos
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos' },
});
