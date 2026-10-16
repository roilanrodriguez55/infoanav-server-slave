import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import type { Server } from 'node:http';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

import { env } from './config/env.ts';
import { createApp, postgrestResponde } from './app.ts';
import { ensureAdmin } from './bootstrap/ensureAdmin.ts';
import { closePool } from './db/pool.ts';
import { purgeExpiredRefreshTokens } from './modules/auth/auth.service.ts';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ESPERA_POSTGREST_MS = 30_000;
const INTERVALO_SONDEO_MS = 250;
const INTERVALO_PURGA_MS = 6 * 60 * 60 * 1000;
const LIMITE_APAGADO_MS = 10_000;

let postgrest: ChildProcess | null = null;
let servidor: Server | null = null;
let apagando = false;

function mensajeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Sale sin dejar PostgREST huerfano
function salir(codigo: number): never {
  postgrest?.kill('SIGTERM');
  process.exit(codigo);
}

function ejecutarMigraciones(): void {
  const esWindows = process.platform === 'win32';
  const prisma = join(RAIZ, 'node_modules', '.bin', esWindows ? 'prisma.cmd' : 'prisma');
  const resultado = spawnSync(prisma, ['migrate', 'deploy'], { cwd: RAIZ, stdio: 'inherit', shell: esWindows });
  if (resultado.error || resultado.status !== 0) {
    console.error('Fallo al aplicar migraciones; no se inicia el servidor');
    process.exit(1);
  }
}

function reenviarSalida(flujo: Readable | null, escribir: (linea: string) => void): void {
  if (!flujo) return;
  createInterface({ input: flujo }).on('line', (linea) => escribir(`[postgrest] ${linea}`));
}

function arrancarPostgrest(): ChildProcess {
  // Entorno minimo: no se hereda process.env completo para no filtrar secretos a PostgREST
  const hijo = spawn(env.POSTGREST_BIN, [], {
    env: {
      PATH: process.env.PATH,
      PGRST_DB_URI: env.DATABASE_URL,
      PGRST_DB_SCHEMAS: 'api',
      PGRST_JWT_SECRET: env.POSTGREST_JWT_SECRET,
      PGRST_SERVER_HOST: env.postgrestHost,
      PGRST_SERVER_PORT: String(env.postgrestPort),
      PGRST_LOG_LEVEL: 'warn',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  reenviarSalida(hijo.stdout, console.log);
  reenviarSalida(hijo.stderr, console.error);

  hijo.once('error', (error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(
        `No se encontro PostgREST en ${env.POSTGREST_BIN}. Descargalo de https://github.com/PostgREST/postgrest/releases y ajusta POSTGREST_BIN, o usa START_POSTGREST=false si corre aparte`,
      );
    } else {
      console.error(`Error al arrancar PostgREST: ${mensajeError(error)}`);
    }
    salir(1);
  });
  hijo.once('exit', (codigo, senal) => {
    if (apagando) return;
    console.error(`PostgREST termino inesperadamente (codigo ${codigo}, senal ${senal})`);
    process.exit(1);
  });

  return hijo;
}

async function esperarPostgrest(): Promise<boolean> {
  const limite = Date.now() + ESPERA_POSTGREST_MS;
  while (Date.now() < limite) {
    if (await postgrestResponde()) return true;
    await new Promise((resolver) => setTimeout(resolver, INTERVALO_SONDEO_MS));
  }
  return false;
}

function purgarTokens(): void {
  purgeExpiredRefreshTokens().catch((error: unknown) => {
    console.error(`Error al purgar refresh tokens caducados: ${mensajeError(error)}`);
  });
}

async function iniciar(): Promise<void> {
  ejecutarMigraciones();

  try {
    await ensureAdmin();
  } catch (error) {
    console.error(mensajeError(error));
    process.exit(1);
  }

  if (env.START_POSTGREST) {
    // Si el puerto ya responde, la espera de abajo daria por bueno a otro programa
    if (await postgrestResponde()) {
      console.error(
        `El puerto de ${env.POSTGREST_URL} ya esta en uso por otro programa. Cambia POSTGREST_URL a un puerto libre o usa START_POSTGREST=false si PostgREST corre aparte`,
      );
      process.exit(1);
    }
    postgrest = arrancarPostgrest();
    if (!(await esperarPostgrest())) {
      console.error(`PostgREST no respondio en ${env.POSTGREST_URL} tras ${ESPERA_POSTGREST_MS / 1000} s`);
      salir(1);
    }
  } else if (!(await postgrestResponde())) {
    console.warn(`PostgREST no responde en ${env.POSTGREST_URL} (START_POSTGREST=false)`);
  }

  servidor = createApp().listen(env.PORT, () => {
    console.log(`Servidor listo en http://localhost:${env.PORT}`);
  });
  servidor.on('error', (error) => {
    console.error(`No se pudo escuchar en el puerto ${env.PORT}: ${mensajeError(error)}`);
    salir(1);
  });

  purgarTokens();
  setInterval(purgarTokens, INTERVALO_PURGA_MS).unref();
}

async function apagar(): Promise<void> {
  if (apagando) return;
  apagando = true;

  setTimeout(() => {
    console.error(`Apagado forzado: no termino en ${LIMITE_APAGADO_MS / 1000} s`);
    process.exit(1);
  }, LIMITE_APAGADO_MS);

  try {
    const http = servidor;
    if (http) {
      await new Promise<void>((resolver) => {
        http.close(() => resolver());
      });
    }

    const hijo = postgrest;
    if (hijo && hijo.exitCode === null && hijo.signalCode === null) {
      const terminado = new Promise<void>((resolver) => {
        hijo.once('exit', () => resolver());
      });
      hijo.kill('SIGTERM');
      await terminado;
    }

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error(`Error durante el apagado: ${mensajeError(error)}`);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void apagar();
});
process.on('SIGINT', () => {
  void apagar();
});
process.on('unhandledRejection', (error) => {
  console.error('Promesa no controlada:', error);
  salir(1);
});

iniciar().catch((error: unknown) => {
  console.error(mensajeError(error));
  salir(1);
});
