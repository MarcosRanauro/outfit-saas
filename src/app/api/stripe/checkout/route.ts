import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADDON_PACKAGES } from '@/config/plan-limits'

// Mapeamento dos pacotes extras para as variáveis de ambiente do Stripe
const ADDON_PRICE_ENV_KEYS: Record<string, string[]> = {
  addon_10: ['STRIPE_PRICE_ADDON_10', 'STRIPE_PRICE_ID_ADDON_10', 'STRIPE_PRICE_10', 'STRIPE_ADDON_10_PRICE_ID'],
  addon_25: ['STRIPE_PRICE_ADDON_25', 'STRIPE_PRICE_ID_ADDON_25', 'STRIPE_PRICE_25', 'STRIPE_ADDON_25_PRICE_ID'],
  addon_50: ['STRIPE_PRICE_ADDON_50', 'STRIPE_PRICE_ID_ADDON_50', 'STRIPE_PRICE_50', 'STRIPE_ADDON_50_PRICE_ID'],
  addon_100: ['STRIPE_PRICE_ADDON_100', 'STRIPE_PRICE_ID_ADDON_100', 'STRIPE_PRICE_100', 'STRIPE_ADDON_100_PRICE_ID'],
}

function resolveAddonPriceId(packageId: string): string | undefined {
  const upper = packageId.toUpperCase()
  const candidateKeys = [
    `STRIPE_PRICE_${upper}`,
    `NEXT_PUBLIC_STRIPE_PRICE_${upper}`,
    `STRIPE_PRICE_ID_${upper}`,
    `NEXT_PUBLIC_STRIPE_PRICE_ID_${upper}`,
    `STRIPE_${upper}_PRICE_ID`,
    `NEXT_PUBLIC_STRIPE_${upper}_PRICE_ID`,
    `STRIPE_PRICE_${upper.replace('ADDON_', '')}`,
    `NEXT_PUBLIC_STRIPE_PRICE_${upper.replace('ADDON_', '')}`,
  ]

  for (const key of candidateKeys) {
    if (process.env[key]) return process.env[key]
  }

  const keys = ADDON_PRICE_ENV_KEYS[packageId] || []
  for (const key of keys) {
    if (process.env[key]) return process.env[key]
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`]
  }
  return undefined
}

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { package_id, priceId: bodyPriceId, price_id: bodyPrice_id } = body || {}
    const receivedPriceId = bodyPriceId || bodyPrice_id

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, stripe_customer_id, plan')
      .eq('id', user.id)
      .single()

    // Se não for compra de pacote avulso e já for Pro, bloqueia nova assinatura
    if (!package_id && profile?.plan === 'pro') {
      return NextResponse.json(
        { error: 'Você já é Pro!' },
        { status: 400 }
      )
    }

    // 1) Identificar o pacote ou plano e mapear priceId
    let priceId: string | undefined
    let addonPkg = null

    if (package_id) {
      addonPkg = ADDON_PACKAGES.find(p => p.id === package_id)
      if (!addonPkg) {
        return NextResponse.json({ error: 'Pacote de créditos inválido' }, { status: 400 })
      }

      // Verifica se o priceId recebido é uma chave de env ou valor, ou mapeia pelo package_id
      if (receivedPriceId) {
        priceId = process.env[receivedPriceId] || receivedPriceId
      } else {
        priceId = resolveAddonPriceId(addonPkg.id)
      }
    } else {
      // Assinatura Pro padrão
      if (receivedPriceId) {
        priceId = process.env[receivedPriceId] || receivedPriceId
      } else {
        priceId = process.env.STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
      }
    }

    // 3) Logs no console para facilitar o debug local
    console.log('[stripe/checkout] priceId recebido:', priceId, 'ID do usuário:', user.id)

    // 2) Se o preço for undefined ou inválido (ex: '[SENSITIVE]' do Vercel CLI), retornar erro 400 com mensagem clara
    if (!priceId || priceId === '[SENSITIVE]' || !priceId.startsWith('price_')) {
      return NextResponse.json(
        { error: `ID de preço do Stripe inválido ou não configurado (${priceId || 'vazio'}). Configure STRIPE_PRICE_ID no .env.local com um ID válido da Stripe (ex: price_...)` },
        { status: 400 }
      )
    }

    // Cria ou reutiliza customer no Stripe
    let customerId = profile?.stripe_customer_id

    if (customerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(customerId)
        if ('deleted' in existingCustomer && existingCustomer.deleted) {
          customerId = null
        }
      } catch (err: unknown) {
        // Se o customer não existir nesta conta/modo da Stripe, recria
        const stripeError = err as { code?: string; statusCode?: number; message?: string }
        if (
          stripeError?.code === 'resource_missing' ||
          stripeError?.statusCode === 404 ||
          stripeError?.message?.includes('No such customer')
        ) {
          customerId = null
        }
      }
    }

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

    // Fluxo 1: Compra de Pacote Avulso de Fotos de Estúdio
    if (addonPkg) {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/closet?addon=success&photos=${addonPkg.photos}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/closet?addon=cancelled`,
        locale: 'pt-BR',
        metadata: {
          supabase_user_id: user.id,
          addon_package_id: addonPkg.id,
          addon_photos: String(addonPkg.photos),
        },
      })

      return NextResponse.json({ url: session.url })
    }

    // Fluxo 2: Assinatura do Plano Pro
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/perfil?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/perfil?upgrade=cancelled`,
      locale: 'pt-BR',
      metadata: { supabase_user_id: user.id },
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('[stripe/checkout] erro:', error)
    const message = error instanceof Error ? error.message : 'Erro ao criar sessão de pagamento'
    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento', details: message },
      { status: 500 }
    )
  }
}
