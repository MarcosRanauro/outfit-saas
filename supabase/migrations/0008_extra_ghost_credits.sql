-- Migration 0008: Adiciona créditos avulsos para fotos de manequim fantasma (Photoroom)
ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "extra_ghost_credits" integer DEFAULT 0;

-- Função atômica para deduzir 1 crédito avulso com segurança
CREATE OR REPLACE FUNCTION "public"."deduct_extra_ghost_credit"("user_id" "uuid")
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $_$
DECLARE
  caller uuid := auth.uid();
  new_balance integer;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  UPDATE profiles
  SET extra_ghost_credits = GREATEST(0, COALESCE(extra_ghost_credits, 0) - 1)
  WHERE id = caller AND COALESCE(extra_ghost_credits, 0) > 0
  RETURNING extra_ghost_credits INTO new_balance;

  RETURN COALESCE(new_balance, 0);
END;
$_$;

REVOKE ALL ON FUNCTION "public"."deduct_extra_ghost_credit"("uuid") FROM "anon";
GRANT EXECUTE ON FUNCTION "public"."deduct_extra_ghost_credit"("uuid") TO "authenticated";
