import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { welcomeEmail } from '@/lib/email-templates'

/** Envia as boas-vindas uma única vez; nunca bloqueia o login. */
async function sendWelcomeOnce(userId: string, email: string | undefined) {
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
    console.error('[auth/callback] erro nas boas-vindas:', error)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/closet'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (data.user) await sendWelcomeOnce(data.user.id, data.user.email)
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('Erro no callback:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=callback`)
}
