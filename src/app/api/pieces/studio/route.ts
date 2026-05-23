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

    const { photo_urls } = await request.json()

    if (!Array.isArray(photo_urls) || photo_urls.length === 0) {
      return NextResponse.json({ error: 'photo_urls obrigatório' }, { status: 400 })
    }

    const ALLOWED_STORAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')
    for (const url of photo_urls) {
      try {
        const parsed = new URL(url)
        if (!ALLOWED_STORAGE_HOST || parsed.hostname !== ALLOWED_STORAGE_HOST) {
          return NextResponse.json({ error: 'URL de imagem inválida' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ error: 'URL de imagem inválida' }, { status: 400 })
      }
    }

    // ─── GPT-IMAGE-1 (comentado — descomentar para reverter) ───
    // const { name, category, color, color_secondary, brand, description } = body
    //
    // const { default: OpenAI } = await import('openai')
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    //
    // function buildPrompt(name: string, category: string, color: string, colorSecondary: string | null, brand: string | null, enrichedDescription: string): string {
    //   const isFootwear = ['tênis', 'sapato', 'bota', 'sandália', 'calçado', 'sneaker', 'shoe'].some(
    //     w => category.toLowerCase().includes(w) || name.toLowerCase().includes(w)
    //   )
    //   const itemContext = isFootwear
    //     ? `a ${color} ${brand || ''} ${name} sneaker/shoe`
    //     : `a ${color} ${brand || ''} ${name} (${category})`
    //   return `Professional e-commerce product photo of ${itemContext}. ${enrichedDescription}.
    //
    // CRITICAL REQUIREMENTS:
    // - Pure white background (#FFFFFF), no shadows, no gradients
    // - The COMPLETE item must be fully visible, nothing cut off
    // - High contrast between item and background
    // - Sharp focus on entire product
    // - Professional fashion photography lighting
    // - No mannequin body parts visible except what holds the item
    // - No text overlays, no watermarks
    // - Photorealistic quality`
    // }
    //
    // const angles = [
    //   'Show the COMPLETE item from the FRONT. Full item visible from top to bottom, centered.',
    //   'Show the COMPLETE item from a 45-degree angle on the left side. Full item visible.',
    //   'Show the COMPLETE item from the BACK. Full item visible from top to bottom, centered.',
    // ]
    //
    // let enrichedDescription = description
    // try {
    //   const describeRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/pieces/describe`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json', 'Cookie': request.headers.get('cookie') || '' },
    //     body: JSON.stringify({ photo_urls, name, category }),
    //   })
    //   if (describeRes.ok) {
    //     const describeData = await describeRes.json()
    //     if (describeData.description) enrichedDescription = describeData.description
    //   }
    // } catch { /* fallback to original description */ }
    //
    // const imageResponse = await fetch(photo_urls[0])
    // const imageArrayBuffer = await imageResponse.arrayBuffer()
    // const imageBuffer = Buffer.from(imageArrayBuffer)
    // const imageFile = new File([imageBuffer], 'piece.jpg', { type: 'image/jpeg' })
    //
    // const results = await Promise.all(
    //   angles.map((angle) =>
    //     openai.images.edit({
    //       model: 'gpt-image-1',
    //       image: imageFile,
    //       prompt: `${buildPrompt(name, category, color, color_secondary ?? null, brand ?? null, enrichedDescription ?? '')} ${angle}`,
    //       n: 1,
    //       size: '1024x1024',
    //       quality: 'low',
    //     })
    //   )
    // )
    //
    // const urls: string[] = []
    // for (let i = 0; i < results.length; i++) {
    //   const b64 = results[i].data?.[0]?.b64_json
    //   if (!b64) continue
    //   const buffer = Buffer.from(b64, 'base64')
    //   const filename = `studio/${user.id}/${Date.now()}_${i}.png`
    //   const { error } = await supabase.storage
    //     .from('pieces')
    //     .upload(filename, buffer, { contentType: 'image/png', upsert: true })
    //   if (!error) {
    //     const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(filename)
    //     urls.push(urlData.publicUrl)
    //   } else {
    //     console.error('Upload error', i, error)
    //   }
    // }
    // ─── FIM GPT-IMAGE-1 ───

    // ─── PHOTOROOM (comentado — descomentar para reverter) ───
    // const targetUrls = photo_urls.slice(0, 3)
    // const ts = Date.now()
    //
    // const urls = (
    //   await Promise.all(
    //     targetUrls.map(async (url: string, i: number) => {
    //       const imageRes = await fetch(url)
    //       const imageBuffer = await imageRes.arrayBuffer()
    //
    //       const formData = new FormData()
    //       formData.append('image_file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'piece.jpg')
    //
    //       const photoroomRes = await fetch('https://sdk.photoroom.com/v1/segment', {
    //         method: 'POST',
    //         headers: { 'x-api-key': process.env.PHOTOROOM_API_KEY || '' },
    //         body: formData,
    //       })
    //
    //       if (!photoroomRes.ok) {
    //         console.error('Photoroom error', i, photoroomRes.status, await photoroomRes.text())
    //         return null
    //       }
    //
    //       const pngArrayBuffer = await photoroomRes.arrayBuffer()
    //       const pngBuffer = Buffer.from(pngArrayBuffer)
    //
    //       const sharp = (await import('sharp')).default
    //       const processedBuffer = await sharp(pngBuffer)
    //         .flatten({ background: { r: 255, g: 255, b: 255 } })
    //         .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    //         .png()
    //         .toBuffer()
    //
    //       const filename = `studio/${user.id}/${ts}_${i}.png`
    //       const { error } = await supabase.storage
    //         .from('pieces')
    //         .upload(filename, processedBuffer, { contentType: 'image/png', upsert: true })
    //
    //       if (error) {
    //         console.error('Upload error', i, error)
    //         return null
    //       }
    //
    //       const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(filename)
    //       return urlData.publicUrl
    //     })
    //   )
    // ).filter((u): u is string => u !== null)
    // ─── FIM PHOTOROOM ───

    // ─── FAL.AI (comentado — descomentar para reverter) ───
    // const { fal } = await import('@fal-ai/client')
    // fal.config({ credentials: process.env.FAL_API_KEY })
    //
    // const results = await Promise.all(
    //   photo_urls.slice(0, 3).map(async (photoUrl: string, i: number) => {
    //     const result = await fal.subscribe('fal-ai/bria/background/remove', {
    //       input: { image_url: photoUrl },
    //     })
    //
    //     const imageUrl = (result.data as { image?: { url?: string } })?.image?.url
    //     if (!imageUrl) return null
    //
    //     const imageResponse = await fetch(imageUrl)
    //     const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    //
    //     const { default: sharp } = await import('sharp')
    //     const processedBuffer = await sharp(imageBuffer)
    //       .flatten({ background: { r: 255, g: 255, b: 255 } })
    //       .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    //       .png()
    //       .toBuffer()
    //
    //     const filename = `studio/${user.id}/${Date.now()}_${i}.png`
    //     const { error } = await supabase.storage
    //       .from('pieces')
    //       .upload(filename, processedBuffer, { contentType: 'image/png', upsert: true })
    //
    //     if (error) {
    //       console.error('Upload error', i, error)
    //       return null
    //     }
    //
    //     const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(filename)
    //     return urlData.publicUrl
    //   })
    // )
    //
    // const urls = results.filter(Boolean) as string[]
    // ─── FIM FAL.AI ───

    // ─── REMOVE.BG ───
    const urls = (
      await Promise.all(
        photo_urls.slice(0, 3).map(async (photoUrl: string, i: number) => {
          const formData = new FormData()
          formData.append('image_url', photoUrl)
          formData.append('size', 'auto')
          formData.append('bg_color', 'ffffff')
          formData.append('format', 'png')

          const removeBgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY || '' },
            body: formData,
          })

          if (!removeBgRes.ok) {
            console.error('Remove.bg error', i, removeBgRes.status, await removeBgRes.text())
            return null
          }

          const pngBuffer = Buffer.from(await removeBgRes.arrayBuffer())

          const { default: sharp } = await import('sharp')
          const processedBuffer = await sharp(pngBuffer)
            .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
            .png()
            .toBuffer()

          const filename = `studio/${user.id}/${Date.now()}_${i}.png`
          const { error } = await supabase.storage
            .from('pieces')
            .upload(filename, processedBuffer, { contentType: 'image/png', upsert: true })

          if (error) {
            console.error('Upload error', i, error)
            return null
          }

          const { data: urlData } = supabase.storage.from('pieces').getPublicUrl(filename)
          return urlData.publicUrl
        })
      )
    ).filter((u): u is string => u !== null)
    // ─── FIM REMOVE.BG ───

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
