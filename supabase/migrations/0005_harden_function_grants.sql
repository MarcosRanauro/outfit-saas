-- Fecha avisos do advisor de seguranca: EXECUTE amplo demais e search_path mutavel.

-- Funcoes de trigger: nunca devem ser chamadas via /rest/v1/rpc.
ALTER FUNCTION "public"."handle_new_user"() SET search_path = public;
ALTER FUNCTION "public"."set_trial_on_signup"() SET search_path = public;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC, "anon", "authenticated";
REVOKE ALL ON FUNCTION "public"."set_trial_on_signup"() FROM PUBLIC, "anon", "authenticated";

-- increment_usage: so usuario autenticado (a funcao ja usa auth.uid() internamente).
REVOKE ALL ON FUNCTION "public"."increment_usage"("uuid", "text") FROM PUBLIC, "anon";
GRANT EXECUTE ON FUNCTION "public"."increment_usage"("uuid", "text") TO "authenticated";
