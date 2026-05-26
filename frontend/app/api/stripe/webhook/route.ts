export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// 🔴 BUG #8 FIX: Enhanced logging for Stripe webhooks
interface WebhookLog {
  timestamp: string
  signature: string
  eventType?: string
  status: 'success' | 'error' | 'rejected'
  errorMessage?: string
  userId?: string
  retryable: boolean
}

const webhookLogs: WebhookLog[] = []

function logWebhook(log: WebhookLog) {
  webhookLogs.push(log)
  // Keep last 100 logs in memory
  if (webhookLogs.length > 100) {
    webhookLogs.shift()
  }
  
  const logMsg = JSON.stringify(log)
  if (log.status === 'error') {
    console.error('[Stripe Webhook Error]', logMsg)
  } else if (log.status === 'rejected') {
    console.warn('[Stripe Webhook Rejected]', logMsg)
  } else {
    console.log('[Stripe Webhook Success]', logMsg)
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  // 🔴 BUG #8 FIX: Validate signature with detailed logging
  let event: Stripe.Event
  try {
    if (!sig) {
      logWebhook({
        timestamp,
        signature: 'MISSING',
        status: 'rejected',
        errorMessage: 'Missing stripe-signature header',
        retryable: false
      })
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      logWebhook({
        timestamp,
        signature: sig.substring(0, 20) + '...',
        status: 'error',
        errorMessage: 'STRIPE_WEBHOOK_SECRET not configured',
        retryable: true
      })
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    
    logWebhook({
      timestamp,
      signature: sig.substring(0, 20) + '...',
      eventType: event.type,
      status: 'success',
      retryable: false
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    
    // 🔴 BUG #8 FIX: Determine if error is retryable
    const retryable = errorMsg.includes('timestamp') || errorMsg.includes('tolerance')
    
    logWebhook({
      timestamp,
      signature: sig.substring(0, 20) + '...',
      status: 'error',
      errorMessage: errorMsg,
      retryable
    })
    
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: retryable ? 503 : 400 }
    )
  }

  const supabase = await createServiceClient()

  try {
    // 🔴 BUG #8 FIX: Handle checkout.session.completed with better error handling
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan as string

      if (userId && plan) {
        const limit = plan === 'enterprise' ? -1 : 500
        const { error } = await (supabase.from('profiles') as any).update({
          plan,
          stripe_subscription_id: session.subscription as string,
          optimizations_limit: limit,
        }).eq('id', userId)

        if (error) {
          console.error('[Stripe Webhook] Failed to update profile', { userId, error: error.message })
          throw error
        }

        console.log('[Stripe Webhook] Profile updated successfully', { userId, plan })
      }
    }

    // 🔴 BUG #8 FIX: Handle customer.subscription.deleted with better error handling
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any
      const customerId = sub.customer as string

      const { error } = await (supabase.from('profiles') as any).update({
        plan: 'free',
        stripe_subscription_id: null,
        optimizations_limit: 10,
      }).eq('stripe_customer_id', customerId)

      if (error) {
        console.error('[Stripe Webhook] Failed to update subscription deletion', { customerId, error: error.message })
        throw error
      }

      console.log('[Stripe Webhook] Subscription deleted successfully', { customerId })
    }

    logWebhook({
      timestamp,
      signature: sig.substring(0, 20) + '...',
      eventType: event.type,
      status: 'success',
      retryable: false
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    
    logWebhook({
      timestamp,
      signature: sig.substring(0, 20) + '...',
      eventType: event.type,
      status: 'error',
      errorMessage: `Failed to process webhook: ${errorMsg}`,
      retryable: true
    })

    // Return 500 so Stripe retries
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// 🔴 BUG #8 FIX: Expose webhook logs for debugging (admin only in production)
export async function GET(request: NextRequest) {
  // In production, add auth check here
  const adminKey = request.headers.get('X-Admin-Key')
  if (process.env.NODE_ENV === 'production' && adminKey !== process.env.ADMIN_DEBUG_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ logs: webhookLogs, count: webhookLogs.length })
}
