import cookieParser from 'cookie-parser';
import { type CookieOptions, Router } from 'express';
import { z } from 'zod';

import { env } from '../../config/env.ts';
import { refreshTtlMs } from '../../lib/tokens.ts';
import { authenticate, getAuth } from '../../middleware/authenticate.ts';
import { HttpError } from '../../middleware/errors.ts';
import { esquemaContrasena, esquemaUsuario } from '../users/users.routes.ts';
import { loginRateLimiter, resetPasswordRateLimiter, setupRateLimiter } from '../../middleware/rateLimit.ts';
import {
  crearPrimerAdministrador,
  estadoSetup,
  login,
  logout,
  me,
  refresh,
  resetPassword,
} from './auth.service.ts';

const NOMBRE_COOKIE = 'refresh_token';

const opcionesCookie: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict',
  path: '/api/auth',
};

const esquemaLogin = z.object({
  usuario: z.string().trim().min(1).max(50),
  contrasena: z.string().min(1).max(200),
});

const esquemaSetup = z.object({
  usuario: esquemaUsuario,
  contrasena: esquemaContrasena,
  id_empresa: z.uuid().nullable().optional(),
});

const esquemaResetPassword = z.object({
  usuario: z.string().trim().min(1).max(50),
  codigo: z.string().trim().min(1).max(50),
  nuevaContrasena: esquemaContrasena,
});

export const authRouter = Router();

authRouter.use(cookieParser());

authRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

authRouter.post('/login', loginRateLimiter, async (req, res) => {
  const { usuario, contrasena } = esquemaLogin.parse(req.body);
  const sesion = await login(usuario, contrasena);

  res.cookie(NOMBRE_COOKIE, sesion.refreshToken, { ...opcionesCookie, maxAge: refreshTtlMs() });
  res.json({ accessToken: sesion.accessToken, usuario: sesion.usuario });
});

authRouter.get('/setup-status', async (_req, res) => {
  res.json(await estadoSetup());
});

authRouter.post('/setup', setupRateLimiter, async (req, res) => {
  const datos = esquemaSetup.parse(req.body);
  const { sesion, codigoRecuperacion } = await crearPrimerAdministrador(datos);

  res.cookie(NOMBRE_COOKIE, sesion.refreshToken, { ...opcionesCookie, maxAge: refreshTtlMs() });
  res.status(201).json({ accessToken: sesion.accessToken, usuario: sesion.usuario, codigoRecuperacion });
});

authRouter.post('/reset-password', resetPasswordRateLimiter, async (req, res) => {
  const { usuario, codigo, nuevaContrasena } = esquemaResetPassword.parse(req.body);
  const codigoRecuperacion = await resetPassword(usuario, codigo, nuevaContrasena);
  res.json({ codigoRecuperacion });
});

authRouter.post('/refresh', async (req, res) => {
  const token: unknown = req.cookies?.[NOMBRE_COOKIE];
  if (typeof token !== 'string') {
    throw new HttpError(401, 'Sesion invalida');
  }

  try {
    const sesion = await refresh(token);
    res.cookie(NOMBRE_COOKIE, sesion.refreshToken, { ...opcionesCookie, maxAge: refreshTtlMs() });
    res.json({ accessToken: sesion.accessToken, usuario: sesion.usuario });
  } catch (error) {
    res.clearCookie(NOMBRE_COOKIE, opcionesCookie);
    throw error;
  }
});

authRouter.post('/logout', async (req, res) => {
  const token: unknown = req.cookies?.[NOMBRE_COOKIE];
  await logout(typeof token === 'string' ? token : undefined);

  res.clearCookie(NOMBRE_COOKIE, opcionesCookie);
  res.status(204).end();
});

authRouter.get('/me', authenticate, async (_req, res) => {
  const usuario = await me(getAuth(res).sub);
  res.json({
    id: usuario.id,
    usuario: usuario.usuario,
    rol: usuario.rol,
    cargo_ocupa: usuario.cargo_ocupa,
    id_empresa: usuario.id_empresa,
  });
});
