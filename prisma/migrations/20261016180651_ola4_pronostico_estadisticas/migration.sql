-- Migracion: ola4_pronostico_estadisticas
-- Pronostico manual por señal (una fila por señal) y vista de estadisticas de señales activas.

CREATE TABLE IF NOT EXISTS api.pronosticos_senal (
  id_pronostico uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_senal uuid NOT NULL REFERENCES api.senales (id_senal),
  disponibilidad_deseada text,
  criterios_bateria text,
  panel text,
  destellador_bombillo text,
  tmef_1 text,
  tmef_2 text,
  tmef_3 text,
  tmef_senal text,
  tmpr_pronosticado text,
  tmrf text,
  tmpr_real text,
  disponibilidad_pronosticada text,
  tiempo_informacion text,
  tiempo_preparacion text,
  tiempo_travesia text,
  tiempo_reposicion text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pronosticos_senal_id_senal ON api.pronosticos_senal (id_senal) WHERE deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON api.pronosticos_senal TO api_service;

DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.pronosticos_senal;
CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.pronosticos_senal FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields();

DROP TRIGGER IF EXISTS trg_log_changes ON api.pronosticos_senal;
CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.pronosticos_senal FOR EACH ROW EXECUTE FUNCTION api.log_changes('id_pronostico');

DROP RULE IF EXISTS rl_soft_delete ON api.pronosticos_senal;
CREATE RULE rl_soft_delete AS ON DELETE TO api.pronosticos_senal DO INSTEAD UPDATE api.pronosticos_senal SET deleted_at = now() WHERE id_pronostico = old.id_pronostico RETURNING *;

CREATE OR REPLACE VIEW api.v_senales_estadisticas AS
SELECT
  s.id_senal,
  s.codigo_lsm,
  s.nombre,
  s.id_empresa,
  emp.nombre AS empresa,
  s.id_estacion,
  est.nombre AS estacion,
  s.id_tipo,
  ts.nombre AS tipo,
  s.id_categoria,
  cat.nombre AS categoria,
  s.id_complejidad,
  cx.nombre AS complejidad,
  s.id_usuario_navegacion,
  un.nombre AS usuario_navegacion,
  s.id_caracteristica,
  car.nombre AS caracteristica,
  s.id_colorluz,
  cl.nombre AS color_luz,
  s.id_color,
  col.nombre AS color,
  s.id_modelo,
  mdl.nombre AS modelo,
  s.id_forma,
  frm.nombre AS forma,
  s.id_material,
  mat.nombre AS material,
  s.altura,
  s.elevacion,
  s.profundidad,
  s.luminica,
  (s.fecha_retirada IS NOT NULL) AS baja
FROM api.senales s
LEFT JOIN api.empresas emp ON emp.id_empresa = s.id_empresa
LEFT JOIN api.estaciones est ON est.id_estacion = s.id_estacion
LEFT JOIN api.tipos_senal ts ON ts.id_tipo = s.id_tipo
LEFT JOIN api.categorias cat ON cat.id_categoria = s.id_categoria
LEFT JOIN api.complejidades cx ON cx.id_complejidad = s.id_complejidad
LEFT JOIN api.usuarios_navegacion un ON un.id_usuario_navegacion = s.id_usuario_navegacion
LEFT JOIN api.caracteristicas car ON car.id_caracteristica = s.id_caracteristica
LEFT JOIN api.colores_luz cl ON cl.id_colorluz = s.id_colorluz
LEFT JOIN api.colores col ON col.id_color = s.id_color
LEFT JOIN api.modelos_senal mdl ON mdl.id_modelo = s.id_modelo
LEFT JOIN api.formas frm ON frm.id_forma = s.id_forma
LEFT JOIN api.materiales mat ON mat.id_material = s.id_material
WHERE s.deleted_at IS NULL;

GRANT SELECT ON api.v_senales_estadisticas TO api_service;

NOTIFY pgrst, 'reload schema';
