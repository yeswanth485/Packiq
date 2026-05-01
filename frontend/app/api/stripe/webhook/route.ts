export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[webhook] Invalid signature', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const userId = session.metadata?.supabase_user_id
    const plan = session.metadata?.plan as string

    if (userId && plan) {
      const limit = plan === 'enterprise' ? -1 : 500
      await (supabase as any).from('profiles').update({
        plan,
        stripe_subscription_id: session.subscription as string,
        optimizations_limit: limit,
      }).eq('id', userId)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as any
    const customerId = sub.customer as string
    await (supabase as any).from('profiles').update({
      plan: 'free',
      stripe_subscription_id: null,
      optimizations_limit: 10,
    }).eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ received: true })
}
