import { z } from 'zod'

const anchorPieceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  color: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
})

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

export const outfitGenerateBodySchema = z.object({
  period: z.string().optional(),
  occasion: z.string().optional(),
  temp: z.coerce.number().optional(),
  weatherDesc: z.string().optional(),
  eventDate: z.string().nullable().optional(),
  eventPeriod: z.string().nullable().optional(),
  previousOutfits: z.array(z.array(z.string())).optional(),
  usedPieceIds: z.array(z.string()).optional(),
  anchorPiece: anchorPieceSchema.nullable().optional(),
})

export const wishlistGenerateBodySchema = z.object({}).strict()

export const miaChatBodySchema = z.object({
  message: z.string().min(1),
  history: z.array(chatMessageSchema).optional().default([]),
  weather: z
    .object({
      temp: z.number(),
      desc: z.string(),
      humidity: z.number().optional(),
      wind: z.number().optional(),
    })
    .nullable()
    .optional(),
  weatherContext: z.string().nullable().optional(),
  anchorPiece: anchorPieceSchema.nullable().optional(),
})

export const miaExtractDateBodySchema = z.object({
  message: z.string().min(1),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
})

export const piecesAnalyzeBodySchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().optional(),
})

export const piecesDescribeBodySchema = z.object({
  photo_urls: z.array(z.string().min(1)).min(1),
  name: z.string().optional(),
  category: z.string().optional(),
})

export const tryonBodySchema = z.object({
  modelImage: z.string().min(1),
  garmentImage: z.string().min(1),
  category: z.string().optional(),
})

export const moderateBodySchema = z.object({
  photo_base64: z.string().min(1),
})
