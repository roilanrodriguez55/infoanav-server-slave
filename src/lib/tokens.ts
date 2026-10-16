import { createHash, randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.ts';

export type Rol = 'administrador' | 'usuario';

export interface AccessClaims {
  sub: string;
  usuario: string;
  rol: Rol;
}

const ISSUER = 'infoanav';

function esRol(valor: unknown): valor is Rol {
  return valor === 'administrador' || valor === 'usuario';
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign({ sub: claims.sub, usuario: claims.usuario, rol: claims.rol }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
    issuer: ISSUER,
  });
}

export function verifyAccessToken(token: string): AccessClaims | null {
  try {
    const payload: Record<string, unknown> = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
    }) as Record<string, unknown>;
    const { sub, usuario, rol } = payload;
    if (typeof sub !== 'string' || typeof usuario !== 'string' || !esRol(rol)) return null;
    return { sub, usuario, rol };
  } catch {
    return null;
  }
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(64).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}

export function signInternalToken(usuario: string): string {
  return jwt.sign({ role: 'api_service', usuario }, env.POSTGREST_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '30s',
  });
}

export function refreshTtlMs(): number {
  return env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;
}
