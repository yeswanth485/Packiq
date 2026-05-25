import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const adminClient = getAdminClient()
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'No auth' }, { status: 401 })

    const { data: { user }, error: authError } =
      await adminClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    // Build base query
    let query = adminClient
      .from('optimization_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionId) query = query.eq('session_id', sessionId)

    const { data: allResults, error } = await query
    if (error) {
      console.error('Results query error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const optimized = (allResults ?? []).filter(r => r.optimized === true)
    const notOptimized = (allResults ?? []).filter(r => r.optimized === false)

    // Fetch sessions
    let sessionsQuery = adminClient
      .from('optimization_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (sessionId) sessionsQuery = sessionsQuery.eq('id', sessionId)
    const { data: sessions } = await sessionsQuery

    return NextResponse.json({
      optimized: optimized.map(r => ({
        id: r.id,
        sku: r.sku,
        productName: r.product_name,
        weight: Number(r.weight ?? 0),
        dimensions: r.dimensions ?? { l: 0, w: 0, h: 0 },
        fragility: r.fragility ?? 'LOW',
        fragilityScore: Number(r.fragility_score ?? 0),
        baselineBox: r.baseline_box ?? 'N/A',
        optimizedBox: r.optimized_box ?? 'N/A',
        optimizedDims: r.optimized_dims ?? { l: 30, w: 22, h: 18 },
        savings: Number(r.savings ?? 0),
        savingsPercent: Number(r.savings_percent ?? 0),
        shippingCost: Number(r.shipping_cost ?? 0),
        baselineCost: Number(r.baseline_cost ?? 0),
        whyChosen: r.why_chosen ?? 'Best volume utilization match.',
        volumeUtil: Number(r.volume_util ?? 0),
        timestamp: new Date(r.created_at).toLocaleString('en-IN')
      })),
      notOptimized: notOptimized.map(r => ({
        id: r.id,
        sku: r.sku,
        productName: r.product_name,
        reason: r.reason ?? 'Could not optimize',
        reasonCode: r.reason_code ?? 'MISSING_DATA',
        explanation: r.explanation ?? 'Insufficient data for optimization.',
        recommendation: r.recommendation ?? 'Verify product dimensions and resubmit.',
        timestamp: new Date(r.created_at).toLocaleString('en-IN')
      })),
      sessions: sessions ?? [],
      stats: {
        totalProcessed: (allResults ?? []).length,
        totalOptimized: optimized.length,
        totalNotOptimized: notOptimized.length,
        totalSavings: optimized.reduce((s, r) => s + Number(r.savings ?? 0), 0),
        successRate: (allResults ?? []).length > 0
          ? (optimized.length / (allResults ?? []).length) * 100
          : 0
      }
    })
  } catch (err) {
    console.error('Optimization results API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
