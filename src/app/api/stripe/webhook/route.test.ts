import { beforeEach, describe, expect, it, vi } from 'vitest'

const constructEventMock = vi.fn()

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: constructEventMock,
      },
    })),
  }
})

const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
const singleMock = vi.fn()
const eqMock = vi.fn().mockReturnValue({ single: singleMock })
const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
const fromMock = vi.fn().mockReturnValue({
  select: selectMock,
  update: updateMock,
})

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: fromMock,
  }),
  getUserEmail: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'mock-email' }),
}))

import { POST } from './route'

function createWebhookRequest(body: string = '{}', signature: string = 'sig_test') {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: {
      'stripe-signature': signature,
    },
    body,
  })
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123'
  })

  it('retorna 400 se a assinatura do webhook for inválida', async () => {
    constructEventMock.mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })

    const res = await POST(createWebhookRequest('invalid-payload'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Webhook inválido')
  })

  it('adiciona créditos extras ao identificar pacote do ADDON_PACKAGES no checkout.session.completed', async () => {
    constructEventMock.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'payment',
          metadata: {
            supabase_user_id: 'user_123',
            addon_package_id: 'addon_25',
          },
        },
      },
    })

    singleMock.mockResolvedValueOnce({
      data: { extra_ghost_credits: 5 },
    })

    const res = await POST(createWebhookRequest())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)

    // Deve buscar perfil com extra_ghost_credits
    expect(fromMock).toHaveBeenCalledWith('profiles')
    expect(selectMock).toHaveBeenCalledWith('extra_ghost_credits')
    expect(eqMock).toHaveBeenCalledWith('id', 'user_123')

    // Deve somar 25 créditos aos 5 existentes
    expect(updateMock).toHaveBeenCalledWith({ extra_ghost_credits: 30 })
  })

  it('adiciona créditos quando especificado via addon_photos no metadata', async () => {
    constructEventMock.mockReturnValueOnce({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'payment',
          metadata: {
            supabase_user_id: 'user_456',
            addon_photos: '10',
          },
        },
      },
    })

    singleMock.mockResolvedValueOnce({
      data: { extra_ghost_credits: 0 },
    })

    const res = await POST(createWebhookRequest())
    expect(res.status).toBe(200)

    expect(updateMock).toHaveBeenCalledWith({ extra_ghost_credits: 10 })
  })
})
