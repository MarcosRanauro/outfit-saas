import { describe, expect, it } from 'vitest'
import {
  getUsageClass,
  getUsagePercent,
  PLAN_LIMITS,
  TRIAL_LIMITS,
  PRO_LIMITS,
  ADDON_PACKAGES,
} from '@/lib/plan-limits'

describe('getUsagePercent', () => {
  it('plano ilimitado (limit >= 999) usa escala used/50', () => {
    expect(getUsagePercent(25, 999)).toBe(50)
    expect(getUsagePercent(50, 999)).toBe(100)
    expect(getUsagePercent(100, 999)).toBe(100)
  })

  it('limite normal retorna percentual proporcional capado em 100', () => {
    expect(getUsagePercent(2, 10)).toBe(20)
    expect(getUsagePercent(10, 10)).toBe(100)
    expect(getUsagePercent(15, 10)).toBe(100)
  })

  it('limite zero não gera NaN — cap em 100', () => {
    expect(getUsagePercent(0, 0)).toBeNaN()
    expect(getUsagePercent(5, 0)).toBe(100)
  })
})

describe('getUsageClass', () => {
  it('plano ilimitado retorna string vazia', () => {
    expect(getUsageClass(500, 999)).toBe('')
  })

  it('abaixo de 80% retorna vazio', () => {
    expect(getUsageClass(7, 10)).toBe('')
  })

  it('80% ou mais retorna warning', () => {
    expect(getUsageClass(8, 10)).toBe('warning')
  })

  it('100% retorna limit', () => {
    expect(getUsageClass(10, 10)).toBe('limit')
  })

  it('limite zero trata pct como infinito → limit', () => {
    expect(getUsageClass(1, 0)).toBe('limit')
  })
})

describe('PLAN_LIMITS', () => {
  it('pro: model_generate 10/mês, studio_generate (manequim) 50/mês', () => {
    expect(PLAN_LIMITS.pro.model_generate).toBe(10)
    expect(PLAN_LIMITS.pro.studio_generate).toBe(50)
  })

  it('free: model_generate e studio_generate conservadores (0) até reformulação', () => {
    expect(PLAN_LIMITS.free.model_generate).toBe(0)
    expect(PLAN_LIMITS.free.studio_generate).toBe(0)
  })
})

describe('Novos limites de plano (TRIAL, PRO, ADDON_PACKAGES)', () => {
  it('TRIAL: max_pieces = 20, max_ghost_photos = 3, duration_days = 15', () => {
    expect(TRIAL_LIMITS.max_pieces).toBe(20)
    expect(TRIAL_LIMITS.max_ghost_photos).toBe(3)
    expect(TRIAL_LIMITS.duration_days).toBe(15)
  })

  it('PRO: max_pieces = unlimited, monthly_ghost_photos = 20', () => {
    expect(PRO_LIMITS.max_pieces).toBe('unlimited')
    expect(PRO_LIMITS.monthly_ghost_photos).toBe(20)
  })

  it('ADDON_PACKAGES: 4 pacotes com os valores corretos', () => {
    expect(ADDON_PACKAGES).toHaveLength(4)
    expect(ADDON_PACKAGES[0]).toMatchObject({ photos: 10, price: 9.90 })
    expect(ADDON_PACKAGES[1]).toMatchObject({ photos: 25, price: 24.90 })
    expect(ADDON_PACKAGES[2]).toMatchObject({ photos: 50, price: 49.90 })
    expect(ADDON_PACKAGES[3]).toMatchObject({ photos: 100, price: 89.90 })
  })
})
