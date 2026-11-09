import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isOwnedStorageUrl } from '@/lib/storage-url'
import { checkRateLimit, incrementUsage, rateLimitResponse } from '@/lib/rate-limit'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const rateLimit = await checkRateLimit(user.id, 'studio_generate')
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit)

    const { photo_url } = await request.json()
    if (!photo_url || typeof photo_url !== 'string') {
      return NextResponse.json({ error: 'Nenhuma foto fornecida' }, { status: 400 })
    }

    // só imagens já moderadas, gravadas pelo servidor na pasta do próprio usuário
    if (!isOwnedStorageUrl(photo_url, user.id)) {
      return NextResponse.json({ error: 'URL de imagem inválida' }, { status: 400 })
    }

    const imgRes = await fetch(photo_url)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Erro ao buscar imagem' }, { status: 500 })
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

    const formData = new FormData()
    formData.append(
      'imageFile',
      new Blob([new Uint8Array(imgBuffer)], { type: 'image/jpeg' }),
      'piece.jpg',
    )
    formData.append('ghostMannequin.mode', 'ai.auto')
    formData.append('background.color', 'FFFFFF')
    formData.append('padding', '0.1')

    const photoroomRes = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.PHOTOROOM_API_KEY || '',
        'Accept': 'image/png, application/json',
      },
      body: formData,
    })

    if (!photoroomRes.ok) {
      const err = await photoroomRes.json().catch(() => ({}))
      console.error('Photoroom error:', err)
      return NextResponse.json({ error: 'Erro ao gerar manequim fantasma' }, { status: 500 })
    }

    const resultBuffer = Buffer.from(await photoroomRes.arrayBuffer())

    const storagePath = `studio/${user.id}/ghost_${Date.now()}.png`
    const admin = createAdminClient()
    const { error: uploadError } = await admin.storage
      .from('pieces')
      .upload(storagePath, resultBuffer, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Erro ao salvar imagem' }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from('pieces').getPublicUrl(storagePath)

    await incrementUsage(user.id, 'studio_generate')
    return NextResponse.json({ studio_urls: [urlData.publicUrl] })

  } catch (error) {
    console.error('Ghost mannequin route error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
