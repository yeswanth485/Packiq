import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
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

    // Upsert products to the products master table
    const productRows = valid.map((p) => ({
      user_id: user.id,
      sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: p.name,
      length_cm: p.length_cm || 0,
      width_cm: p.width_cm || 0,
      height_cm: p.height_cm || 0,
      weight_kg: p.weight_kg || 0,
      category: p.category || 'general',
      updated_at: new Date().toISOString(),
    }))

    const CHUNK = 100
    for (let i = 0; i < productRows.length; i += CHUNK) {
      await (supabase as any).from('products').upsert(
        productRows.slice(i, i + CHUNK),
        { onConflict: 'user_id,sku', ignoreDuplicates: false }
      )
    }

    return NextResponse.json({ 
      inserted: valid.length,
      message: `${valid.length} products uploaded. Go to Optimization tab to run AI packaging optimization.`
    }, { status: 201 })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
