import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/email-templates'

/** Envia as boas-vindas uma única vez por usuário; nunca lança. */
export async function sendWelcomeOnce(userId: string, email: string | undefined) {
  if (!email) return
  try {
    const admin = createAdminClient()
    // "claim" atômico: só quem consegue marcar o envio dispara o e-mail
    const { data: claimed } = await admin
      .from('profiles')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', userId)
      .is('welcome_email_sent_at', null)
      .select('name')
      .maybeSingle()
    if (!claimed) return

    const { subject, html } = welcomeEmail(claimed.name)
    const sent = await sendEmail({ to: email, subject, html, idempotencyKey: `welcome/${userId}` })
    if (!sent) {
      await admin.from('profiles').update({ welcome_email_sent_at: null }).eq('id', userId)
    }
  } catch (error) {
    console.error('[welcome-email] erro nas boas-vindas:', error)
  }
}
