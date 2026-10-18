import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendEmail } from '@/lib/email'

const params = { to: 'a@b.com', subject: 'Oi', html: '<p>oi</p>', idempotencyKey: 'welcome/u1' }

describe('sendEmail', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('envia para a API do Resend com auth e Idempotency-Key', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await sendEmail(params)).toBe(true)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers).toMatchObject({ Authorization: 'Bearer re_test', 'Idempotency-Key': 'welcome/u1' })
    expect(JSON.parse(init.body as string)).toMatchObject({
      from: 'Mia Outfit AI <noreply@miaoutfitai.com.br>',
      to: 'a@b.com',
      subject: 'Oi',
    })
  })

  it('erro HTTP → false, sem lançar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('erro', { status: 422 })))
    expect(await sendEmail(params)).toBe(false)
  })

  it('rede caindo → false, sem lançar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('rede') }))
    expect(await sendEmail(params)).toBe(false)
  })

  it('sem RESEND_API_KEY → false e não chama a API', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await sendEmail(params)).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
