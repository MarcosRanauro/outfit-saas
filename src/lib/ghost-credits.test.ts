import { describe, expect, it, vi } from 'vitest'
import { evaluateGhostCredits, deductGhostCredit } from './ghost-credits'

describe('evaluateGhostCredits', () => {
  it('retorna saldo zero se perfil for nulo', () => {
    const status = evaluateGhostCredits(null)
    expect(status.allowed).toBe(false)
    expect(status.totalBalance).toBe(0)
  })

  describe('Trial (plano free)', () => {
    it('permite quando usuário consumiu menos de 3 fotos', () => {
      const profile = {
        plan: 'free',
        usage_studio_generations: 2,
        extra_ghost_credits: 0,
      }
      const status = evaluateGhostCredits(profile)
      expect(status.allowed).toBe(true)
      expect(status.totalBalance).toBe(1)
      expect(status.allowanceRemaining).toBe(1)
    })

    it('bloqueia quando usuário já consumiu 3 fotos e não tem créditos extras', () => {
      const profile = {
        plan: 'free',
        usage_studio_generations: 3,
        extra_ghost_credits: 0,
      }
      const status = evaluateGhostCredits(profile)
      expect(status.allowed).toBe(false)
      expect(status.totalBalance).toBe(0)
      expect(status.errorMessage).toContain('limite de 3 fotos')
    })

    it('permite se consumiu 3 fotos do trial mas possui créditos avulsos', () => {
      const profile = {
        plan: 'free',
        usage_studio_generations: 3,
        extra_ghost_credits: 5,
      }
      const status = evaluateGhostCredits(profile)
      expect(status.allowed).toBe(true)
      expect(status.totalBalance).toBe(5)
      expect(status.allowanceRemaining).toBe(0)
      expect(status.extraCredits).toBe(5)
    })
  })

  describe('Pro (plano pro)', () => {
    it('permite dentro da cota mensal de 20 fotos', () => {
      const profile = {
        plan: 'pro',
        usage_studio_generations: 12,
        extra_ghost_credits: 0,
        usage_reset_at: new Date().toISOString(),
      }
      const status = evaluateGhostCredits(profile)
      expect(status.allowed).toBe(true)
      expect(status.totalBalance).toBe(8)
      expect(status.allowanceRemaining).toBe(8)
    })

    it('bloqueia quando consumiu as 20 fotos mensais e não tem créditos avulsos', () => {
      const profile = {
        plan: 'pro',
        usage_studio_generations: 20,
        extra_ghost_credits: 0,
        usage_reset_at: new Date().toISOString(),
      }
      const status = evaluateGhostCredits(profile)
      expect(status.allowed).toBe(false)
      expect(status.totalBalance).toBe(0)
      expect(status.errorMessage).toContain('20 fotos mensais utilizadas')
    })

    it('permite quando consumiu 20 fotos mensais mas possui créditos avulsos (extra_ghost_credits)', () => {
      const profile = {
        plan: 'pro',
        usage_studio_generations: 20,
        extra_ghost_credits: 10,
        usage_reset_at: new Date().toISOString(),
      }
      const status = evaluateGhostCredits(profile)
      expect(status.allowed).toBe(true)
      expect(status.totalBalance).toBe(10)
      expect(status.allowanceRemaining).toBe(0)
      expect(status.extraCredits).toBe(10)
    })

    it('renova as 20 fotos se passaram 30 dias desde o reset', () => {
      const pastDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
      const profile = {
        plan: 'pro',
        usage_studio_generations: 20,
        extra_ghost_credits: 0,
        usage_reset_at: pastDate,
      }
      const status = evaluateGhostCredits(profile)
      expect(status.allowed).toBe(true)
      expect(status.needsReset).toBe(true)
      expect(status.totalBalance).toBe(20)
    })
  })
})

describe('deductGhostCredit', () => {
  it('incrementa usage_studio_generations quando consome da cota', async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const supabase = { from: () => ({ update }) } as any

    const profile = { plan: 'free', usage_studio_generations: 1, extra_ghost_credits: 0 }
    const status = evaluateGhostCredits(profile)

    const res = await deductGhostCredit('u1', profile, status, supabase)
    expect(res.remaining_credits).toBe(1)
    expect(update).toHaveBeenCalledWith({ usage_studio_generations: 2 })
  })

  it('subtrai de extra_ghost_credits quando a cota mensal/trial está zerada', async () => {
    const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    const supabase = { from: () => ({ update }) } as any

    const profile = { plan: 'pro', usage_studio_generations: 20, extra_ghost_credits: 5, usage_reset_at: new Date().toISOString() }
    const status = evaluateGhostCredits(profile)

    const res = await deductGhostCredit('u1', profile, status, supabase)
    expect(res.remaining_credits).toBe(4)
    expect(update).toHaveBeenCalledWith({ extra_ghost_credits: 4 })
  })
})
