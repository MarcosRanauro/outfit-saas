import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TRIAL_LIMITS, PRO_LIMITS } from '@/config/plan-limits'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [{ data: profile }, { count, data: pieces, error }] = await Promise.all([
      supabase.from('profiles').select('plan, trial_ends_at').eq('id', user.id).single(),
      supabase
        .from('pieces')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    if (error) {
      console.error('Erro ao buscar peças:', error)
      return NextResponse.json({ error: 'Erro ao buscar peças' }, { status: 500 })
    }

    const isPro = profile?.plan === 'pro'
    const currentCount = count ?? 0
    const maxPieces = isPro ? PRO_LIMITS.max_pieces : TRIAL_LIMITS.max_pieces

    return NextResponse.json({
      pieces,
      count: currentCount,
      is_pro: isPro,
      max_pieces: maxPieces,
      can_add_more: isPro || currentCount < TRIAL_LIMITS.max_pieces,
    })
  } catch (error) {
    console.error('Erro no GET /api/pieces:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // 1) Verificar se o usuário está no plano Pro ou no Trial
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    const isPro = profile?.plan === 'pro'

    // 2) Se estiver no trial (não for Pro), validar o teto de 20 peças
    if (!isPro) {
      const { count, error: countError } = await supabase
        .from('pieces')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) {
        console.error('Erro ao contar peças:', countError)
        return NextResponse.json({ error: 'Erro ao validar limite de peças' }, { status: 500 })
      }

      const currentCount = count ?? 0

      // Bloqueia a partir da 21ª peça (já possui 20 cadastradas)
      if (currentCount >= TRIAL_LIMITS.max_pieces) {
        return NextResponse.json(
          {
            error: `Você atingiu o limite de ${TRIAL_LIMITS.max_pieces} peças do período de teste. Faça upgrade para o plano Pro para cadastrar peças ilimitadas.`,
            code: 'TRIAL_PIECES_LIMIT_REACHED',
            current_count: currentCount,
            max_pieces: TRIAL_LIMITS.max_pieces,
            upgrade_url: '/perfil',
          },
          { status: 403 }
        )
      }
    }

    // 3) Processar os dados da peça para cadastro
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
    }

    const {
      name,
      category,
      color,
      color_secondary,
      brand,
      photo_url,
      fit,
      style_type,
      season,
      description,
      notes,
      photos,
    } = body

    if (!name || typeof name !== 'string' || !category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Nome e categoria são obrigatórios' },
        { status: 400 }
      )
    }

    const code = `P${Date.now()}`

    const { data: piece, error: pieceError } = await supabase
      .from('pieces')
      .insert({
        user_id: user.id,
        code,
        name: name.trim(),
        category: category.trim(),
        color: color?.trim() || null,
        color_secondary: color_secondary?.trim() || null,
        brand: brand?.trim() || null,
        photo_url: photo_url || null,
        fit: fit || null,
        style_type: style_type || null,
        season: season || null,
        description: description?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (pieceError || !piece) {
      console.error('Erro ao cadastrar peça:', pieceError)
      return NextResponse.json({ error: 'Erro ao cadastrar peça' }, { status: 500 })
    }

    // 4) Se foram enviadas fotos adicionais, grava na tabela piece_photos
    if (Array.isArray(photos) && photos.length > 0) {
      const photoRows = photos.map((p: unknown, i: number) => {
        const item = typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : null
        return {
          piece_id: piece.id,
          user_id: user.id,
          url: typeof p === 'string' ? p : (typeof item?.url === 'string' ? item.url : ''),
          is_cover: typeof item?.isCover === 'boolean' ? item.isCover : i === 0,
          is_studio: typeof item?.isStudio === 'boolean' ? item.isStudio : false,
          sort_order: i,
        }
      })

      const { error: photosError } = await supabase.from('piece_photos').insert(photoRows)
      if (photosError) {
        console.error('Erro ao cadastrar fotos adicionais da peça:', photosError)
      }
    }

    return NextResponse.json({ piece }, { status: 201 })
  } catch (error) {
    console.error('Erro no POST /api/pieces:', error)
    return NextResponse.json({ error: 'Erro interno ao processar cadastro' }, { status: 500 })
  }
}
