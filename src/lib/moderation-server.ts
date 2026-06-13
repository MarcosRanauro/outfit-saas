const RETRY_DELAY_MS = 500
const MAX_ATTEMPTS = 3

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type ModerationServerResult =
  | { status: 'approved' }
  | { status: 'flagged'; categories: unknown }
  | { status: 'unavailable' }

export async function moderatePhotoBase64(photoBase64: string): Promise<ModerationServerResult> {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const moderation = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${photoBase64}`,
            },
          },
        ],
      })

      const result = moderation.results[0]
      if (!result) {
        throw new Error('Resposta de moderação vazia')
      }

      if (result.flagged) {
        return { status: 'flagged', categories: result.categories }
      }

      return { status: 'approved' }
    } catch (error) {
      lastError = error
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS)
      }
    }
  }

  console.error('Moderação fail-closed após retries:', lastError)
  return { status: 'unavailable' }
}
