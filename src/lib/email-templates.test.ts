import { describe, expect, it } from 'vitest'
import { paymentFailedEmail, trialEndingEmail, welcomeEmail } from '@/lib/email-templates'
import { PRECO_PRO_MENSAL } from '@/lib/pricing'

describe('email-templates', () => {
  it('escapa HTML no nome do usuário', () => {
    const { html } = welcomeEmail('<script>alert(1)</script> Silva')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('usa só o primeiro nome e tem fallback sem nome', () => {
    expect(welcomeEmail('Maria da Silva').html).toContain('Oi, Maria!')
    expect(welcomeEmail(null).html).toContain('Oi, por aí!')
  })

  it('boas-vindas leva ao closet', () => {
    expect(welcomeEmail('Ana').html).toMatch(/href="[^"]+\/closet"/)
  })

  it('trial acabando mostra a data e o preço de pricing.ts', () => {
    const { html, subject } = trialEndingEmail('Ana', new Date('2026-11-05T15:00:00.000Z'))
    expect(subject).toContain('termina')
    expect(html).toContain('05 de novembro')
    expect(html).toContain(PRECO_PRO_MENSAL)
  })

  it('falha de cobrança leva ao perfil', () => {
    expect(paymentFailedEmail('Ana').html).toMatch(/href="[^"]+\/perfil"/)
  })
})
