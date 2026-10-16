import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  status: number;
  code: string | undefined;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'No encontrado' });
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos invalidos',
      detalles: err.issues.map((issue) => ({ campo: issue.path.map(String).join('.'), mensaje: issue.message })),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno' });
};
