import { request as httpRequest } from 'node:http';

import { type Request, type Response, Router } from 'express';

import { env } from '../../config/env.ts';
import { type Rol, signInternalToken } from '../../lib/tokens.ts';
import { authenticate, getAuth } from '../../middleware/authenticate.ts';
import { evaluarAcceso, evaluarCuerpo, requiereCuerpo } from './policy.ts';

const TIMEOUT_MS = 30_000;
const TAMANO_MAX_CUERPO = 5_000_000;

const CABECERAS_PETICION = ['accept', 'content-type', 'content-length', 'prefer', 'range', 'range-unit'] as const;
const CABECERAS_RESPUESTA = ['content-type', 'content-range', 'content-length', 'preference-applied'] as const;

type LecturaCuerpo =
  | { tipo: 'ok'; bytes: Buffer }
  | { tipo: 'demasiado_grande' }
  | { tipo: 'agotado' }
  | { tipo: 'error' };

// Montado en /api/data despues de authenticate y antes de express.json():
// el cuerpo viaja como stream sin parsear hasta PostgREST, salvo en las tablas
// con regla por cuerpo (ver requiereCuerpo), que se leen y evaluan antes.
export const dataRouter = Router();

dataRouter.use(authenticate);

dataRouter.use((req, res) => {
  const { usuario, rol } = getAuth(res);
  const query = new URL(req.url, 'http://gateway').searchParams;

  const acceso = evaluarAcceso({ method: req.method, path: req.path, query, rol, prefer: req.get('prefer') });
  if (!acceso.permitido) {
    res.status(acceso.status).json({ error: acceso.mensaje });
    return;
  }

  if (Number(req.get('content-length') ?? 0) > TAMANO_MAX_CUERPO) {
    res.status(413).json({ error: 'Cuerpo demasiado grande' });
    return;
  }

  if (rol === 'administrador' || !requiereCuerpo(req.method, req.path)) {
    reenviar(req, res, usuario);
    return;
  }

  void validarYReenviar(req, res, usuario, rol);
});

async function validarYReenviar(req: Request, res: Response, usuario: string, rol: Rol): Promise<void> {
  const lectura = await leerCuerpo(req);

  if (lectura.tipo === 'demasiado_grande') {
    res.setHeader('connection', 'close');
    res.status(413).json({ error: 'Cuerpo demasiado grande' });
    return;
  }
  if (lectura.tipo === 'agotado') {
    res.setHeader('connection', 'close');
    res.status(408).json({ error: 'Tiempo de espera agotado' });
    return;
  }
  if (lectura.tipo === 'error') {
    res.destroy();
    return;
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(lectura.bytes.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Cuerpo invalido' });
    return;
  }

  const acceso = evaluarCuerpo({ method: req.method, path: req.path, cuerpo, rol });
  if (!acceso.permitido) {
    res.status(acceso.status).json({ error: acceso.mensaje });
    return;
  }

  reenviar(req, res, usuario, lectura.bytes);
}

// Lee el cuerpo completo respetando el limite y el timeout. Nunca se lee dos veces.
function leerCuerpo(req: Request): Promise<LecturaCuerpo> {
  return new Promise((resolver) => {
    const fragmentos: Buffer[] = [];
    let total = 0;
    let terminado = false;

    const terminar = (lectura: LecturaCuerpo): void => {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      req.off('data', alRecibir);
      if (lectura.tipo !== 'ok') req.pause();
      resolver(lectura);
    };

    const alRecibir = (fragmento: Buffer): void => {
      total += fragmento.length;
      if (total > TAMANO_MAX_CUERPO) {
        terminar({ tipo: 'demasiado_grande' });
        return;
      }
      fragmentos.push(fragmento);
    };

    const temporizador = setTimeout(() => terminar({ tipo: 'agotado' }), TIMEOUT_MS);

    req.on('data', alRecibir);
    req.once('end', () => terminar({ tipo: 'ok', bytes: Buffer.concat(fragmentos) }));
    req.once('error', () => terminar({ tipo: 'error' }));
    req.once('close', () => terminar({ tipo: 'error' }));
  });
}

// Solo se reenvian cabeceras de la lista; la identidad va en el JWT interno.
// Con cuerpo ya leido se envian exactamente esos bytes; si no, el stream de la peticion.
function reenviar(req: Request, res: Response, usuario: string, cuerpo?: Buffer): void {
  const cabeceras: Record<string, string | string[]> = { authorization: `Bearer ${signInternalToken(usuario)}` };
  for (const nombre of CABECERAS_PETICION) {
    const valor = req.headers[nombre];
    if (valor !== undefined) cabeceras[nombre] = valor;
  }
  if (cuerpo !== undefined) cabeceras['content-length'] = String(cuerpo.length);

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

  if (cuerpo === undefined) {
    req.pipe(upstream);
  } else {
    upstream.end(cuerpo);
  }
}
