import { describe, expect, it } from 'vitest'
import {
  aiOutfitsSchema,
  aiWishlistSchema,
  eventDateSchema,
  parseAiJson,
  pieceAnalysisSchema,
} from '@/lib/ai-schemas'

describe('parseAiJson', () => {
  it('aceita JSON dentro de cerca markdown e com texto em volta', () => {
    const text = 'Aqui está:\n```json\n{"outfits":[{"name":"Look","piece_ids":["a"]}]}\n```'
    const r = parseAiJson(text, aiOutfitsSchema)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.outfits[0].style_tags).toEqual([])
  })

  it('rejeita JSON inválido', () => {
    expect(parseAiJson('não é json', aiOutfitsSchema).success).toBe(false)
  })

  it('rejeita outfit sem piece_ids (evita crash no .includes)', () => {
    const r = parseAiJson('{"outfits":[{"name":"Look"}]}', aiOutfitsSchema)
    expect(r.success).toBe(false)
  })

  it('rejeita lista de outfits vazia', () => {
    expect(parseAiJson('{"outfits":[]}', aiOutfitsSchema).success).toBe(false)
  })

  it('wishlist: prioridade inválida vira medium', () => {
    const r = parseAiJson(
      '{"suggestions":[{"category":"Calça","name":"Chino","priority":"urgent"}]}',
      aiWishlistSchema
    )
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.suggestions[0].priority).toBe('medium')
  })

  it('análise de peça aceita campos null e preserva extras', () => {
    const r = parseAiJson('{"name":"Camiseta","brand":null,"extra":1}', pieceAnalysisSchema)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.brand).toBeNull()
  })

  it('data de evento inválida vira null', () => {
    const r = parseAiJson('{"event_date":"amanhã","event_hour":25}', eventDateSchema)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual({ event_date: null, event_hour: null })
  })
})
