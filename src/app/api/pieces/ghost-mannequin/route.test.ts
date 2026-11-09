import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const fromMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: fromMock,
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://mock-storage/${path}` } }),
      }),
    },
  }),
}))

vi.mock('@/lib/storage-url', () => ({
  isOwnedStorageUrl: () => true,
}))

import { POST, GET } from './route'

function createPostRequest(photoUrl: string = 'https://supabase.co/storage/v1/object/public/pieces/u1/test.jpg') {
  return new Request('http://localhost/api/pieces/ghost-mannequin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photo_url: photoUrl }),
  })
}

describe('POST /api/pieces/ghost-mannequin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  })

  it('retorna 401 se usuário não estiver autenticado', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(createPostRequest())
    expect(res.status).toBe(401)
  })

  it('retorna 403 se o usuário no trial já consumiu 3 fotos', async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { plan: 'free', usage_studio_generations: 3, extra_ghost_credits: 0 },
          }),
        }),
      }),
    })

    const res = await POST(createPostRequest())
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('GHOST_CREDITS_EXHAUSTED')
    expect(json.error).toContain('limite de 3 fotos')
  })

  it('retorna 403 se o usuário Pro já consumiu 20 fotos mensais e não tem créditos extras', async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { plan: 'pro', usage_studio_generations: 20, extra_ghost_credits: 0, usage_reset_at: new Date().toISOString() },
          }),
        }),
      }),
    })

    const res = await POST(createPostRequest())
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.code).toBe('GHOST_CREDITS_EXHAUSTED')
    expect(json.error).toContain('20 fotos mensais utilizadas')
  })
})
