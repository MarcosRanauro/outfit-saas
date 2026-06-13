import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { photo_base64 } = await request.json()

    if (!photo_base64 || typeof photo_base64 !== 'string') {
      return NextResponse.json({ error: 'photo_base64 obrigatório' }, { status: 400 })
    }

    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

      const moderation = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${photo_base64}`,
            },
          },
        ],
      })

      const result = moderation.results[0]

      if (result.flagged) {
        return NextResponse.json({ flagged: true, categories: result.categories })
      }

      return NextResponse.json({ flagged: false })
    } catch (moderationError: unknown) {
      const err = moderationError as Record<string, unknown>
      console.warn('Moderation API error — permitindo upload:', err?.message ?? 'desconhecido')
      return NextResponse.json({ flagged: false })
    }
  } catch (error: unknown) {
    console.error('Erro em pieces/moderate:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
