CREATE OR REPLACE FUNCTION "public"."increment_usage"("user_id" "uuid", "column_name" "text")
RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = public
    AS $_$
DECLARE
  caller uuid := auth.uid();
  allowed_columns text[] := ARRAY[
    'usage_mia_generations',
    'usage_outfit_generations',
    'usage_pieces_analyzed',
    'usage_wishlist_generations',
    'usage_studio_generations'
  ];
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT (column_name = ANY(allowed_columns)) THEN
    RAISE EXCEPTION 'Coluna inválida: %', column_name;
  END IF;

  EXECUTE format('UPDATE profiles SET %I = %I + 1 WHERE id = $1', column_name, column_name)
  USING caller;
END;
$_$;

REVOKE ALL ON FUNCTION "public"."increment_usage"("uuid", "text") FROM "anon";
