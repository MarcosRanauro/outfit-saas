import { createClient } from '@supabase/supabase-js'

/** Cliente com service role — ignora RLS. Usar só no servidor. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** E-mail do usuário (fica só em auth.users, não em profiles). */
export async function getUserEmail(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) {
    console.error('[admin] erro ao buscar e-mail do usuário:', error.message)
    return null
  }
  return data.user?.email ?? null
}
