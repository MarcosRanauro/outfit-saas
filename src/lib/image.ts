export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function moderateImage(base64: string): Promise<boolean> {
  try {
    const res = await fetch('/api/pieces/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_base64: base64 }),
    })
    const data = await res.json()
    return !data.flagged
  } catch {
    return true
  }
}
