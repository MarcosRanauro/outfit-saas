import { TRIAL_LIMITS, PRO_LIMITS } from '@/config/plan-limits'
import type { SupabaseClient } from '@supabase/supabase-js'

export type GhostCreditProfile = {
  id?: string
  plan: string | null
  trial_ends_at?: string | null
  usage_studio_generations: number | null
  usage_reset_at?: string | null
  extra_ghost_credits?: number | null
}

export type GhostCreditStatus = {
  allowed: boolean
  isPro: boolean
  totalBalance: number
  allowanceRemaining: number
  extraCredits: number
  needsReset: boolean
  errorMessage?: string
}

/**
 * Avalia o saldo de fotos do Manequim Fantasma (Photoroom).
 * - Trial: até 3 fotos (+ eventuais créditos avulsos)
 * - Pro: 20 fotos mensais renovadas a cada 30 dias + créditos avulsos (extra_ghost_credits)
 */
export function evaluateGhostCredits(
  profile: GhostCreditProfile | null,
  now: Date = new Date()
): GhostCreditStatus {
  if (!profile) {
    return {
      allowed: false,
      isPro: false,
      totalBalance: 0,
      allowanceRemaining: 0,
      extraCredits: 0,
      needsReset: false,
      errorMessage: 'Perfil não encontrado.',
    }
  }

  const isPro = profile.plan === 'pro'
  const extraCredits = Math.max(0, profile.extra_ghost_credits ?? 0)

  // Checagem de ciclo de 30 dias para renovação da cota mensal do Pro
  let needsReset = false
  if (isPro && profile.usage_reset_at) {
    const resetAt = new Date(profile.usage_reset_at)
    const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24)
    needsReset = daysSinceReset >= 30
  }

  const used = needsReset ? 0 : Math.max(0, profile.usage_studio_generations ?? 0)

  if (isPro) {
    const monthlyLimit = PRO_LIMITS.monthly_ghost_photos // 20
    const allowanceRemaining = Math.max(0, monthlyLimit - used)
    const totalBalance = allowanceRemaining + extraCredits
    const allowed = totalBalance > 0

    return {
      allowed,
      isPro: true,
      totalBalance,
      allowanceRemaining,
      extraCredits,
      needsReset,
      errorMessage: allowed
        ? undefined
        : 'Seus créditos de Manequim Fantasma acabaram (20 fotos mensais utilizadas e sem créditos avulsos). Adquira um pacote de fotos para continuar.',
    }
  }

  // Usuário no Trial (ou plano gratuito)
  const trialLimit = TRIAL_LIMITS.max_ghost_photos // 3
  const allowanceRemaining = Math.max(0, trialLimit - used)
  const totalBalance = allowanceRemaining + extraCredits
  const allowed = totalBalance > 0

  return {
    allowed,
    isPro: false,
    totalBalance,
    allowanceRemaining,
    extraCredits,
    needsReset: false,
    errorMessage: allowed
      ? undefined
      : `Você atingiu o limite de ${trialLimit} fotos do Manequim Fantasma no período de teste. Faça upgrade para o plano Pro ou adquira um pacote de créditos para continuar.`,
  }
}

/**
 * Deduz 1 crédito após o processamento com sucesso:
 * - Se houver saldo na cota periódica (Trial ou Pro mensal), incrementa usage_studio_generations (+1).
 * - Se a cota periódica estiver zerada mas houver extra_ghost_credits, subtrai 1 de extra_ghost_credits.
 */
export async function deductGhostCredit(
  userId: string,
  profile: GhostCreditProfile,
  status: GhostCreditStatus,
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<{ remaining_credits: number }> {
  // 1) Se precisa resetar a data de renovação do Pro
  if (status.needsReset) {
    await supabase
      .from('profiles')
      .update({
        usage_studio_generations: 1,
        usage_reset_at: now.toISOString(),
      })
      .eq('id', userId)

    return { remaining_credits: Math.max(0, status.totalBalance - 1) }
  }

  // 2) Se tem saldo da cota (Trial: 3 fotos / Pro: 20 fotos mensais)
  if (status.allowanceRemaining > 0) {
    const currentUsage = profile.usage_studio_generations ?? 0
    await supabase
      .from('profiles')
      .update({
        usage_studio_generations: currentUsage + 1,
      })
      .eq('id', userId)

    return { remaining_credits: Math.max(0, status.totalBalance - 1) }
  }

  // 3) Se a cota esgotou, deduz dos créditos avulsos acumulados (extra_ghost_credits)
  if (status.extraCredits > 0) {
    const newExtra = Math.max(0, status.extraCredits - 1)
    await supabase
      .from('profiles')
      .update({
        extra_ghost_credits: newExtra,
      })
      .eq('id', userId)

    return { remaining_credits: Math.max(0, status.totalBalance - 1) }
  }

  return { remaining_credits: 0 }
}
