import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const predictionId = searchParams.get('id')

    if (!predictionId) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    // Valida ownership: a prediction precisa pertencer ao usuário atual
    const { data: prediction } = await supabase
      .from('tryon_predictions')
      .select('id')
      .eq('prediction_id', predictionId)
      .eq('user_id', user.id)
      .single()

    if (!prediction) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    }

    const response = await fetch(
      `https://api.fashn.ai/v1/status/${predictionId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FASHN_API_KEY}`,
        },
      }
    )

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('[tryon/status] erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
