import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.ts';
import { signInternalToken } from './lib/tokens.ts';

type Documento = Record<string, unknown>;

const RUTA_API = '/api/data';
const SEGURIDAD = 'bearerAuth';
const INSTRUCCION = 'Escribe "Bearer <accessToken>" con el accessToken que devuelve POST /api/auth/login';
const TTL_CACHE_MS = 60_000;

let cache: { documento: Documento; expira: number } | null = null;

function esDocumento(valor: unknown): valor is Documento {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

// Ajusta la especificacion de PostgREST para que Swagger UI llame al gateway (/api/data) y pida el token
function ajustarDocumento(original: Documento): Documento {
  const esquema = { type: 'apiKey', name: 'Authorization', in: 'header', description: INSTRUCCION };
  const requisitos = [{ [SEGURIDAD]: [] }];

  if ('swagger' in original) {
    const { host: _host, ...resto } = original;
    return { ...resto, basePath: RUTA_API, securityDefinitions: { [SEGURIDAD]: esquema }, security: requisitos };
  }

  const components = esDocumento(original.components) ? original.components : {};
  return {
    ...original,
    servers: [{ url: RUTA_API }],
    components: { ...components, securitySchemes: { [SEGURIDAD]: esquema } },
    security: requisitos,
  };
}

async function obtenerDocumento(): Promise<Documento> {
  if (cache && cache.expira > Date.now()) return cache.documento;

  const respuesta = await fetch(`${env.POSTGREST_URL}/`, {
    headers: {
      Authorization: `Bearer ${signInternalToken('docs')}`,
      Accept: 'application/openapi+json, application/json',
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!respuesta.ok) {
    throw new Error(`PostgREST respondio ${respuesta.status} al pedir la especificacion`);
  }

  const original: unknown = await respuesta.json();
  if (!esDocumento(original)) {
    throw new Error('La especificacion de PostgREST no es un objeto JSON');
  }

  const documento = ajustarDocumento(original);
  cache = { documento, expira: Date.now() + TTL_CACHE_MS };
  return documento;
}

// SOLO para desarrollo: no activar ENABLE_DOCS en produccion
export function montarDocs(app: Express): void {
  // Va antes de Swagger UI: su handler responde a todo lo que cuelga de /api/docs
  app.get('/api/docs/openapi.json', async (_req, res) => {
    try {
      res.json(await obtenerDocumento());
    } catch (error) {
      console.error('Error al obtener la especificacion de PostgREST:', error);
      res.status(502).json({ error: 'No se pudo obtener la especificacion de PostgREST' });
    }
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(undefined, { swaggerUrl: '/api/docs/openapi.json' }));
}
