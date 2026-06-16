import { describe, expect, it } from 'vitest'
import { PLAN_LIMITS } from '@/lib/plan-limits'
import { decideRateLimit, type RateLimitProfile } from '@/lib/rate-limit'

function makeProfile(overrides: Partial<RateLimitProfile> = {}): RateLimitProfile {
  return {
    plan: 'free',
    usage_mia_generations: 0,
    usage_outfit_generations: 0,
    usage_pieces_analyzed: 0,
    usage_wishlist_generations: 0,
    usage_studio_generations: 0,
    usage_model_generations: 0,
    usage_reset_at: '2026-06-01T00:00:00.000Z',
    trial_ends_at: null,
    ...overrides,
  }
}

describe('decideRateLimit', () => {
  const now = new Date('2026-06-15T12:00:00.000Z')
  const trialActiveAt = '2026-06-20T00:00:00.000Z'

  it('trial ativo → allowed:true, plan:trial', () => {
    const profile = makeProfile({ trial_ends_at: trialActiveAt })

    expect(decideRateLimit(profile, 'pieces_analyze', now)).toMatchObject({
      allowed: true,
      plan: 'trial',
      limit: 999,
      used: 0,
    })
  })

  it('trial expirado + plan free → allowed:false, plan:expired, reason:trial_expired', () => {
    const profile = makeProfile({
      plan: 'free',
      trial_ends_at: '2026-06-01T00:00:00.000Z',
    })

    expect(decideRateLimit(profile, 'pieces_analyze', now)).toMatchObject({
      allowed: false,
      plan: 'expired',
      reason: 'trial_expired',
    })
  })

  it('sem profile → allowed:false, reason:no_profile', () => {
    expect(decideRateLimit(null, 'pieces_analyze', now)).toMatchObject({
      allowed: false,
      reason: 'no_profile',
    })
  })

  it('free dentro do limite → allowed:true', () => {
    const profile = makeProfile({
      plan: 'free',
      usage_pieces_analyzed: 2,
      trial_ends_at: null,
    })

    expect(decideRateLimit(profile, 'pieces_analyze', now)).toMatchObject({
      allowed: true,
      plan: 'free',
      used: 2,
      limit: PLAN_LIMITS.free.pieces_analyze,
    })
  })

  it('free no limite exato → allowed:false, reason:rate_limited', () => {
    const profile = makeProfile({
      plan: 'free',
      usage_pieces_analyzed: PLAN_LIMITS.free.pieces_analyze,
      trial_ends_at: null,
    })

    expect(decideRateLimit(profile, 'pieces_analyze', now)).toMatchObject({
      allowed: false,
      reason: 'rate_limited',
      used: PLAN_LIMITS.free.pieces_analyze,
      limit: PLAN_LIMITS.free.pieces_analyze,
    })
  })

  it('pro → allowed:true mesmo com uso alto', () => {
    const profile = makeProfile({
      plan: 'pro',
      usage_pieces_analyzed: 500,
      trial_ends_at: null,
    })

    expect(decideRateLimit(profile, 'pieces_analyze', now)).toMatchObject({
      allowed: true,
      plan: 'pro',
      used: 500,
      limit: PLAN_LIMITS.pro.pieces_analyze,
    })
  })

  it('reset de 30 dias: usage_reset_at há 31 dias → used=0, allowed:true, needsReset:true', () => {
    const profile = makeProfile({
      plan: 'free',
      usage_reset_at: '2026-05-01T00:00:00.000Z',
      usage_pieces_analyzed: PLAN_LIMITS.free.pieces_analyze,
      trial_ends_at: null,
    })
    const resetNow = new Date('2026-06-02T00:00:00.000Z')

    expect(decideRateLimit(profile, 'pieces_analyze', resetNow)).toMatchObject({
      allowed: true,
      used: 0,
      needsReset: true,
    })
  })

  it('borda do reset: no 29º dia o contador antigo ainda bloqueia; no 30º dia a decisão zera used', () => {
    const fixedNow = new Date('2026-06-15T12:00:00.000Z')
    const msDay = 1000 * 60 * 60 * 24
    const atLimit = PLAN_LIMITS.free.pieces_analyze

    const profileDay29 = makeProfile({
      plan: 'free',
      usage_reset_at: new Date(fixedNow.getTime() - 29 * msDay).toISOString(),
      usage_pieces_analyzed: atLimit,
      trial_ends_at: null,
    })

    const profileDay30 = makeProfile({
      plan: 'free',
      usage_reset_at: new Date(fixedNow.getTime() - 30 * msDay).toISOString(),
      usage_pieces_analyzed: atLimit,
      trial_ends_at: null,
    })

    expect(decideRateLimit(profileDay29, 'pieces_analyze', fixedNow)).toMatchObject({
      allowed: false,
      used: atLimit,
      needsReset: false,
    })

    expect(decideRateLimit(profileDay30, 'pieces_analyze', fixedNow)).toMatchObject({
      allowed: true,
      used: 0,
      needsReset: true,
    })

    // Comportamento atual (bug cosmético documentado no CONTEXT): a decisão retorna
    // used=0 no dia 30, mas o UPDATE no banco só ocorre em checkRateLimit — a UI pode
    // ainda exibir o contador antigo até refresh, embora a rota permita a chamada.
  })

  describe('modelo humano (model_generate)', () => {
    it('pro: 9 usos → 10º permitido', () => {
      const profile = makeProfile({
        plan: 'pro',
        usage_model_generations: 9,
      })

      expect(decideRateLimit(profile, 'model_generate', now)).toMatchObject({
        allowed: true,
        plan: 'pro',
        used: 9,
        limit: PLAN_LIMITS.pro.model_generate,
      })
    })

    it('pro: 10 usos → bloqueado', () => {
      const profile = makeProfile({
        plan: 'pro',
        usage_model_generations: PLAN_LIMITS.pro.model_generate,
      })

      expect(decideRateLimit(profile, 'model_generate', now)).toMatchObject({
        allowed: false,
        plan: 'pro',
        reason: 'rate_limited',
        used: 10,
        limit: 10,
      })
    })

    it('trial ativo: 10 usos de modelo → bloqueado', () => {
      const profile = makeProfile({
        plan: 'free',
        trial_ends_at: trialActiveAt,
        usage_model_generations: PLAN_LIMITS.pro.model_generate,
      })

      expect(decideRateLimit(profile, 'model_generate', now)).toMatchObject({
        allowed: false,
        plan: 'trial',
        reason: 'rate_limited',
        used: 10,
        limit: 10,
      })
    })

    it('reset de 30 dias zera usage_model_generations na decisão', () => {
      const profile = makeProfile({
        plan: 'pro',
        usage_reset_at: '2026-05-01T00:00:00.000Z',
        usage_model_generations: PLAN_LIMITS.pro.model_generate,
      })
      const resetNow = new Date('2026-06-02T00:00:00.000Z')

      expect(decideRateLimit(profile, 'model_generate', resetNow)).toMatchObject({
        allowed: true,
        used: 0,
        needsReset: true,
      })
    })
  })

  describe('manequim fantasma (studio_generate)', () => {
    it('pro: 49 usos → permitido', () => {
      const profile = makeProfile({
        plan: 'pro',
        usage_studio_generations: 49,
      })

      expect(decideRateLimit(profile, 'studio_generate', now)).toMatchObject({
        allowed: true,
        plan: 'pro',
        used: 49,
        limit: PLAN_LIMITS.pro.studio_generate,
      })
    })

    it('pro: 50 usos → bloqueado', () => {
      const profile = makeProfile({
        plan: 'pro',
        usage_studio_generations: PLAN_LIMITS.pro.studio_generate,
      })

      expect(decideRateLimit(profile, 'studio_generate', now)).toMatchObject({
        allowed: false,
        plan: 'pro',
        reason: 'rate_limited',
        used: 50,
        limit: 50,
      })
    })

    it('trial ativo: 50 usos de manequim → bloqueado', () => {
      const profile = makeProfile({
        plan: 'free',
        trial_ends_at: trialActiveAt,
        usage_studio_generations: PLAN_LIMITS.pro.studio_generate,
      })

      expect(decideRateLimit(profile, 'studio_generate', now)).toMatchObject({
        allowed: false,
        plan: 'trial',
        reason: 'rate_limited',
        used: 50,
        limit: 50,
      })
    })
  })

  it('trial ativo: mia_chat continua ilimitado', () => {
    const profile = makeProfile({
      plan: 'free',
      trial_ends_at: trialActiveAt,
      usage_mia_generations: 500,
    })

    expect(decideRateLimit(profile, 'mia_chat', now)).toMatchObject({
      allowed: true,
      plan: 'trial',
      limit: 999,
      used: 0,
    })
  })
})
