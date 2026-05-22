import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.log('1. Auth OK')

    const { name, category, color, color_secondary, brand, description, photo_url } = await request.json()

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const angles = [
      'Front view, mannequin facing directly forward, all front details and logos clearly visible.',
      'Three-quarter front-left view, mannequin rotated 45 degrees to the left, showing front and left side simultaneously.',
      'Back view, mannequin facing directly backward, all back details clearly visible.',
      'Three-quarter back-right view, mannequin rotated 45 degrees to the right showing the back and right side simultaneously.',
    ]

    const basePrompt = `This is the exact same clothing item shown in the reference image. Do not change any design, logos, colors, patterns or details. Place it on a plain white mannequin against a pure white background. Studio lighting, sharp details, full item visible, fashion e-commerce style photography. No shadows, no props, no added text.`

    console.log('2. OpenAI edit iniciado')

    const imageResponse = await fetch(photo_url)
    const imageArrayBuffer = await imageResponse.arrayBuffer()
    const imageBuffer = Buffer.from(imageArrayBuffer)
    const imageFile = new File([imageBuffer], 'piece.jpg', { type: 'image/jpeg' })

    const results = await Promise.all(
      angles.map((angle) =>
        openai.images.edit({
          model: 'gpt-image-1',
          image: imageFile,
          prompt: `${basePrompt} ${angle}`,
          n: 1,
          size: '1024x1024',
        })
      )
    )

    console.log('3. OpenAI retornou', results.length, 'resultados')
    console.log('4. Iniciando uploads')

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
        console.log('5. Upload concluído', i, filename)
      } else {
        console.error('Upload error', i, error)
      }
    }

    console.log('6. URLs finais:', urls)

    if (urls.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem gerada' }, { status: 500 })
    }

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
