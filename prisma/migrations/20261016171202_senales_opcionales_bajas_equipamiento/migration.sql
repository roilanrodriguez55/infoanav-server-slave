-- Migracion: senales_opcionales_bajas_equipamiento
-- Nombre de senal opcional, baja de senales, codigo LSM unico entre senales no borradas,
-- vinculo equipamiento-senal y ampliacion de textos.

-- senales: nombre opcional y campos de baja
ALTER TABLE api.senales ALTER COLUMN nombre DROP NOT NULL;
ALTER TABLE api.senales ADD COLUMN IF NOT EXISTS fecha_retirada timestamp without time zone;
ALTER TABLE api.senales ADD COLUMN IF NOT EXISTS causa_retirada text;

CREATE UNIQUE INDEX IF NOT EXISTS uq_senales_codigo_lsm ON api.senales (lower(codigo_lsm)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_senales_fecha_retirada ON api.senales (fecha_retirada);

-- fallas y mantenimientos: toda falla y mantenimiento pertenece a una senal
ALTER TABLE api.fallas ALTER COLUMN id_senal SET NOT NULL;
ALTER TABLE api.mantenimientos ALTER COLUMN id_senal SET NOT NULL;

-- Ensanchar columnas: la regla rl_soft_delete (RETURNING *) impide ALTER TYPE mientras exista,
-- asi que se quita, se cambia el tipo y se recrea igual que en 20260101000500_soft_delete_returning.
DROP RULE IF EXISTS rl_soft_delete ON api.senales;
ALTER TABLE api.senales ALTER COLUMN sistema_fondeo TYPE text;
CREATE RULE rl_soft_delete AS ON DELETE TO api.senales DO INSTEAD UPDATE api.senales SET deleted_at = now() WHERE id_senal = old.id_senal RETURNING *;

DROP RULE IF EXISTS rl_soft_delete ON api.fallas;
ALTER TABLE api.fallas ALTER COLUMN medidas TYPE text;
ALTER TABLE api.fallas ALTER COLUMN observaciones TYPE text;
CREATE RULE rl_soft_delete AS ON DELETE TO api.fallas DO INSTEAD UPDATE api.fallas SET deleted_at = now() WHERE id_falla = old.id_falla RETURNING *;

DROP RULE IF EXISTS rl_soft_delete ON api.mantenimientos;
ALTER TABLE api.mantenimientos ALTER COLUMN trabajo_realizado TYPE text;
CREATE RULE rl_soft_delete AS ON DELETE TO api.mantenimientos DO INSTEAD UPDATE api.mantenimientos SET deleted_at = now() WHERE id_mantenimiento = old.id_mantenimiento RETURNING *;

-- equipamientos_senal: vinculo directo con la senal (senales.id_equipamiento queda sin uso)
ALTER TABLE api.equipamientos_senal ADD COLUMN IF NOT EXISTS id_senal uuid REFERENCES api.senales(id_senal);
CREATE INDEX IF NOT EXISTS idx_equipamientos_senal_id_senal ON api.equipamientos_senal (id_senal);

NOTIFY pgrst, 'reload schema';
