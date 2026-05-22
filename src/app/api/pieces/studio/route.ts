import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

function buildPrompt(
  name: string,
  category: string,
  color: string,
  color_secondary: string | null,
  brand: string | null,
  description: string | null,
): string {
  const colorDetail = color_secondary
    ? `${color} with ${color_secondary} details`
    : color

  const brandPart = brand ? ` by ${brand}` : ''
  const descPart = description ? `, ${description}` : ''

  return `Professional studio photo of a ${category}${brandPart}, ${colorDetail}${descPart}, displayed on a plain white mannequin, white background, soft diffused lighting, fashion product photography, full item visible, no shadows, high-end lookbook style`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { name, category, color, color_secondary, brand, description } = await request.json()

    const prompt = buildPrompt(name, category, color ?? '', color_secondary ?? null, brand ?? null, description ?? null)

    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt,
      n: 4,
      size: '512x512',
      response_format: 'url',
    })

    const images = (response.data ?? []).map((img) => img.url).filter(Boolean) as string[]
    return NextResponse.json({ images })
  } catch (error) {
    console.error('Erro ao gerar fotos de estúdio:', error)
    return NextResponse.json({ error: 'Erro ao gerar imagens' }, { status: 500 })
  }
}
