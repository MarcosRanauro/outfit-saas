/**
 * Só aceita URLs públicas do nosso Storage que apontam para a pasta do próprio
 * usuário. Como apenas o servidor grava nessas pastas (após moderação), tudo que
 * passa por aqui já foi moderado.
 */
export function isOwnedStorageUrl(rawUrl: string, userId: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return false

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }

  if (url.protocol !== 'https:' || url.host !== new URL(supabaseUrl).host) return false

  const base = '/storage/v1/object/public/pieces/'
  const allowedPrefixes = [`${base}${userId}/`, `${base}studio-input/${userId}/`, `${base}studio/${userId}/`]
  const path = url.pathname
  if (!allowedPrefixes.some((prefix) => path.startsWith(prefix))) return false

  // sem traversal nem separadores codificados
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return false
  }
  return !decoded.split('/').some((seg) => seg === '..' || seg === '.') && !/%2f|%5c|\\/i.test(path)
}
