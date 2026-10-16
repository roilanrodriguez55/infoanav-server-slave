-- Migracion: documentacion_libros_prestamos
-- Libros, prestamos y vista de solo lectura v_libros con el estado de prestamo de cada libro.
-- Un libro no puede tener dos prestamos abiertos (indice unico parcial).

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE TABLE IF NOT EXISTS api.libros (
  id_libro uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo varchar(300) NOT NULL,
  id_tema uuid REFERENCES api.temas (id_tema),
  autor_nombre varchar(150),
  autor_apellidos varchar(150),
  codigo varchar(100),
  id_tipo_documento uuid REFERENCES api.tipos_documento (id_tipo_documento),
  id_pais uuid REFERENCES api.paises (id_pais),
  ano_publicacion integer,
  id_editorial uuid REFERENCES api.editoriales (id_editorial),
  paginas varchar(50),
  nivel varchar(100),
  id_idioma uuid REFERENCES api.idiomas (id_idioma),
  estado_tecnico varchar(50),
  notas text,
  precio numeric(12,2),
  tipo_portada varchar(100),
  fecha_compra date,
  ubicacion varchar(150),
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text
);

CREATE INDEX IF NOT EXISTS idx_libros_id_tema ON api.libros (id_tema);
CREATE INDEX IF NOT EXISTS idx_libros_id_tipo_documento ON api.libros (id_tipo_documento);
CREATE INDEX IF NOT EXISTS idx_libros_id_pais ON api.libros (id_pais);
CREATE INDEX IF NOT EXISTS idx_libros_id_editorial ON api.libros (id_editorial);
CREATE INDEX IF NOT EXISTS idx_libros_id_idioma ON api.libros (id_idioma);
CREATE INDEX IF NOT EXISTS idx_libros_titulo_trgm ON api.libros USING gin (titulo public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_libros_autor_apellidos_trgm ON api.libros USING gin (autor_apellidos public.gin_trgm_ops);

CREATE TABLE IF NOT EXISTS api.prestamos (
  id_prestamo uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_libro uuid NOT NULL REFERENCES api.libros (id_libro),
  fecha_prestamo date NOT NULL DEFAULT current_date,
  fecha_a_devolver date,
  fecha_devolucion date,
  quien_presta varchar(150),
  a_quien varchar(150),
  estado_entrega varchar(100),
  estado_devolucion varchar(100),
  observaciones text,
  created_at timestamp with time zone DEFAULT now(),
  created_by text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  deleted_at timestamp with time zone,
  deleted_by text,
  CONSTRAINT ck_prestamos_fechas CHECK (fecha_devolucion IS NULL OR fecha_devolucion >= fecha_prestamo)
);

CREATE INDEX IF NOT EXISTS idx_prestamos_id_libro ON api.prestamos (id_libro);
CREATE UNIQUE INDEX IF NOT EXISTS ux_prestamos_libro_abierto ON api.prestamos (id_libro)
  WHERE fecha_devolucion IS NULL AND deleted_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON api.libros, api.prestamos TO api_service;

DO $$
DECLARE
  _tabla text;
  _pk text;
BEGIN
  FOR _tabla, _pk IN
    SELECT * FROM (VALUES
      ('libros', 'id_libro'),
      ('prestamos', 'id_prestamo')
    ) AS t(tabla, pk)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_audit_fields ON api.%I', _tabla);
    EXECUTE format('CREATE TRIGGER trg_set_audit_fields BEFORE INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.set_audit_fields()', _tabla);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_log_changes ON api.%I', _tabla);
    EXECUTE format('CREATE TRIGGER trg_log_changes AFTER INSERT OR UPDATE ON api.%I FOR EACH ROW EXECUTE FUNCTION api.log_changes(%L)', _tabla, _pk);

    EXECUTE format('DROP RULE IF EXISTS rl_soft_delete ON api.%I', _tabla);
    EXECUTE format('CREATE RULE rl_soft_delete AS ON DELETE TO api.%1$I DO INSTEAD UPDATE api.%1$I SET deleted_at = now() WHERE %2$I = old.%2$I RETURNING *', _tabla, _pk);
  END LOOP;
END
$$;

CREATE OR REPLACE VIEW api.v_libros AS
SELECT
  l.*,
  t.nombre AS tema_nombre,
  td.nombre AS tipo_documento_nombre,
  pa.nombre AS pais_nombre,
  ed.nombre AS editorial_nombre,
  idi.nombre AS idioma_nombre,
  p.id_prestamo IS NOT NULL AS prestado,
  p.id_prestamo AS id_prestamo_abierto,
  p.a_quien AS a_quien_abierto,
  p.fecha_a_devolver AS fecha_a_devolver_abierto,
  (p.id_prestamo IS NOT NULL AND COALESCE(p.fecha_a_devolver < current_date, false)) AS prestamo_vencido
FROM api.libros l
LEFT JOIN api.temas t ON t.id_tema = l.id_tema
LEFT JOIN api.tipos_documento td ON td.id_tipo_documento = l.id_tipo_documento
LEFT JOIN api.paises pa ON pa.id_pais = l.id_pais
LEFT JOIN api.editoriales ed ON ed.id_editorial = l.id_editorial
LEFT JOIN api.idiomas idi ON idi.id_idioma = l.id_idioma
LEFT JOIN api.prestamos p
  ON p.id_libro = l.id_libro
  AND p.fecha_devolucion IS NULL
  AND p.deleted_at IS NULL
WHERE l.deleted_at IS NULL;

GRANT SELECT ON api.v_libros TO api_service;

-- PostgREST emite RETURNING en todo DELETE. Las reglas rl_soft_delete expanden RETURNING * al
-- crearse, asi que se recrean en todas las tablas api con deleted_at (ver AGENTS.md).
DO $$
DECLARE
  tabla record;
  pk text;
BEGIN
  FOR tabla IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'api'
      AND c.column_name = 'deleted_at'
      AND t.table_type = 'BASE TABLE'
  LOOP
    SELECT a.attname INTO pk
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
    WHERE i.indrelid = format('api.%I', tabla.table_name)::regclass
      AND i.indisprimary;

    EXECUTE format('DROP RULE IF EXISTS rl_soft_delete ON api.%I', tabla.table_name);
    EXECUTE format(
      'CREATE RULE rl_soft_delete AS ON DELETE TO api.%1$I DO INSTEAD UPDATE api.%1$I SET deleted_at = now() WHERE %2$I = old.%2$I RETURNING *',
      tabla.table_name,
      pk
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
