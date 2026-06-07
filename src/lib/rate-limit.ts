import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type PlanLimits = {
  mia_chat: number
  outfit_generate: number
  pieces_analyze: number
  wishlist_generate: number
  studio_generate: number
}

const LIMITS: Record<'free' | 'pro', PlanLimits> = {
  free: {
    mia_chat: 10,
    outfit_generate: 5,
    pieces_analyze: 3,
    wishlist_generate: 3,
    studio_generate: 10,
  },
  pro: {
    mia_chat: 999,
    outfit_generate: 999,
    pieces_analyze: 999,
    wishlist_generate: 999,
    studio_generate: 999,
  },
}

type ActionType = keyof PlanLimits

export type RateLimitResult = {
  allowed: boolean
  plan: 'free' | 'pro' | 'trial' | 'expired'
  limit: number
  used: number
  reason?: 'trial_expired' | 'rate_limited' | 'no_profile'
  trialEndsAt?: string | null
}

const usageColumnMap: Record<ActionType, string> = {
  mia_chat: 'usage_mia_generations',
  outfit_generate: 'usage_outfit_generations',
  pieces_analyze: 'usage_pieces_analyzed',
  wishlist_generate: 'usage_wishlist_generations',
  studio_generate: 'usage_studio_generations',
}

export async function checkRateLimit(
  userId: string,
  action: ActionType
): Promise<RateLimitResult> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'plan, usage_mia_generations, usage_outfit_generations, usage_pieces_analyzed, usage_wishlist_generations, usage_studio_generations, usage_reset_at, trial_ends_at'
    )
    .eq('id', userId)
    .single()

  if (!profile) {
    return { allowed: false, plan: 'free', limit: 0, used: 0, reason: 'no_profile' }
  }

  const plan = (profile.plan || 'free') as 'free' | 'pro'

  const now = new Date()
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const trialActive = trialEndsAt !== null && trialEndsAt > now
  const trialExpired = trialEndsAt !== null && trialEndsAt <= now

  // 1. Trial ainda ativo → acesso ilimitado
  if (trialActive) {
    return {
      allowed: true,
      plan: 'trial',
      limit: 999,
      used: 0,
      trialEndsAt: profile.trial_ends_at,
    }
  }

  // 2. Trial expirado e ainda no Free → bloqueia e pede upgrade
  if (trialExpired && plan === 'free') {
    return {
      allowed: false,
      plan: 'expired',
      reason: 'trial_expired',
      limit: 0,
      used: 0,
      trialEndsAt: profile.trial_ends_at,
    }
  }

  // 3. Reset mensal de uso (Free sem trial ou Pro)
  const resetAt = new Date(profile.usage_reset_at || new Date())
  const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24)

  if (daysSinceReset >= 30) {
    await supabase
      .from('profiles')
      .update({
        usage_mia_generations: 0,
        usage_outfit_generations: 0,
        usage_pieces_analyzed: 0,
        usage_wishlist_generations: 0,
        usage_studio_generations: 0,
        usage_reset_at: now.toISOString(),
      })
      .eq('id', userId)
  }

  const column = usageColumnMap[action] as keyof typeof profile
  const used = daysSinceReset >= 30 ? 0 : ((profile[column] as number) ?? 0)
  const limit = LIMITS[plan][action]
  const allowed = used < limit

  return {
    allowed,
    plan,
    limit,
    used,
    reason: allowed ? undefined : 'rate_limited',
    trialEndsAt: profile.trial_ends_at,
  }
}

/**
 * Resposta padrão para quando o rate limit bloqueia uma rota de IA.
 * - Trial expirado → 403 com code TRIAL_EXPIRED (frontend mostra modal de upgrade)
 * - Limite do plano atingido → 429 com code RATE_LIMITED
 */
export function rateLimitResponse(rateCheck: RateLimitResult): NextResponse {
  const isExpired = rateCheck.plan === 'expired'

  return NextResponse.json(
    {
      error: isExpired
        ? 'Seu período de teste encerrou. Assine o plano Pro para continuar.'
        : `Limite do plano atingido (${rateCheck.used}/${rateCheck.limit}). Faça upgrade para o Pro.`,
      code: isExpired ? 'TRIAL_EXPIRED' : 'RATE_LIMITED',
      upgradeUrl: '/perfil',
    },
    { status: isExpired ? 403 : 429 }
  )
}

export async function incrementUsage(
  userId: string,
  action: ActionType
): Promise<void> {
  const supabase = await createClient()
  const column = usageColumnMap[action]

  await supabase.rpc('increment_usage', {
    user_id: userId,
    column_name: column,
  })
}
