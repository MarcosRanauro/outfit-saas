import { describe, expect, it } from 'vitest'
import { miaChatBodySchema, MAX_MESSAGE_CHARS } from '@/lib/api-schemas'

describe('miaChatBodySchema', () => {
  it('rejeita mensagem acima do limite', () => {
    const r = miaChatBodySchema.safeParse({ message: 'a'.repeat(MAX_MESSAGE_CHARS + 1) })
    expect(r.success).toBe(false)
  })

  it('aceita mensagem no limite', () => {
    const r = miaChatBodySchema.safeParse({ message: 'a'.repeat(MAX_MESSAGE_CHARS) })
    expect(r.success).toBe(true)
  })

  it('apara histórico longo: últimas 20, começando pelo usuário, conteúdo ≤ 4000', () => {
    const history = Array.from({ length: 51 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: 'x'.repeat(5000),
    }))
    const r = miaChatBodySchema.parse({ message: 'oi', history })
    expect(r.history.length).toBeLessThanOrEqual(20)
    expect(r.history[0].role).toBe('user')
    expect(r.history.every((m) => m.content.length === 4000)).toBe(true)
  })

  it('histórico só de assistente vira vazio', () => {
    const r = miaChatBodySchema.parse({ message: 'oi', history: [{ role: 'assistant', content: 'a' }] })
    expect(r.history).toEqual([])
  })
})
