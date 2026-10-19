import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { detectImageType, processImageUpload } from '@/lib/image-upload'

async function makeImage(format: 'jpeg' | 'png' | 'webp', withExif = false) {
  let img = sharp({ create: { width: 40, height: 20, channels: 3, background: '#cc3333' } })
  if (withExif) img = img.withExif({ IFD0: { Copyright: 'segredo' } })
  return img.toFormat(format).toBuffer()
}

describe('processImageUpload', () => {
  it('rejeita texto renomeado como imagem', async () => {
    const r = await processImageUpload(new TextEncoder().encode('<script>alert(1)</script>'))
    expect(r).toEqual({ ok: false, code: 'INVALID_IMAGE' })
  })

  it('rejeita arquivo acima do limite', async () => {
    const r = await processImageUpload(new Uint8Array(2000), 1000)
    expect(r).toEqual({ ok: false, code: 'TOO_LARGE' })
  })

  it('rejeita cabeçalho válido com corpo corrompido', async () => {
    const r = await processImageUpload(new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]))
    expect(r).toEqual({ ok: false, code: 'INVALID_IMAGE' })
  })

  it.each(['jpeg', 'png', 'webp'] as const)('converte %s para JPEG', async (format) => {
    const input = await makeImage(format)
    expect(detectImageType(input)).toBe(format)
    const r = await processImageUpload(input)
    expect(r.ok).toBe(true)
    if (r.ok) expect(detectImageType(r.jpeg)).toBe('jpeg')
  })

  it('remove metadados EXIF', async () => {
    const input = await makeImage('jpeg', true)
    expect((await sharp(input).metadata()).exif).toBeDefined()
    const r = await processImageUpload(input)
    expect(r.ok).toBe(true)
    if (r.ok) expect((await sharp(r.jpeg).metadata()).exif).toBeUndefined()
  })
})
