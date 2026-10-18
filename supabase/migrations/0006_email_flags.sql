-- E-mails transacionais: controle de envio único por usuário.
-- welcome_email_sent_at: boas-vindas (enviado quando a conta é confirmada).
-- trial_reminder_sent_at: aviso de trial acabando (cron diário).

ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "welcome_email_sent_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "trial_reminder_sent_at" timestamp with time zone;

-- Contas existentes não recebem boas-vindas retroativas.
UPDATE "public"."profiles"
  SET "welcome_email_sent_at" = now()
  WHERE "welcome_email_sent_at" IS NULL;
