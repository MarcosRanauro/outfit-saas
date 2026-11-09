import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isOwnedStorageUrl } from '@/lib/storage-url'
import { evaluateGhostCredits, deductGhostCredit } from '@/lib/ghost-credits'

export const maxDuration = 60

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at, usage_studio_generations, usage_reset_at, extra_ghost_credits')
      .eq('id', user.id)
      .single()

    const status = evaluateGhostCredits(profile)
    return NextResponse.json({
      balance: status.totalBalance,
      allowance_remaining: status.allowanceRemaining,
      extra_credits: status.extraCredits,
      is_pro: status.isPro,
      allowed: status.allowed,
    })
  } catch (error) {
    console.error('Erro no GET /api/pieces/ghost-mannequin:', error)
    return NextResponse.json({ error: 'Erro ao consultar saldo' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // 1) Checagem de saldo antes de processar a imagem
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at, usage_studio_generations, usage_reset_at, extra_ghost_credits')
      .eq('id', user.id)
      .single()

    const ghostStatus = evaluateGhostCredits(profile)
    if (!ghostStatus.allowed) {
      return NextResponse.json(
        {
          error: ghostStatus.errorMessage || 'Seus créditos de Manequim Fantasma acabaram.',
          code: 'GHOST_CREDITS_EXHAUSTED',
          balance: 0,
          upgradeUrl: '/perfil',
        },
        { status: 403 }
      )
    }

    const { photo_url } = await request.json().catch(() => ({}))
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

    // 2) Subtrai 1 crédito após o sucesso da requisição
    const { remaining_credits } = await deductGhostCredit(
      user.id,
      profile!,
      ghostStatus,
      supabase
    )

    return NextResponse.json({
      studio_urls: [urlData.publicUrl],
      remaining_credits,
    })

  } catch (error) {
    console.error('Ghost mannequin route error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
