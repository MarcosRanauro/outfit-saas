import { describe, expect, it } from 'vitest'
import { trialReminderWindow } from '@/lib/trial-reminder'

describe('trialReminderWindow', () => {
  it('vai de agora até agora + 3 dias', () => {
    const now = new Date('2026-06-15T12:00:00.000Z')
    expect(trialReminderWindow(now)).toEqual({
      from: '2026-06-15T12:00:00.000Z',
      to: '2026-06-18T12:00:00.000Z',
    })
  })
})
