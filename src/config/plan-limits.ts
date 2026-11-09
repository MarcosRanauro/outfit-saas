export type PlanLimits = {
  mia_chat: number
  outfit_generate: number
  pieces_analyze: number
  wishlist_generate: number
  studio_generate: number
  model_generate: number
}

export interface TrialLimits {
  max_pieces: number
  max_ghost_photos: number
  duration_days: number
}

export interface ProLimits {
  max_pieces: 'unlimited' | number
  monthly_ghost_photos: number
}

export interface AddonPackage {
  id: string
  photos: number
  price: number
  label: string
}

export const TRIAL_LIMITS: TrialLimits = {
  max_pieces: 20,
  max_ghost_photos: 3,
  duration_days: 15,
}

export const TRIAL = TRIAL_LIMITS

export const PRO_LIMITS: ProLimits = {
  max_pieces: 'unlimited',
  monthly_ghost_photos: 20,
}

export const PRO = PRO_LIMITS

export const ADDON_PACKAGES: readonly AddonPackage[] = [
  { id: 'addon_10', photos: 10, price: 9.90, label: '+10 por R$ 9.90' },
  { id: 'addon_25', photos: 25, price: 24.90, label: '+25 por R$ 24.90' },
  { id: 'addon_50', photos: 50, price: 49.90, label: '+50 por R$ 49.90' },
  { id: 'addon_100', photos: 100, price: 89.90, label: '+100 por R$ 89.90' },
] as const

export const PLAN_LIMITS: Record<'free' | 'pro', PlanLimits> = {
  free: {
    mia_chat: 10,
    outfit_generate: 5,
    pieces_analyze: 3,
    wishlist_generate: 3,
    studio_generate: 0,
    model_generate: 0,
  },
  pro: {
    mia_chat: 999,
    outfit_generate: 999,
    pieces_analyze: 999,
    wishlist_generate: 999,
    studio_generate: 50,
    model_generate: 10,
  },
}

export function getUsagePercent(used: number, limit: number): number {
  if (limit >= 999) return Math.min((used / 50) * 100, 100)
  return Math.min((used / limit) * 100, 100)
}

export function getUsageClass(used: number, limit: number): string {
  if (limit >= 999) return ''
  const pct = used / limit
  if (pct >= 1) return 'limit'
  if (pct >= 0.8) return 'warning'
  return ''
}
