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
    
    const DEFAULT_CATALOG = [
      { id: 'amz-a1', name: 'Amazon A1', lengthCm: 15.2, widthCm: 10.1, heightCm: 8.5, maxWeightKg: 5, costUsd: 0.45, material: 'Corrugated', ecoCertified: true },
      { id: 'amz-a3', name: 'Amazon A3', lengthCm: 22.8, widthCm: 15.2, heightCm: 10.1, maxWeightKg: 8, costUsd: 0.65, material: 'Corrugated', ecoCertified: true },
      { id: 'amz-a4', name: 'Amazon A4', lengthCm: 30.4, widthCm: 22.8, heightCm: 12.7, maxWeightKg: 10, costUsd: 0.85, material: 'Corrugated', ecoCertified: true },
      { id: 'amz-m1', name: 'Amazon Mailer M1', lengthCm: 25.4, widthCm: 15.2, heightCm: 2.5, maxWeightKg: 2, costUsd: 0.25, material: 'Kraft Bubble', ecoCertified: true },
      { id: 'flp-f1', name: 'Flipkart F1', lengthCm: 18.0, widthCm: 12.0, heightCm: 12.0, maxWeightKg: 5, costUsd: 0.85, material: 'Double Wall', ecoCertified: true },
      { id: 'flp-f2', name: 'Flipkart F2', lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg: 10, costUsd: 1.20, material: 'Double Wall', ecoCertified: true },
      { id: 'flp-s1', name: 'Flipkart S1', lengthCm: 10.0, widthCm: 10.0, heightCm: 10.0, maxWeightKg: 3, costUsd: 0.35, material: 'Corrugated', ecoCertified: true },
      { id: 'zep-b1', name: 'Zepto Grocery Bag', lengthCm: 35.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg: 5, costUsd: 0.15, material: 'Recycled Paper', ecoCertified: true },
      { id: 'zep-b2', name: 'Zepto Large Bag', lengthCm: 45.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 10, costUsd: 0.25, material: 'Recycled Paper', ecoCertified: true },
      { id: 'bli-b1', name: 'Blinkit Paper Bag', lengthCm: 30.0, widthCm: 18.0, heightCm: 12.0, maxWeightKg: 5, costUsd: 0.12, material: 'Kraft Paper', ecoCertified: true },
      { id: 'bli-b2', name: 'Blinkit Cold Bag', lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg: 5, costUsd: 0.55, material: 'Insulated Foil', ecoCertified: true },
      { id: 'fdx-s', name: 'FedEx Small', lengthCm: 31.0, widthCm: 27.6, heightCm: 3.8, maxWeightKg: 3, costUsd: 0.50, material: 'Recycled', ecoCertified: true },
      { id: 'ups-m', name: 'UPS Medium', lengthCm: 30.0, widthCm: 20.0, heightCm: 20.0, maxWeightKg: 10, costUsd: 1.10, material: 'Corrugated', ecoCertified: true }
    ]

    const boxCatalog = boxes && boxes.length > 0 ? (boxes as any[]).map(b => ({
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
    })) : DEFAULT_CATALOG

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
