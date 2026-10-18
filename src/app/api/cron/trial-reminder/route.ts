import { NextResponse } from 'next/server'
import { createAdminClient, getUserEmail } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { trialEndingEmail } from '@/lib/email-templates'
import { trialReminderWindow } from '@/lib/trial-reminder'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const { from, to } = trialReminderWindow(new Date())

    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, name, trial_ends_at')
      .eq('plan', 'free')
      .gt('trial_ends_at', from)
      .lte('trial_ends_at', to)
      .is('trial_reminder_sent_at', null)

    if (error) throw error

    let sent = 0
    for (const profile of profiles ?? []) {
      // "claim" atômico antes de enviar, para execuções concorrentes não duplicarem
      const { data: claimed } = await admin
        .from('profiles')
        .update({ trial_reminder_sent_at: new Date().toISOString() })
        .eq('id', profile.id)
        .is('trial_reminder_sent_at', null)
        .select('id')
        .maybeSingle()
      if (!claimed) continue

      const email = await getUserEmail(admin, profile.id)
      const ok = email
        ? await sendEmail({
            to: email,
            ...trialEndingEmail(profile.name, new Date(profile.trial_ends_at!)),
            idempotencyKey: `trial-ending/${profile.id}`,
          })
        : false

      if (ok) sent++
      else await admin.from('profiles').update({ trial_reminder_sent_at: null }).eq('id', profile.id)
    }

    return NextResponse.json({ candidates: profiles?.length ?? 0, sent })
  } catch (error) {
    console.error('[cron/trial-reminder] erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
