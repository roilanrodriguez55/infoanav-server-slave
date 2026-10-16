-- PostgREST emite RETURNING en todo DELETE; las reglas rl_soft_delete sin RETURNING
-- hacen fallar cualquier DELETE con "cannot perform DELETE RETURNING".
-- Se recrea la regla de cada tabla api con deleted_at añadiendo RETURNING *.
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
