import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDimensions } from '@/lib/utils/parser'
import { runOptimization, DEFAULT_MODEL } from '@/lib/openrouter'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Per-user rate limiting: max 30 requests per minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { count, error: countErr } = await supabase
      .from('optimizations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('created_at', oneMinuteAgo)

    if (countErr) console.error('Rate limit check error:', countErr)
    if (count !== null && count >= 30) {
      return NextResponse.json({ 
        error: 'Our AI is processing a high volume of requests, retrying...',
        retryAfter: 60 
      }, { status: 429 })
    }

    const { products } = await req.json()
    if (!products || !Array.isArray(products)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    const results = []
    const failed = []

    // Fetch available boxes once for the entire batch
    const { data: boxes } = await supabase.from('box_catalog').select('*')
    const boxCatalog = (boxes as any[] || []).map(b => ({
      id: b.id,
      name: b.name,
      sku: b.sku,
      lengthCm: b.length_cm,
      widthCm: b.width_cm,
      heightCm: b.height_cm,
      maxWeightKg: b.max_weight_kg,
      costUsd: b.cost_usd,
      material: b.material,
      ecoCertified: b.eco_certified
    }))

    for (const p of products) {
      try {
        const prodDim = parseDimensions(p['product L*W*H'])
        const boxDim = parseDimensions(p['current used box L*W*H'])
        const price = parseFloat(p['box price'])

        if (!prodDim || !boxDim || isNaN(price)) throw new Error('Invalid numeric data')

        const aiResult = await runOptimization({
          productName: p['product id'] || 'Unknown Product',
          weightKg: 0, // Not provided in this legacy format, using 0
          lengthCm: prodDim.l,
          widthCm: prodDim.w,
          heightCm: prodDim.h,
          fragile: false,
          availableBoxes: boxCatalog
        })

        // Store result in DB
        const { error: dbErr } = await supabase.from('optimizations').insert({
          user_id: user.id,
          status: 'completed',
          product_snapshot: p,
          ai_response: aiResult,
          recommended_box: aiResult.recommendedBoxName,
          cost_savings_usd: aiResult.costSavingsUsd,
          efficiency_score: aiResult.efficiencyScore,
          space_utilization: aiResult.spaceUtilization,
          ai_model: DEFAULT_MODEL
        } as any)

        if (dbErr) throw dbErr

        // Format for legacy frontend compatibility
        results.push({
          product_id: p['product id'],
          original_box: p['current used box L*W*H'],
          optimized_box: aiResult.recommendedBoxName,
          cost_before: price,
          cost_after: price - aiResult.costSavingsUsd,
          savings: aiResult.costSavingsUsd,
          reasoning: aiResult.reasoning
        })
      } catch (err: any) {
        console.error('Optimization step failed:', err)
        failed.push({ id: p['product id'], error: err.message })
      }
    }

    return NextResponse.json({ success: true, results, failed, count: results.length })
  } catch (error: any) {
    console.error('Optimize route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
