import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: fromMock,
  }),
}))

import { POST, GET } from './route'

function createPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/pieces', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/pieces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  })

  it('retorna 401 se usuário não estiver autenticado', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(createPostRequest({ name: 'Camisa', category: 'Superior' }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 se nome ou categoria não forem fornecidos', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { plan: 'free' } }) }) }),
        }
      }
      if (table === 'pieces') {
        return {
          select: () => ({ eq: () => Promise.resolve({ count: 5, error: null }) }),
        }
      }
      return {}
    })

    const res = await POST(createPostRequest({ name: '' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/obrigatório/i)
  })

  it('bloqueia com 403 quando usuário no trial já possui 20 peças', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { plan: 'free', trial_ends_at: new Date(Date.now() + 86400000).toISOString() } }),
            }),
          }),
        }
      }
      if (table === 'pieces') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ count: 20, error: null }),
          }),
        }
      }
      return {}
    })

    const res = await POST(createPostRequest({ name: 'Camiseta 21', category: 'Superior' }))
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('TRIAL_PIECES_LIMIT_REACHED')
    expect(json.error).toContain('limite de 20 peças')
  })

  it('permite cadastrar quando usuário no trial possui menos de 20 peças', async () => {
    const mockPiece = { id: 'p1', name: 'Camisa 20', category: 'Superior' }

    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { plan: 'free' } }),
            }),
          }),
        }
      }
      if (table === 'pieces') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ count: 19, error: null }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockPiece, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(createPostRequest({ name: 'Camisa 20', category: 'Superior' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.piece).toEqual(mockPiece)
  })

  it('permite cadastrar sem checagem de limite quando usuário é Pro', async () => {
    const mockPiece = { id: 'p99', name: 'Jaqueta Pro', category: 'Superior' }

    fromMock.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { plan: 'pro' } }),
            }),
          }),
        }
      }
      if (table === 'pieces') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockPiece, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(createPostRequest({ name: 'Jaqueta Pro', category: 'Superior' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.piece).toEqual(mockPiece)
  })
})
