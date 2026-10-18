const RESEND_URL = 'https://api.resend.com/emails'
const FROM = 'Mia Outfit AI <noreply@miaoutfitai.com.br>'

export type SendEmailParams = {
  to: string
  subject: string
  html: string
  /** Evita envio duplicado em reentregas (ex.: webhook do Stripe). */
  idempotencyKey: string
}

/**
 * Envia um e-mail transacional pela API do Resend.
 * Nunca lança: falha de e-mail não pode derrubar login, webhook ou cron.
 */
export async function sendEmail({ to, subject, html, idempotencyKey }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY ausente — e-mail não enviado:', subject)
    return false
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })

    if (!res.ok) {
      console.error('[email] Resend respondeu', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (error) {
    console.error('[email] erro ao enviar:', error)
    return false
  }
}
