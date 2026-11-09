import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createAdminClient, getUserEmail } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { paymentFailedEmail } from '@/lib/email-templates'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('[stripe/webhook] assinatura inválida:', error)
    return NextResponse.json(
      { error: 'Webhook inválido' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {

      // Compra avulsa de fotos finalizada com sucesso
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'payment' && session.metadata?.addon_photos && session.metadata?.supabase_user_id) {
          const userId = session.metadata.supabase_user_id
          const photosToAdd = parseInt(session.metadata.addon_photos, 10) || 0
          if (photosToAdd > 0) {
            const { data: p } = await supabase
              .from('profiles')
              .select('extra_ghost_credits')
              .eq('id', userId)
              .single()

            const current = p?.extra_ghost_credits ?? 0
            await supabase
              .from('profiles')
              .update({ extra_ghost_credits: current + photosToAdd })
              .eq('id', userId)
          }
        }
        break
      }

      // Assinatura criada ou renovada com sucesso
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_subscription_id: (invoice as unknown as { subscription: string }).subscription,
              plan_expires_at: new Date(
                (invoice.lines?.data?.[0]?.period?.end ?? 0) * 1000 ||
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            })
            .eq('id', profile.id)
        }
        break
      }

      // Assinatura cancelada ou pagamento falhou
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed': {
        const obj = event.data.object as Stripe.Subscription | Stripe.Invoice
        const customerId = obj.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              plan: 'free',
              stripe_subscription_id: null,
              plan_expires_at: null,
            })
            .eq('id', profile.id)

          if (event.type === 'invoice.payment_failed') {
            const invoice = obj as Stripe.Invoice
            const to = (await getUserEmail(supabase, profile.id)) ?? invoice.customer_email
            if (to) {
              const { subject, html } = paymentFailedEmail(profile.name)
              await sendEmail({ to, subject, html, idempotencyKey: `payment-failed/${invoice.id}` })
            }
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[stripe/webhook] erro ao processar:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
