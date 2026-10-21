-- Migracion: usuarios_baja_fisica
-- Los usuarios del sistema pasan a borrarse de forma fisica. Se quita la regla rl_soft_delete
-- (que reescribia el DELETE a UPDATE) y se eliminan las bajas logicas existentes.
-- Los refresh tokens caen por ON DELETE CASCADE.

DROP RULE IF EXISTS rl_soft_delete ON auth.usuarios_sistema;

DELETE FROM auth.usuarios_sistema WHERE deleted_at IS NOT NULL;
