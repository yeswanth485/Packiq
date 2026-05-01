import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'
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
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use CSV.' }, { status: 415 })
    }

    // Filter out rows with no name
    const valid = products.filter((p) => p.name?.trim())
    if (valid.length === 0) return NextResponse.json({ error: 'No valid rows found' }, { status: 422 })

    const rows = valid.map((p) => ({ ...p, user_id: user.id }))
    const { data, error } = await (supabase as any).from('products').insert(rows).select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inserted: data?.length ?? 0, products: data }, { status: 201 })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
