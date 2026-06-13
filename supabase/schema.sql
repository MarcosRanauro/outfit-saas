


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_usage"("user_id" "uuid", "column_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."increment_usage"("user_id" "uuid", "column_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_trial_on_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.trial_ends_at = NOW() + INTERVAL '15 days';
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_trial_on_signup"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."outfit_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "outfit_id" "uuid",
    "worn_at" "date" DEFAULT CURRENT_DATE,
    "occasion" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."outfit_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."outfits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "style_tags" "text"[],
    "occasion_tags" "text"[],
    "pieces" "uuid"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "period" "text" DEFAULT 'dia'::"text",
    "occasion" "text",
    "why" "text",
    "subtitle" "text"
);


ALTER TABLE "public"."outfits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."piece_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "piece_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "is_cover" boolean DEFAULT false,
    "is_studio" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."piece_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pieces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "color" "text",
    "brand" "text",
    "photo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "fit" "text",
    "style_type" "text",
    "season" "text",
    "color_secondary" "text",
    "description" "text",
    "notes" "text"
);


ALTER TABLE "public"."pieces" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "height" integer,
    "weight" integer,
    "style" "text",
    "avatar_url" "text",
    "plan" "text" DEFAULT 'free'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "closet_tour_completed" boolean DEFAULT false,
    "usage_mia_generations" integer DEFAULT 0,
    "usage_pieces_analyzed" integer DEFAULT 0,
    "usage_reset_at" timestamp with time zone DEFAULT "now"(),
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "plan_expires_at" timestamp with time zone,
    "usage_outfit_generations" integer DEFAULT 0,
    "usage_wishlist_generations" integer DEFAULT 0,
    "trial_ends_at" timestamp with time zone,
    "usage_studio_generations" integer DEFAULT 0
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "reason" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "purchased" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishlist_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."outfit_history"
    ADD CONSTRAINT "outfit_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outfits"
    ADD CONSTRAINT "outfits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."piece_photos"
    ADD CONSTRAINT "piece_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pieces"
    ADD CONSTRAINT "pieces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id");



CREATE INDEX "piece_photos_piece_id_idx" ON "public"."piece_photos" USING "btree" ("piece_id");



CREATE OR REPLACE TRIGGER "trigger_set_trial" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_trial_on_signup"();



ALTER TABLE ONLY "public"."outfit_history"
    ADD CONSTRAINT "outfit_history_outfit_id_fkey" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."outfit_history"
    ADD CONSTRAINT "outfit_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outfits"
    ADD CONSTRAINT "outfits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."piece_photos"
    ADD CONSTRAINT "piece_photos_piece_id_fkey" FOREIGN KEY ("piece_id") REFERENCES "public"."pieces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."piece_photos"
    ADD CONSTRAINT "piece_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pieces"
    ADD CONSTRAINT "pieces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Usuário atualiza próprias fotos" ON "public"."piece_photos" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário exclui próprias fotos" ON "public"."piece_photos" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário insere próprias fotos" ON "public"."piece_photos" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário vê própria wishlist" ON "public"."wishlist_items" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário vê próprias fotos" ON "public"."piece_photos" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário vê próprias peças" ON "public"."pieces" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário vê próprio histórico" ON "public"."outfit_history" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuário vê próprio perfil" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Usuário vê próprios outfits" ON "public"."outfits" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."outfit_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."outfits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."piece_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pieces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlist_items" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_usage"("user_id" "uuid", "column_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_usage"("user_id" "uuid", "column_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_trial_on_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_trial_on_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_trial_on_signup"() TO "service_role";



GRANT ALL ON TABLE "public"."outfit_history" TO "anon";
GRANT ALL ON TABLE "public"."outfit_history" TO "authenticated";
GRANT ALL ON TABLE "public"."outfit_history" TO "service_role";



GRANT ALL ON TABLE "public"."outfits" TO "anon";
GRANT ALL ON TABLE "public"."outfits" TO "authenticated";
GRANT ALL ON TABLE "public"."outfits" TO "service_role";



GRANT ALL ON TABLE "public"."piece_photos" TO "anon";
GRANT ALL ON TABLE "public"."piece_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."piece_photos" TO "service_role";



GRANT ALL ON TABLE "public"."pieces" TO "anon";
GRANT ALL ON TABLE "public"."pieces" TO "authenticated";
GRANT ALL ON TABLE "public"."pieces" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist_items" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







