export type PlanLimits = {
  mia_chat: number
  outfit_generate: number
  pieces_analyze: number
  wishlist_generate: number
  studio_generate: number
}

export const PLAN_LIMITS: Record<'free' | 'pro', PlanLimits> = {
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
