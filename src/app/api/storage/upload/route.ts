import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadKindSchema } from '@/lib/api-schemas'
import { processImageUpload, MAX_UPLOAD_BYTES } from '@/lib/image-upload'
import { moderatePhotoBase64 } from '@/lib/moderation-server'

export const maxDuration = 30

type Kind = 'piece' | 'piece-input' | 'avatar'

const BUCKET: Record<Kind, 'pieces' | 'avatars'> = {
  piece: 'pieces',
  'piece-input': 'pieces',
  avatar: 'avatars',
}

/** O caminho é sempre definido aqui: o cliente nunca escolhe onde gravar. */
function storagePath(kind: Kind, userId: string): string {
  const ts = Date.now()
  if (kind === 'avatar') return `${userId}/avatar.jpg`
  if (kind === 'piece-input') return `studio-input/${userId}/${ts}.jpg`
  return `${userId}/${ts}.jpg`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    let form: FormData
    try {
      form = await request.formData()
    } catch {
      return NextResponse.json({ error: 'Requisição inválida', code: 'INVALID_REQUEST' }, { status: 400 })
    }

    const kind = uploadKindSchema.safeParse(form.get('kind'))
    const file = form.get('file')
    if (!kind.success || !(file instanceof File)) {
      return NextResponse.json({ error: 'Requisição inválida', code: 'INVALID_REQUEST' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'A imagem é muito grande', code: 'TOO_LARGE' }, { status: 413 })
    }

    const processed = await processImageUpload(new Uint8Array(await file.arrayBuffer()))
    if (!processed.ok) {
      const status = processed.code === 'TOO_LARGE' ? 413 : 415
      return NextResponse.json({ error: 'Imagem inválida', code: processed.code }, { status })
    }

    // modera exatamente os bytes que serão gravados (fail-closed)
    const moderation = await moderatePhotoBase64(processed.jpeg.toString('base64'))
    if (moderation.status === 'flagged') {
      console.warn('[storage/upload] imagem sinalizada', { userId: user.id, kind: kind.data, categories: moderation.categories })
      return NextResponse.json({ error: 'Imagem não permitida', code: 'CONTENT_FLAGGED' }, { status: 422 })
    }
    if (moderation.status === 'unavailable') {
      return NextResponse.json({ error: 'Moderação indisponível', code: 'MODERATION_UNAVAILABLE' }, { status: 503 })
    }

    const bucket = BUCKET[kind.data]
    const path = storagePath(kind.data, user.id)
    const admin = createAdminClient()

    const { error } = await admin.storage
      .from(bucket)
      .upload(path, processed.jpeg, { contentType: 'image/jpeg', upsert: kind.data === 'avatar' })
    if (error) {
      console.error('[storage/upload] erro ao gravar:', error)
      return NextResponse.json({ error: 'Erro ao salvar imagem' }, { status: 500 })
    }

    const { data } = admin.storage.from(bucket).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    console.error('[storage/upload] erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
