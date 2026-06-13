import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { moderateBodySchema } from '@/lib/api-schemas'
import { moderatePhotoBase64 } from '@/lib/moderation-server'
import { parseRequestBody } from '@/lib/parse-request-body'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseRequestBody(request, moderateBodySchema)
    if (!parsed.success) return parsed.response

    const moderation = await moderatePhotoBase64(parsed.data.photo_base64)

    if (moderation.status === 'flagged') {
      return NextResponse.json({ flagged: true, categories: moderation.categories })
    }

    if (moderation.status === 'unavailable') {
      return NextResponse.json(
        { flagged: true, reason: 'moderation_unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json({ flagged: false })
  } catch (error: unknown) {
    console.error('Erro em pieces/moderate:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
