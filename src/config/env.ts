try {
  process.loadEnvFile();
} catch {
  // sin .env: se usan solo las variables del proceso
}

import { z } from 'zod';

// Cadena vacia equivale a variable no definida
const vacio = (valor: unknown): unknown => (valor === '' ? undefined : valor);

const texto = z.preprocess(vacio, z.string());
const textoOpcional = z.preprocess(vacio, z.string().optional());
const secreto = z.preprocess(vacio, z.string().min(32, { error: 'debe tener al menos 32 caracteres' }));
const booleano = (porDefecto: boolean) =>
  z
    .preprocess(vacio, z.enum(['true', 'false'], { error: 'debe ser true o false' }).default(porDefecto ? 'true' : 'false'))
    .transform((valor) => valor === 'true');

const esquema = z
  .object({
    DATABASE_URL: texto,
    PORT: z.preprocess(vacio, z.coerce.number().int().min(1).max(65535).default(8080)),
    NODE_ENV: z.preprocess(vacio, z.enum(['development', 'production', 'test']).default('development')),
    JWT_ACCESS_SECRET: secreto,
    ACCESS_TOKEN_TTL: z.preprocess(vacio, z.string().default('15m')),
    REFRESH_TOKEN_TTL_DAYS: z.preprocess(vacio, z.coerce.number().int().positive().default(7)),
    COOKIE_SECURE: z
      .preprocess(vacio, z.enum(['true', 'false'], { error: 'debe ser true o false' }).optional())
      .transform((valor) => (valor === undefined ? undefined : valor === 'true')),
    CORS_ORIGIN: textoOpcional,
    POSTGREST_URL: z.preprocess(vacio, z.url().default('http://127.0.0.1:3000')),
    POSTGREST_JWT_SECRET: secreto,
    START_POSTGREST: booleano(true),
    POSTGREST_BIN: z.preprocess(vacio, z.string().default('./bin/postgrest')),
    ENABLE_DOCS: booleano(false),
    TRUST_PROXY: z.preprocess(vacio, z.coerce.number().int().min(0).default(0)),
  })
  .transform((valor) => {
    const url = new URL(valor.POSTGREST_URL);
    return {
      ...valor,
      COOKIE_SECURE: valor.COOKIE_SECURE ?? valor.NODE_ENV === 'production',
      corsOrigins: (valor.CORS_ORIGIN ?? '')
        .split(',')
        .map((origen) => origen.trim())
        .filter((origen) => origen !== ''),
      postgrestHost: url.hostname,
      postgrestPort: url.port === '' ? (url.protocol === 'https:' ? 443 : 80) : Number(url.port),
      isProduction: valor.NODE_ENV === 'production',
    };
  });

export type Env = Readonly<z.output<typeof esquema>>;

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  const mensajes = new Map<string, string>();
  for (const issue of resultado.error.issues) {
    const campo = String(issue.path[0] ?? 'ENV');
    if (!mensajes.has(campo)) mensajes.set(campo, issue.message);
  }
  for (const [campo, mensaje] of mensajes) {
    console.error(`ENV ${campo}: ${mensaje}`);
  }
  process.exit(1);
}

export const env: Env = Object.freeze(resultado.data);
