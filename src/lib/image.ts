export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const MODERATION_CONTENT_MESSAGE =
  'Esta imagem não é permitida. Por favor, envie uma foto de roupa ou acessório.'

export const MODERATION_UNAVAILABLE_MESSAGE =
  'Não conseguimos validar sua imagem agora, tente novamente em instantes.'

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
