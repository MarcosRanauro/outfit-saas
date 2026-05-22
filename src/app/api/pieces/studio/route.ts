import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, incrementUsage } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateCheck = await checkRateLimit(user.id, 'studio_generate')
    if (!rateCheck.allowed) {
      const isExpired = rateCheck.plan === 'expired'
      return NextResponse.json(
        {
          error: isExpired
            ? 'Seu período de teste de 15 dias encerrou. Assine o Mia Pro para continuar! 🚀'
            : `Limite de gerações de estúdio atingido (${rateCheck.used}/${rateCheck.limit}). Faça upgrade para o plano Pro.`,
        },
        { status: 429 }
      )
    }

    const { name, category, color, color_secondary, brand, description, photo_url } = await request.json()

    const ALLOWED_STORAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')
    try {
      const parsedUrl = new URL(photo_url)
      if (!ALLOWED_STORAGE_HOST || parsedUrl.hostname !== ALLOWED_STORAGE_HOST) {
        return NextResponse.json({ error: 'URL de imagem inválida' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'URL de imagem inválida' }, { status: 400 })
    }

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const angles = [
      'Front view, the item facing directly forward, all front details clearly visible.',
      'Three-quarter front-left view, the item rotated 45 degrees to the left, showing front and left side simultaneously.',
      'Back view, the item facing directly backward, all back details clearly visible.',
    ]

    function buildPrompt(name: string, category: string, color: string, colorSecondary: string | null, brand: string | null, description: string | null): string {
      return `This is a ${category} clothing/fashion item called "${name}"${brand ? ` by ${brand}` : ''}. ${description || ''}. Color: ${color}${colorSecondary ? ' and ' + colorSecondary : ''}. This is NOT a shirt or t-shirt unless explicitly stated — respect the exact item type: ${category}. Place it on a plain white mannequin against a pure white background. Studio lighting, sharp details, full item visible, fashion e-commerce style photography. No shadows, no props, no added text.`
    }

    const imageResponse = await fetch(photo_url)
    const imageArrayBuffer = await imageResponse.arrayBuffer()
    const imageBuffer = Buffer.from(imageArrayBuffer)
    const imageFile = new File([imageBuffer], 'piece.jpg', { type: 'image/jpeg' })

    const results = await Promise.all(
      angles.map((angle) =>
        openai.images.edit({
          model: 'gpt-image-1',
          image: imageFile,
          prompt: `${buildPrompt(name, category, color, color_secondary, brand, description)} ${angle}`,
          n: 1,
          size: '1024x1024',
          quality: 'low',
        })
      )
    )

    const urls: string[] = []

    for (let i = 0; i < results.length; i++) {
      const b64 = results[i].data?.[0]?.b64_json
      if (!b64) continue
      const buffer = Buffer.from(b64, 'base64')
      const filename = `studio/${user.id}/${Date.now()}_${i}.png`
      const { error } = await supabase.storage
        .from('pieces')
        .upload(filename, buffer, { contentType: 'image/png', upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(filename)
        urls.push(urlData.publicUrl)
      } else {
        console.error('Upload error', i, error)
      }
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem gerada' }, { status: 500 })
    }

    await incrementUsage(user.id, 'studio_generate')
    return NextResponse.json({ images: urls })

  } catch (error: unknown) {
    const err = error as Record<string, unknown>
    console.error('Studio error full:', JSON.stringify({
      message: err?.message,
      status: err?.status,
      code: err?.code,
    }, null, 2))
    const message = err?.message && typeof err.message === 'string' ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
