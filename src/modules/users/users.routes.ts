import { type Response, Router } from 'express';
import { z } from 'zod';

import { authenticate, getAuth } from '../../middleware/authenticate.ts';
import { requireRole } from '../../middleware/requireRole.ts';
import { createUser, deleteUser, listUsers, type ActorUsuario, updateUser } from './users.service.ts';

const esquemaId = z.uuid();
const esquemaUsuario = z.string().trim().min(3).max(50).regex(/^[A-Za-z0-9._-]+$/);
// 72 bytes es el limite de bcrypt
const esquemaContrasena = z.string().min(8).max(72);
const esquemaRol = z.enum(['administrador', 'usuario']);
const esquemaCargo = z.string().trim().max(100).nullable().optional();
const esquemaEmpresa = z.uuid().nullable().optional();

const esquemaCrear = z.object({
  usuario: esquemaUsuario,
  contrasena: esquemaContrasena,
  rol: esquemaRol,
  cargo_ocupa: esquemaCargo,
  id_empresa: esquemaEmpresa,
});

const esquemaActualizar = z.object({
  rol: esquemaRol.optional(),
  cargo_ocupa: esquemaCargo,
  id_empresa: esquemaEmpresa,
  contrasena: esquemaContrasena.optional(),
});

function actorDe(res: Response): ActorUsuario {
  const { sub, usuario } = getAuth(res);
  return { id: sub, usuario };
}

export const usersRouter = Router();

usersRouter.use(authenticate, requireRole('administrador'));

usersRouter.get('/', async (req, res) => {
  const usuarios = await listUsers(req.query.incluir_bajas === 'true');
  res.json(usuarios);
});

usersRouter.post('/', async (req, res) => {
  const datos = esquemaCrear.parse(req.body);
  const usuario = await createUser(actorDe(res), datos);
  res.status(201).json(usuario);
});

usersRouter.patch('/:id', async (req, res) => {
  const id = esquemaId.parse(req.params.id);
  const cambios = esquemaActualizar.parse(req.body);
  const usuario = await updateUser(actorDe(res), id, cambios);
  res.json(usuario);
});

usersRouter.delete('/:id', async (req, res) => {
  const id = esquemaId.parse(req.params.id);
  await deleteUser(actorDe(res), id);
  res.status(204).end();
});
