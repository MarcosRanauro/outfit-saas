const PIECE_PHOTO_MAX_SIZE = 1200
const PIECE_PHOTO_JPEG_QUALITY = 0.8

export function toBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Redimensiona e comprime foto de peça para moderação, análise e upload (max 1200px, JPEG 0.8). */
export function compressPiecePhoto(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas não disponível'))
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      let { width, height } = img
      if (width > height && width > PIECE_PHOTO_MAX_SIZE) {
        height = Math.round((height * PIECE_PHOTO_MAX_SIZE) / width)
        width = PIECE_PHOTO_MAX_SIZE
      } else if (height > PIECE_PHOTO_MAX_SIZE) {
        width = Math.round((width * PIECE_PHOTO_MAX_SIZE) / height)
        height = PIECE_PHOTO_MAX_SIZE
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem'))
            return
          }
          const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
          resolve(
            new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
          )
        },
        'image/jpeg',
        PIECE_PHOTO_JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Falha ao carregar imagem'))
    }

    img.src = url
  })
}

export const MODERATION_CONTENT_MESSAGE =
  'Esta imagem não é permitida. Por favor, envie uma foto de roupa ou acessório.'

export const MODERATION_UNAVAILABLE_MESSAGE =
  'Não conseguimos validar sua imagem agora, tente novamente em instantes.'

export const MODERATION_PAYLOAD_TOO_LARGE_MESSAGE =
  'A imagem é muito grande. Tente uma foto menor.'

export type ModerateImageResult = {
  approved: boolean
  message?: string
}

export async function moderateImage(base64: string): Promise<ModerateImageResult> {
  try {
    const res = await fetch('/api/pieces/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_base64: base64 }),
    })

    if (res.status === 413) {
      return { approved: false, message: MODERATION_PAYLOAD_TOO_LARGE_MESSAGE }
    }

    const data = await res.json() as {
      flagged?: boolean
      reason?: string
    }

    if (data.flagged && data.reason === 'moderation_unavailable') {
      return { approved: false, message: MODERATION_UNAVAILABLE_MESSAGE }
    }

    if (data.flagged) {
      return { approved: false, message: MODERATION_CONTENT_MESSAGE }
    }

    return { approved: true }
  } catch {
    return { approved: false, message: MODERATION_UNAVAILABLE_MESSAGE }
  }
}

export type UploadImageKind = 'piece' | 'piece-input' | 'avatar'

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; message: string }

/** Envia a imagem pelo servidor, que modera e grava no Storage (o cliente não escreve direto). */
export async function uploadImage(file: Blob, kind: UploadImageKind): Promise<UploadImageResult> {
  try {
    const form = new FormData()
    form.append('file', file, 'photo.jpg')
    form.append('kind', kind)

    const res = await fetch('/api/storage/upload', { method: 'POST', body: form })
    const data = await res.json().catch(() => ({})) as { url?: string; code?: string }

    if (res.ok && data.url) return { ok: true, url: data.url }
    if (data.code === 'CONTENT_FLAGGED') return { ok: false, message: MODERATION_CONTENT_MESSAGE }
    if (data.code === 'TOO_LARGE' || res.status === 413) return { ok: false, message: MODERATION_PAYLOAD_TOO_LARGE_MESSAGE }
    if (data.code === 'MODERATION_UNAVAILABLE') return { ok: false, message: MODERATION_UNAVAILABLE_MESSAGE }
    return { ok: false, message: 'Erro ao enviar a imagem. Tente novamente.' }
  } catch {
    return { ok: false, message: 'Erro ao enviar a imagem. Tente novamente.' }
  }
}
