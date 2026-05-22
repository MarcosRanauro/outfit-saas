import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

function buildPrompt(name: string, category: string, color: string, colorSecondary: string | null, brand: string | null, description: string | null): string {
  return `Professional fashion product photo of ${brand ? brand + ' ' : ''}${name}. ${description || ''}. Category: ${category}. Color: ${color}${colorSecondary ? ' and ' + colorSecondary : ''}. The item is displayed on a plain white mannequin against a pure white background. Studio lighting, sharp details, full item visible, fashion e-commerce style photography. No shadows, no props, no text.`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.log('1. Auth OK')

    const { name, category, color, color_secondary, brand, description } = await request.json()

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = buildPrompt(name, category, color ?? '', color_secondary ?? null, brand ?? null, description ?? null)
    console.log('Studio prompt:', prompt)

    console.log('2. OpenAI chamada iniciada')
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 4,
      size: '1024x1024',
      quality: 'medium',
    })
    console.log('3. OpenAI retornou', response.data?.length, 'imagens')

    const urls: string[] = []

    console.log('4. Iniciando uploads')
    for (let i = 0; i < (response.data ?? []).length; i++) {
      const b64 = (response.data ?? [])[i].b64_json
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
      }
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem gerada' }, { status: 500 })
    }

    console.log('6. URLs finais:', urls)
    return NextResponse.json({ images: urls, prompt })
  } catch (error: unknown) {
    const err = error as Record<string, unknown>
    console.error('Studio error full:', JSON.stringify({
      message: err?.message,
      status: err?.status,
      code: err?.code,
      cause: err?.cause,
      stack: typeof err?.stack === 'string' ? err.stack.split('\n').slice(0, 5) : undefined,
    }, null, 2))
    const message = err?.message && typeof err.message === 'string' ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
