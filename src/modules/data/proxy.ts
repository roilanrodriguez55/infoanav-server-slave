import { request as httpRequest } from 'node:http';

import { type Request, type Response, Router } from 'express';

import { env } from '../../config/env.ts';
import { signInternalToken } from '../../lib/tokens.ts';
import { authenticate, getAuth } from '../../middleware/authenticate.ts';
import { evaluarAcceso } from './policy.ts';

const TIMEOUT_MS = 30_000;
const TAMANO_MAX_CUERPO = 5_000_000;

const CABECERAS_PETICION = ['accept', 'content-type', 'content-length', 'prefer', 'range', 'range-unit'] as const;
const CABECERAS_RESPUESTA = ['content-type', 'content-range', 'content-length', 'preference-applied'] as const;

// Montado en /api/data despues de authenticate y antes de express.json():
// el cuerpo viaja como stream sin parsear hasta PostgREST.
export const dataRouter = Router();

dataRouter.use(authenticate);

dataRouter.use((req, res) => {
  const { usuario, rol } = getAuth(res);
  const query = new URL(req.url, 'http://gateway').searchParams;

  const acceso = evaluarAcceso({ method: req.method, path: req.path, query, rol });
  if (!acceso.permitido) {
    res.status(acceso.status).json({ error: acceso.mensaje });
    return;
  }

  if (Number(req.get('content-length') ?? 0) > TAMANO_MAX_CUERPO) {
    res.status(413).json({ error: 'Cuerpo demasiado grande' });
    return;
  }

  reenviar(req, res, usuario);
});

// Solo se reenvian cabeceras de la lista; la identidad va en el JWT interno
function reenviar(req: Request, res: Response, usuario: string): void {
  const cabeceras: Record<string, string | string[]> = { authorization: `Bearer ${signInternalToken(usuario)}` };
  for (const nombre of CABECERAS_PETICION) {
    const valor = req.headers[nombre];
    if (valor !== undefined) cabeceras[nombre] = valor;
  }

  let agotado = false;
  const upstream = httpRequest({
    hostname: env.postgrestHost,
    port: env.postgrestPort,
    method: req.method,
    path: req.url,
    headers: cabeceras,
  });

  upstream.setTimeout(TIMEOUT_MS, () => {
    agotado = true;
    upstream.destroy();
  });

  upstream.on('error', () => {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    if (agotado) {
      res.status(504).json({ error: 'Tiempo de espera agotado' });
      return;
    }
    res.status(502).json({ error: 'Servicio de datos no disponible' });
  });

  upstream.on('response', (respuesta) => {
    res.status(respuesta.statusCode ?? 502);
    for (const nombre of CABECERAS_RESPUESTA) {
      const valor = respuesta.headers[nombre];
      if (valor !== undefined) res.setHeader(nombre, valor);
    }
    const location = respuesta.headers.location;
    if (location !== undefined) {
      res.setHeader('location', location.startsWith('/') ? `/api/data${location}` : location);
    }
    res.setHeader('cache-control', 'no-store');

    respuesta.on('error', () => res.destroy());
    respuesta.pipe(res);
  });

  // Si el cliente aborta, no dejamos la peticion upstream colgada
  res.on('close', () => {
    if (!res.writableFinished) upstream.destroy();
  });

  req.pipe(upstream);
}
