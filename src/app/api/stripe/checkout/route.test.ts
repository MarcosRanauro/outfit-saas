import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUserMock = vi.fn()
const singleMock = vi.fn()
const eqMock = vi.fn().mockReturnValue({ single: singleMock })
const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const fromMock = vi.fn().mockReturnValue({
  select: selectMock,
  update: updateMock,
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  }),
}))

const sessionCreateMock = vi.fn()
const customerCreateMock = vi.fn()

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        create: customerCreateMock,
      },
      checkout: {
        sessions: {
          create: sessionCreateMock,
        },
      },
    })),
  }
})

import { POST } from './route'

function createRequest(body: Record<string, unknown> = {}) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.STRIPE_PRICE_ID
    delete process.env.STRIPE_PRICE_ADDON_10
    delete process.env.STRIPE_PRICE_ADDON_25
    delete process.env.STRIPE_PRICE_ADDON_50
    delete process.env.STRIPE_PRICE_ADDON_100

    getUserMock.mockResolvedValue({
      data: { user: { id: 'user_123', email: 'test@example.com' } },
    })

    singleMock.mockResolvedValue({
      data: { name: 'User Test', stripe_customer_id: 'cus_123', plan: 'free' },
    })

    sessionCreateMock.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    })
  })

  it('retorna 400 com mensagem clara quando a variável de preço não está configurada', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const res = await POST(createRequest())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Variável de preço do Stripe não configurada')

    // Verifica se os logs de debug local foram emitidos
    expect(consoleSpy).toHaveBeenCalledWith(
      '[stripe/checkout] priceId recebido:',
      undefined,
      'ID do usuário:',
      'user_123'
    )

    consoleSpy.mockRestore()
  })

  it('retorna 400 com mensagem clara quando pacote add-on não possui variável configurada', async () => {
    const res = await POST(createRequest({ package_id: 'addon_10' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Variável de preço do Stripe não configurada')
  })

  it('cria checkout com sucesso quando o priceId de pacote add-on está configurado no env', async () => {
    process.env.STRIPE_PRICE_ADDON_10 = 'price_addon_10_test'
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const res = await POST(createRequest({ package_id: 'addon_10' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://checkout.stripe.com/pay/cs_test_123')

    expect(consoleSpy).toHaveBeenCalledWith(
      '[stripe/checkout] priceId recebido:',
      'price_addon_10_test',
      'ID do usuário:',
      'user_123'
    )

    expect(sessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_addon_10_test', quantity: 1 }],
      })
    )

    consoleSpy.mockRestore()
  })

  it('cria checkout com sucesso para assinatura Pro quando STRIPE_PRICE_ID está configurado', async () => {
    process.env.STRIPE_PRICE_ID = 'price_pro_monthly_test'

    const res = await POST(createRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toBe('https://checkout.stripe.com/pay/cs_test_123')

    expect(sessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_pro_monthly_test', quantity: 1 }],
      })
    )
  })
})
