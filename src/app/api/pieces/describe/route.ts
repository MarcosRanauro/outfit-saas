import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { photo_urls, name, category } = await request.json()

    if (!Array.isArray(photo_urls) || photo_urls.length === 0) {
      return NextResponse.json({ error: 'photo_urls obrigatório' }, { status: 400 })
    }

    const ALLOWED_STORAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')
    for (const url of photo_urls) {
      try {
        const parsed = new URL(url)
        if (!ALLOWED_STORAGE_HOST || parsed.hostname !== ALLOWED_STORAGE_HOST) {
          return NextResponse.json({ error: 'URL de imagem inválida' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'URL de imagem inválida' }, { status: 400 })
      }
    }

    const imageContents: Anthropic.ImageBlockParam[] = []
    for (const url of photo_urls) {
      const res = await fetch(url)
      const arrayBuffer = await res.arrayBuffer()
      const b64 = Buffer.from(arrayBuffer).toString('base64')
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const mediaType = (contentType.split(';')[0].trim()) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      imageContents.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: b64 },
      })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: 'Você é um especialista em moda e produtos de vestuário. Analise as fotos fornecidas do mesmo item e gere uma descrição técnica detalhada em inglês para uso em geração de imagem profissional.',
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: `Analise todas as fotos deste item (${category}: ${name}) e descreva em inglês com máximo de detalhes visuais: formato, materiais aparentes, cores exatas, estampas, logos, costuras, solado (se calçado), cadarços, texturas, detalhes decorativos. Seja específico e técnico. Máximo 3 frases.`,
            },
          ],
        },
      ],
    })

    const description = response.content[0]?.type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ description })

  } catch (error: unknown) {
    const err = error as Record<string, unknown>
    const message = err?.message && typeof err.message === 'string' ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
