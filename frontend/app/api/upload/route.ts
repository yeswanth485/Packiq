import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { runOptimization } from '@/lib/openrouter'
import type { UploadedProduct } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const ext = file.name.split('.').pop()?.toLowerCase()

    let products: UploadedProduct[] = []

    if (ext === 'csv') {
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      })
      products = result.data.map((row) => ({
        name: row.name ?? row.product_name ?? '',
        sku: row.sku,
        weight_kg: row.weight_kg ? parseFloat(row.weight_kg) : undefined,
        length_cm: row.length_cm ? parseFloat(row.length_cm) : undefined,
        width_cm: row.width_cm ? parseFloat(row.width_cm) : undefined,
        height_cm: row.height_cm ? parseFloat(row.height_cm) : undefined,
        fragile: row.fragile === 'true' || row.fragile === '1',
        category: row.category,
        notes: row.notes,
      }))
    } else if (ext === 'xlsx') {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)
      products = data.map((row) => ({
        name: row.name ?? row.product_name ?? '',
        sku: row.sku,
        weight_kg: row.weight_kg ? parseFloat(row.weight_kg) : undefined,
        length_cm: row.length_cm ? parseFloat(row.length_cm) : undefined,
        width_cm: row.width_cm ? parseFloat(row.width_cm) : undefined,
        height_cm: row.height_cm ? parseFloat(row.height_cm) : undefined,
        fragile: row.fragile === true || row.fragile === 1,
        category: row.category,
        notes: row.notes,
      }))
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use CSV or XLSX.' }, { status: 415 })
    }

    // Filter out rows with no name
    const valid = products.filter((p) => p.name?.trim())
    if (valid.length === 0) return NextResponse.json({ error: 'No valid rows found' }, { status: 422 })

    const rows = valid.map((p) => ({ ...p, user_id: user.id }))
    const { data: dbProducts, error: dbError } = await (supabase as any).from('products').insert(rows).select()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Background Optimization using Claude 3.5 Sonnet
    const { data: boxes } = await supabase.from('box_catalog').select('*')
    
    // We process the first 5 in the response for speed, others could be backgrounded
    const results = await Promise.all(
      (dbProducts ?? []).slice(0, 5).map(async (p: any) => {
        try {
          const opt = await runOptimization({
            productName: p.name,
            weightKg: p.weight_kg || 0,
            lengthCm: p.length_cm || 0,
            widthCm: p.width_cm || 0,
            heightCm: p.height_cm || 0,
            fragile: p.fragile,
            availableBoxes: boxes ?? []
          })

          const { data: optData } = await supabase.from('optimizations').insert({
            user_id: user.id,
            product_id: p.id,
            status: 'completed',
            product_snapshot: p,
            ai_response: opt,
            recommended_box: opt.recommendedBoxName,
            efficiency_score: opt.efficiencyScore,
            space_utilization: opt.spaceUtilization,
            cost_savings_usd: opt.costSavingsUsd,
            co2_savings_kg: opt.co2SavingsKg,
            ai_model: 'anthropic/claude-3.5-sonnet'
          }).select().single()

          // Automatically create an order for the optimization
          if (optData) {
            await supabase.from('orders').insert({
              user_id: user.id,
              product_id: p.id,
              optimization_id: optData.id,
              status: 'pending',
              quantity: 1,
              total_cost_usd: opt.costSavingsUsd // placeholder
            })
          }
          return optData
        } catch (e) {
          console.error('Optimization failed for product', p.id, e)
          return null
        }
      })
    )

    return NextResponse.json({ 
      inserted: dbProducts?.length ?? 0, 
      optimized: results.filter(Boolean).length 
    }, { status: 201 })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
