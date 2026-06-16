import { describe, expect, it } from 'vitest'
import { getUsageClass, getUsagePercent, PLAN_LIMITS } from '@/lib/plan-limits'

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
