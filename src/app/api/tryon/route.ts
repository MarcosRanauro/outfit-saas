import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    const isPro = profile?.plan === 'pro'
    const isTrialActive = profile?.trial_ends_at ? new Date(profile.trial_ends_at) > new Date() : false

    if (!isPro && !isTrialActive) {
      return NextResponse.json(
        { error: 'Feature exclusiva do plano Pro ou trial ativo' },
        { status: 403 }
      )
    }

    const { modelImage, garmentImage, category } = await request.json()

    if (!modelImage || !garmentImage) {
      return NextResponse.json(
        { error: 'Imagens obrigatórias' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASHN_API_KEY}`,
      },
      body: JSON.stringify({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: modelImage,
          garment_image: garmentImage,
          category: category || 'tops',
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[tryon] erro FASHN status:', response.status)
      console.error('[tryon] erro FASHN body:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Erro ao processar imagem', detail: data },
        { status: 500 }
      )
    }

    const predictionId = data.id

    return NextResponse.json({ predictionId })

  } catch (error) {
    console.error('[tryon] erro:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
