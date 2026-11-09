import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isOwnedStorageUrl } from '@/lib/storage-url'

const HOST = 'abc.supabase.co'
const base = `https://${HOST}/storage/v1/object/public/pieces`
const OLD = process.env.NEXT_PUBLIC_SUPABASE_URL

beforeEach(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${HOST}` })
afterEach(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = OLD })

describe('isOwnedStorageUrl', () => {
  it('aceita as pastas do próprio usuário', () => {
    expect(isOwnedStorageUrl(`${base}/u1/1.jpg`, 'u1')).toBe(true)
    expect(isOwnedStorageUrl(`${base}/studio-input/u1/1.jpg`, 'u1')).toBe(true)
    expect(isOwnedStorageUrl(`${base}/studio/u1/1.png`, 'u1')).toBe(true)
  })

  it('rejeita pasta de outro usuário', () => {
    expect(isOwnedStorageUrl(`${base}/u2/1.jpg`, 'u1')).toBe(false)
    expect(isOwnedStorageUrl(`${base}/studio-input/u2/1.jpg`, 'u1')).toBe(false)
  })

  it('rejeita prefixo parecido (u10 vs u1)', () => {
    expect(isOwnedStorageUrl(`${base}/u10/1.jpg`, 'u1')).toBe(false)
  })

  it('rejeita outro host, http, outro bucket e endpoints não públicos', () => {
    expect(isOwnedStorageUrl(`https://evil.com/storage/v1/object/public/pieces/u1/1.jpg`, 'u1')).toBe(false)
    expect(isOwnedStorageUrl(`http://${HOST}/storage/v1/object/public/pieces/u1/1.jpg`, 'u1')).toBe(false)
    expect(isOwnedStorageUrl(`https://${HOST}/storage/v1/object/public/avatars/u1/avatar.jpg`, 'u1')).toBe(false)
    expect(isOwnedStorageUrl(`https://${HOST}/auth/v1/user`, 'u1')).toBe(false)
  })

  it('rejeita traversal e separadores codificados', () => {
    expect(isOwnedStorageUrl(`${base}/u1/../u2/1.jpg`, 'u1')).toBe(false)
    expect(isOwnedStorageUrl(`${base}/u1/%2e%2e/u2/1.jpg`, 'u1')).toBe(false)
    expect(isOwnedStorageUrl(`${base}/u1%2f..%2fu2/1.jpg`, 'u1')).toBe(false)
  })

  it('rejeita lixo e env ausente', () => {
    expect(isOwnedStorageUrl('não é url', 'u1')).toBe(false)
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    expect(isOwnedStorageUrl(`${base}/u1/1.jpg`, 'u1')).toBe(false)
  })
})
