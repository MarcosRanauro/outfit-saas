import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteAccount } from '@/lib/delete-account'
import { deleteAccountBodySchema } from '@/lib/api-schemas'
import { parseRequestBody } from '@/lib/parse-request-body'

type AdminClient = ReturnType<typeof createAdminClient>

/** Pastas por usuário em cada bucket (o Storage não tem cascade). */
const STORAGE_PREFIXES = (userId: string) => [
  { bucket: 'pieces', prefix: userId },
  { bucket: 'pieces', prefix: `studio/${userId}` },
  { bucket: 'pieces', prefix: `studio-input/${userId}` },
  { bucket: 'avatars', prefix: userId },
]

async function listFilesRecursive(admin: AdminClient, bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = []
  const pending = [prefix]

  while (pending.length > 0) {
    const dir = pending.pop()!
    let offset = 0

    while (true) {
      const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 1000, offset })
      if (error) throw error
      if (!data || data.length === 0) break

      for (const entry of data) {
        // pastas vêm sem `id`
        if (entry.id) paths.push(`${dir}/${entry.name}`)
        else pending.push(`${dir}/${entry.name}`)
      }

      if (data.length < 1000) break
      offset += 1000
    }
  }

  return paths
}

async function removeUserFiles(admin: AdminClient, userId: string) {
  for (const { bucket, prefix } of STORAGE_PREFIXES(userId)) {
    const paths = await listFilesRecursive(admin, bucket, prefix)

    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + 100))
      if (error) throw error
    }
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const parsed = await parseRequestBody(request, deleteAccountBodySchema)
    if (!parsed.success) return parsed.response

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })
    const admin = createAdminClient()

    await deleteAccount(user.id, profile?.stripe_subscription_id ?? null, {
      cancelSubscription: async (subscriptionId) => {
        try {
          await stripe.subscriptions.cancel(subscriptionId)
        } catch (error) {
          // assinatura já cancelada/inexistente no Stripe não deve travar a exclusão
          if ((error as { code?: string }).code === 'resource_missing') return
          throw error
        }
      },
      removeStorageFiles: (userId) => removeUserFiles(admin, userId),
      deleteAuthUser: async (userId) => {
        const { error } = await admin.auth.admin.deleteUser(userId)
        if (error) throw error
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[account/delete] erro:', error)
    return NextResponse.json({ error: 'Erro ao apagar conta' }, { status: 500 })
  }
}
