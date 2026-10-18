/** Dias de antecedência do aviso de trial acabando. */
export const TRIAL_REMINDER_DAYS = 3

/** Janela de `trial_ends_at` que deve receber o aviso agora: (agora, agora + 3 dias]. */
export function trialReminderWindow(now: Date): { from: string; to: string } {
  const to = new Date(now.getTime() + TRIAL_REMINDER_DAYS * 24 * 60 * 60 * 1000)
  return { from: now.toISOString(), to: to.toISOString() }
}
