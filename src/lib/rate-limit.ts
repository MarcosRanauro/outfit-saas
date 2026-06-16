import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type PlanLimits } from '@/lib/plan-limits'

type ActionType = keyof PlanLimits

/** Ações com teto mensal mesmo durante trial ativo (modelo humano + manequim). */
export const TRIAL_LIMITED_ACTIONS: ActionType[] = ['model_generate', 'studio_generate']

export type RateLimitResult = {
  allowed: boolean
  plan: 'free' | 'pro' | 'trial' | 'expired'
  limit: number
  used: number
  reason?: 'trial_expired' | 'rate_limited' | 'no_profile'
  trialEndsAt?: string | null
}

export type RateLimitProfile = {
  plan: string | null
  usage_mia_generations: number | null
  usage_outfit_generations: number | null
  usage_pieces_analyzed: number | null
  usage_wishlist_generations: number | null
  usage_studio_generations: number | null
  usage_model_generations: number | null
  usage_reset_at: string | null
  trial_ends_at: string | null
}

export type DecideRateLimitResult = RateLimitResult & { needsReset: boolean }

const usageColumnMap: Record<ActionType, keyof RateLimitProfile> = {
  mia_chat: 'usage_mia_generations',
  outfit_generate: 'usage_outfit_generations',
  pieces_analyze: 'usage_pieces_analyzed',
  wishlist_generate: 'usage_wishlist_generations',
  studio_generate: 'usage_studio_generations',
  model_generate: 'usage_model_generations',
}

function evaluateUsageLimit(
  profile: RateLimitProfile,
  action: ActionType,
  plan: 'free' | 'pro',
  now: Date
): Pick<DecideRateLimitResult, 'allowed' | 'limit' | 'used' | 'needsReset' | 'reason'> {
  const resetAt = new Date(profile.usage_reset_at || new Date())
  const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24)
  const needsReset = daysSinceReset >= 30

  const column = usageColumnMap[action]
  const used = needsReset ? 0 : ((profile[column] as number) ?? 0)
  const limit = PLAN_LIMITS[plan][action]
  const allowed = used < limit

  return {
    allowed,
    limit,
    used,
    reason: allowed ? undefined : 'rate_limited',
    needsReset,
  }
}

export function decideRateLimit(
  profile: RateLimitProfile | null,
  action: ActionType,
  now: Date
): DecideRateLimitResult {
  if (!profile) {
    return { allowed: false, plan: 'free', limit: 0, used: 0, reason: 'no_profile', needsReset: false }
  }

  const plan = (profile.plan || 'free') as 'free' | 'pro'
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const trialActive = trialEndsAt !== null && trialEndsAt > now
  const trialExpired = trialEndsAt !== null && trialEndsAt <= now

  if (trialActive) {
    if (!TRIAL_LIMITED_ACTIONS.includes(action)) {
      return {
        allowed: true,
        plan: 'trial',
        limit: 999,
        used: 0,
        trialEndsAt: profile.trial_ends_at,
        needsReset: false,
      }
    }

    const usage = evaluateUsageLimit(profile, action, 'pro', now)
    return {
      ...usage,
      plan: 'trial',
      trialEndsAt: profile.trial_ends_at,
    }
  }

  if (trialExpired && plan === 'free') {
    return {
      allowed: false,
      plan: 'expired',
      reason: 'trial_expired',
      limit: 0,
      used: 0,
      trialEndsAt: profile.trial_ends_at,
      needsReset: false,
    }
  }

  const usage = evaluateUsageLimit(profile, action, plan, now)
  return {
    ...usage,
    plan,
    trialEndsAt: profile.trial_ends_at,
  }
}

export async function checkRateLimit(
  userId: string,
  action: ActionType
): Promise<RateLimitResult> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'plan, usage_mia_generations, usage_outfit_generations, usage_pieces_analyzed, usage_wishlist_generations, usage_studio_generations, usage_model_generations, usage_reset_at, trial_ends_at'
    )
    .eq('id', userId)
    .single()

  const now = new Date()
  const decision = decideRateLimit(profile, action, now)

  if (decision.needsReset && profile) {
    await supabase
      .from('profiles')
      .update({
        usage_mia_generations: 0,
        usage_outfit_generations: 0,
        usage_pieces_analyzed: 0,
        usage_wishlist_generations: 0,
        usage_studio_generations: 0,
        usage_model_generations: 0,
        usage_reset_at: now.toISOString(),
      })
      .eq('id', userId)
  }

  return {
    allowed: decision.allowed,
    plan: decision.plan,
    limit: decision.limit,
    used: decision.used,
    reason: decision.reason,
    trialEndsAt: decision.trialEndsAt,
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
