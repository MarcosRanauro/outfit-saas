import { beforeEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'

const getUser = vi.fn()
const upload = vi.fn()
const moderate = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload,
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://x.supabase.co/${path}` } }),
      }),
    },
  }),
}))
vi.mock('@/lib/moderation-server', () => ({ moderatePhotoBase64: (...a: unknown[]) => moderate(...a) }))

import { POST } from './route'

async function request(kind: string | null, file?: Blob) {
  const form = new FormData()
  if (kind) form.append('kind', kind)
  if (file) form.append('file', file, 'a.jpg')
  return new Request('http://localhost/api/storage/upload', { method: 'POST', body: form })
}

async function jpeg() {
  const buf = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).jpeg().toBuffer()
  return new Blob([new Uint8Array(buf)], { type: 'image/jpeg' })
}

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  upload.mockResolvedValue({ error: null })
  moderate.mockResolvedValue({ status: 'approved' })
})

describe('POST /api/storage/upload', () => {
  it('401 sem login e não grava', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(await request('piece', await jpeg()))
    expect(res.status).toBe(401)
    expect(upload).not.toHaveBeenCalled()
  })

  it('400 com kind inválido ou sem arquivo', async () => {
    expect((await POST(await request('../hack', await jpeg()))).status).toBe(400)
    expect((await POST(await request('piece'))).status).toBe(400)
  })

  it('415 para arquivo que não é imagem', async () => {
    const res = await POST(await request('piece', new Blob(['oi'], { type: 'image/jpeg' })))
    expect(res.status).toBe(415)
    expect(moderate).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
  })

  it('422 quando sinalizada: não grava', async () => {
    moderate.mockResolvedValue({ status: 'flagged', categories: {} })
    const res = await POST(await request('piece', await jpeg()))
    expect(res.status).toBe(422)
    expect((await res.json()).code).toBe('CONTENT_FLAGGED')
    expect(upload).not.toHaveBeenCalled()
  })

  it('503 quando a moderação está indisponível: não grava (fail-closed)', async () => {
    moderate.mockResolvedValue({ status: 'unavailable' })
    const res = await POST(await request('piece', await jpeg()))
    expect(res.status).toBe(503)
    expect(upload).not.toHaveBeenCalled()
  })

  it('aprovada: grava no caminho do servidor e devolve a URL', async () => {
    const res = await POST(await request('piece-input', await jpeg()))
    expect(res.status).toBe(200)
    const path = upload.mock.calls[0][0] as string
    expect(path).toMatch(/^studio-input\/u1\/\d+\.jpg$/)
    expect((await res.json()).url).toContain(path)
  })

  it('avatar vai para avatars/{uid}/avatar.jpg', async () => {
    await POST(await request('avatar', await jpeg()))
    expect(upload.mock.calls[0][0]).toBe('u1/avatar.jpg')
  })
})
