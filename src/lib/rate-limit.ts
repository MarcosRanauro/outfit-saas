import { createClient } from '@/lib/supabase/server'

const LIMITS = {
  free: {
    mia_chat: 10,
    outfit_generate: 5,
    pieces_analyze: 3,
    wishlist_generate: 3,
  },
  pro: {
    mia_chat: 999,
    outfit_generate: 999,
    pieces_analyze: 999,
    wishlist_generate: 999,
  },
}

type ActionType = keyof typeof LIMITS.free

export async function checkRateLimit(
  userId: string,
  action: ActionType
): Promise<{ allowed: boolean; plan: string; limit: number; used: number }> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, usage_mia_generations, usage_outfit_generations, usage_pieces_analyzed, usage_wishlist_generations, usage_reset_at')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, plan: 'free', limit: 0, used: 0 }

  const plan = (profile.plan || 'free') as 'free' | 'pro'
  const limit = LIMITS[plan][action]

  const resetAt = new Date(profile.usage_reset_at || new Date())
  const now = new Date()
  const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceReset >= 30) {
    await supabase
      .from('profiles')
      .update({
        usage_mia_generations: 0,
        usage_outfit_generations: 0,
        usage_pieces_analyzed: 0,
        usage_wishlist_generations: 0,
        usage_reset_at: now.toISOString(),
      })
      .eq('id', userId)
  }

  const usageMap: Record<ActionType, number> = {
    mia_chat: profile.usage_mia_generations || 0,
    outfit_generate: profile.usage_outfit_generations || 0,
    pieces_analyze: profile.usage_pieces_analyzed || 0,
    wishlist_generate: profile.usage_wishlist_generations || 0,
  }

  const used = usageMap[action]

  return {
    allowed: plan === 'pro' || used < limit,
    plan,
    limit,
    used,
  }
}

export async function incrementUsage(
  userId: string,
  action: ActionType
): Promise<void> {
  const supabase = await createClient()

  const columnMap: Record<ActionType, string> = {
    mia_chat: 'usage_mia_generations',
    outfit_generate: 'usage_outfit_generations',
    pieces_analyze: 'usage_pieces_analyzed',
    wishlist_generate: 'usage_wishlist_generations',
  }

  const column = columnMap[action]

  await supabase.rpc('increment_usage', {
    user_id: userId,
    column_name: column,
  })
}
