import { z } from 'zod'

/** Campo de texto que a IA pode devolver como string, null ou omitir. */
const optText = z.string().nullish()

export const outfitItemSchema = z
  .object({
    name: z.string().min(1),
    subtitle: optText,
    style_tags: z.array(z.string()).catch([]),
    piece_ids: z.array(z.string()),
    why: optText,
  })
  .passthrough()

export const aiOutfitsSchema = z.object({
  outfits: z.array(outfitItemSchema).min(1),
})

export const wishlistSuggestionSchema = z
  .object({
    category: z.string().min(1),
    name: z.string().min(1),
    color: optText,
    reason: optText,
    priority: z.enum(['high', 'medium', 'low']).catch('medium'),
  })
  .passthrough()

export const aiWishlistSchema = z.object({
  suggestions: z.array(wishlistSuggestionSchema).min(1),
})

export const pieceAnalysisSchema = z
  .object({
    name: optText,
    category: optText,
    color: optText,
    color_secondary: optText,
    brand: optText,
    fit: optText,
    style_type: optText,
    season: optText,
    description: optText,
  })
  .passthrough()

export const eventDateSchema = z.object({
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .catch(null),
  event_hour: z.number().int().min(0).max(23).nullable().catch(null),
})

/** Remove cercas de markdown e isola o primeiro objeto JSON do texto. */
export function extractJsonText(text: string): string {
  const clean = text.replace(/```json|```/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  return start !== -1 && end > start ? clean.slice(start, end + 1) : clean
}

/** Faz parse + validação do JSON devolvido pela IA. Nunca lança. */
export function parseAiJson<S extends z.ZodTypeAny>(
  text: string,
  schema: S
): { success: true; data: z.infer<S> } | { success: false } {
  let raw: unknown
  try {
    raw = JSON.parse(extractJsonText(text))
  } catch {
    return { success: false }
  }
  const result = schema.safeParse(raw)
  return result.success ? { success: true, data: result.data } : { success: false }
}
