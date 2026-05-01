import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Simple delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const SYSTEM_PROMPT = `You are a professional packaging optimization AI. Given product dimensions and current packaging data, recommend the most cost-efficient box size, material, and packing method. 
Return structured JSON only. DO NOT wrap the json in markdown code blocks. The response must be parseable by JSON.parse().
Expected JSON format:
{
  "recommended_box": "Box Name (e.g., Medium Box M1)",
  "recommended_material": "Material type",
  "new_cost_usd": 1.25,
  "savings_usd": 0.50,
  "efficiency_score": 95,
  "reasoning": "Brief explanation"
}`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { products } = await req.json()
    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products provided' }, { status: 400 })
    }

    // 1. Insert/Upsert products into the database
    const productsToInsert = products.map((p: any) => ({
      user_id: user.id,
      name: p.name,
      sku: p.product_id, // map product_id to sku or just store it
      weight_kg: parseFloat(p.weight_kg),
      length_cm: parseFloat(p.breadth_cm) || 0, // mapping breadth to length
      width_cm: parseFloat(p.width_cm),
      height_cm: parseFloat(p.height_cm),
      current_box_size: p.current_box_size,
      current_cost_usd: parseFloat(p.current_cost_usd),
      notes: JSON.stringify(p)
    }))

    const { data: insertedProducts, error: dbErr } = await supabase
      .from('products')
      .insert(productsToInsert as any)
      .select()

    if (dbErr) {
      console.error('Error inserting products:', dbErr)
      return NextResponse.json({ error: 'Database error while saving products' }, { status: 500 })
    }

    // 2. Process each product through AI with delay
    const optimizationResults = []
    const failedProducts = []
    let successCount = 0

    for (const product of (insertedProducts || []) as any[]) {
      try {
        await delay(500) // 500ms delay to avoid rate limits

        const aiReq = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: JSON.stringify(product) }
            ],
          })
        })

        if (!aiReq.ok) {
          throw new Error(`OpenRouter API error: ${aiReq.statusText}`)
        }

        const aiData = await aiReq.json()
        let resultJson = aiData.choices[0].message.content
        
        // Clean up formatting if AI returned markdown code blocks
        if (resultJson.startsWith('\`\`\`json')) {
          resultJson = resultJson.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim()
        } else if (resultJson.startsWith('\`\`\`')) {
          resultJson = resultJson.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim()
        }

        const parsedResult = JSON.parse(resultJson)

        // Insert optimization record
        const { error: optErr } = await supabase.from('optimizations').insert({
          user_id: user.id,
          product_id: product.id,
          status: 'completed',
          product_snapshot: product,
          ai_response: parsedResult,
          recommended_box: parsedResult.recommended_box,
          efficiency_score: parsedResult.efficiency_score,
          cost_savings_usd: parsedResult.savings_usd,
          ai_model: 'anthropic/claude-3.5-sonnet',
          completed_at: new Date().toISOString()
        } as any)

        if (optErr) throw optErr

        successCount++
        optimizationResults.push({
          productId: product.id,
          ...parsedResult
        })
      } catch (err: any) {
        console.error(`Error optimizing product ${product.id}:`, err)
        
        // Mark as failed in db
        await supabase.from('optimizations').insert({
          user_id: user.id,
          product_id: product.id,
          status: 'failed',
          product_snapshot: product,
          error_message: err.message || 'Unknown error',
          ai_model: 'anthropic/claude-3.5-sonnet'
        } as any)

        failedProducts.push({
          product_id: product.sku,
          name: product.name,
          error: err.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failedProducts,
      results: optimizationResults
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
