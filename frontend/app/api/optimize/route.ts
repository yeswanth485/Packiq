import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDimensions } from '@/lib/utils/parser'
import { runOptimization, LIGHTWEIGHT_MODEL, FREE_MODEL } from '@/lib/openrouter'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { products } = await req.json()
    if (!products || !Array.isArray(products)) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

    // Fetch available boxes once
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

    // Parallel processing with SKU/Dimension caching
    const processProduct = async (p: any) => {
      try {
        const prodDimStr = p['product L*W*H'] || p['product_l*w*h']
        const boxDimStr = p['box L*W*H'] || p['box_l*w*h']
        const price = parseFloat(p['price'] || p['box_price'])
        const prodDim = parseDimensions(prodDimStr)

        if (!prodDim || isNaN(price)) throw new Error('Invalid numeric data')

        // 1. CHECK CACHE (Search for identical product dimensions and available boxes)
        const { data: cached }: { data: any } = await supabase
          .from('optimizations')
          .select('*')
          .eq('product_snapshot->product L*W*H', prodDimStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (cached && cached.ai_response) {
          return {
            product_id: p['product_id'] || p['product id'],
            product_name: p['product_name'] || p['product name'],
            original_box: boxDimStr,
            optimized_box: cached.recommended_box,
            cost_before: price,
            cost_after: price - cached.cost_savings_usd,
            savings: cached.cost_savings_usd,
            reasoning: cached.ai_response.reasoning,
            cached: true
          }
        }

        // 2. RUN AI OPTIMIZATION (Try Claude Haiku, then Gemini Free)
        let aiResult
        try {
          aiResult = await runOptimization({
            productName: p['product_name'] || p['product name'] || 'Unknown',
            weightKg: 0,
            lengthCm: prodDim.l,
            widthCm: prodDim.w,
            heightCm: prodDim.h,
            fragile: false,
            availableBoxes: boxCatalog
          }, LIGHTWEIGHT_MODEL)
        } catch (err) {
          console.warn('Claude failed, falling back to Gemini Free:', err)
          aiResult = await runOptimization({
            productName: p['product_name'] || p['product name'] || 'Unknown',
            weightKg: 0,
            lengthCm: prodDim.l,
            widthCm: prodDim.w,
            heightCm: prodDim.h,
            fragile: false,
            availableBoxes: boxCatalog
          }, FREE_MODEL)
        }

        // 3. STORE IN DB
        await supabase.from('optimizations').insert({
          user_id: user.id,
          status: 'completed',
          product_snapshot: p,
          ai_response: aiResult,
          recommended_box: aiResult.recommendedBoxName,
          cost_savings_usd: aiResult.costSavingsUsd,
          efficiency_score: aiResult.efficiencyScore,
          space_utilization: aiResult.spaceUtilization,
          ai_model: aiResult.model || LIGHTWEIGHT_MODEL
        } as any)

        return {
          product_id: p['product_id'] || p['product id'],
          product_name: p['product_name'] || p['product name'],
          original_box: boxDimStr,
          optimized_box: aiResult.recommendedBoxName,
          cost_before: price,
          cost_after: price - aiResult.costSavingsUsd,
          savings: aiResult.costSavingsUsd,
          reasoning: aiResult.reasoning,
          cached: false
        }
      } catch (err: any) {
        console.error('Processing error:', err)
        return { product_id: p['product_id'] || p['product id'], error: err.message, status: 'error' }
      }
    }

    // Process all products in the batch in parallel
    const results = await Promise.all(products.map(processProduct))
    
    return NextResponse.json({ 
      success: true, 
      results: results.filter(r => !r.error), 
      failed: results.filter(r => r.error),
      count: results.length 
    })
  } catch (error: any) {
    console.error('Optimize route error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
