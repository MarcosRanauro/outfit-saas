import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, stripe_customer_id, plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'pro') {
      return NextResponse.json(
        { error: 'Você já é Pro!' },
        { status: 400 }
      )
    }

    // Cria ou reutiliza customer no Stripe
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.name || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?upgrade=cancelled`,
      locale: 'pt-BR',
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('[stripe/checkout] erro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento' },
      { status: 500 }
    )
  }
}
