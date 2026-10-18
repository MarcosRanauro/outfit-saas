import { PRECO_PRO_MENSAL } from '@/lib/pricing'

export type EmailContent = { subject: string; html: string }

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://miaoutfitai.com.br').replace(/\/$/, '')
}

function layout(title: string, bodyHtml: string, cta: { label: string; href: string }): string {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#080808;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080808;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#111111;border-radius:16px;border:1px solid rgba(180,140,60,0.25);">
        <tr><td style="padding:32px 24px;font-family:Inter,Arial,sans-serif;color:#e8e2d9;">
          <p style="margin:0 0 20px;font-family:'Bebas Neue',Impact,Arial,sans-serif;font-size:14px;letter-spacing:0.2em;color:rgba(180,140,60,1);">MIA OUTFIT AI</p>
          <h1 style="margin:0 0 16px;font-family:'Bebas Neue',Impact,Arial,sans-serif;font-size:30px;font-weight:400;letter-spacing:0.03em;color:#ffffff;">${title}</h1>
          ${bodyHtml}
          <p style="margin:28px 0 0;"><a href="${cta.href}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:rgba(180,140,60,1);color:#080808;font-size:14px;font-weight:600;text-decoration:none;">${cta.label}</a></p>
        </td></tr>
      </table>
      <p style="max-width:480px;margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.5;color:#7a7268;">E-mail de serviço da sua conta. Dúvidas? Responda em suporte@miaoutfitai.com.br.</p>
    </td></tr>
  </table>
</body>
</html>`
}

function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#cfc8bd;">${text}</p>`
}

function firstName(name: string | null | undefined): string {
  return escapeHtml((name ?? '').trim().split(/\s+/)[0] || 'por aí')
}

export function welcomeEmail(name: string | null): EmailContent {
  return {
    subject: 'Bem-vinda(o) à Mia Outfit AI',
    html: layout(
      `Oi, ${firstName(name)}!`,
      p('Sua conta está pronta. Você tem <strong>15 dias de acesso completo</strong> para testar tudo.') +
        p('Comece cadastrando algumas peças do seu closet — a Mia usa elas, o clima e a ocasião para montar seus looks.'),
      { label: 'Abrir meu closet', href: `${appUrl()}/closet` }
    ),
  }
}

export function trialEndingEmail(name: string | null, trialEndsAt: Date): EmailContent {
  const date = trialEndsAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' })
  return {
    subject: 'Seu teste da Mia termina em breve',
    html: layout(
      `${firstName(name)}, faltam poucos dias`,
      p(`Seu período de teste termina em <strong>${escapeHtml(date)}</strong>. Depois disso, os recursos de IA ficam bloqueados até você assinar.`) +
        p(`O plano Pro custa ${escapeHtml(PRECO_PRO_MENSAL)}, com a Mia e as sugestões de outfit sem limites. Suas peças e looks continuam salvos.`),
      { label: 'Ver o plano Pro', href: `${appUrl()}/perfil` }
    ),
  }
}

export function paymentFailedEmail(name: string | null): EmailContent {
  return {
    subject: 'Não conseguimos cobrar sua assinatura',
    html: layout(
      `${firstName(name)}, a cobrança falhou`,
      p('Não conseguimos processar o pagamento do seu plano Pro, e sua conta voltou para o plano gratuito.') +
        p('Para reativar, atualize a forma de pagamento. Suas peças e looks continuam salvos.'),
      { label: 'Atualizar pagamento', href: `${appUrl()}/perfil` }
    ),
  }
}
