import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STANDARD_BOXES = [
  // 1. Extra Small Envelopes & Flap Mailers
  { name: 'Premium XS Flap Enveloper',  length_cm: 15.2, width_cm: 10.2, height_cm:  2.0, material: 'Kraft Paper', cost: 0.12, cost_usd: 0.12 },
  { name: 'Document Kraft Envelope S',  length_cm: 18.0, width_cm: 12.0, height_cm:  2.0, material: 'Kraft Paper', cost: 0.15, cost_usd: 0.15 },
  { name: 'Document Kraft Envelope M',  length_cm: 20.0, width_cm: 15.0, height_cm:  2.5, material: 'Kraft Paper', cost: 0.18, cost_usd: 0.18 },
  
  // 2. Small Envelopes & Bubble Mailers
  { name: 'Eco-Bubble Mailer S',        length_cm: 22.0, width_cm: 16.0, height_cm:  3.0, material: 'Compostable', cost: 0.22, cost_usd: 0.22 },
  { name: 'Eco-Bubble Mailer M',        length_cm: 25.0, width_cm: 18.0, height_cm:  3.5, material: 'Compostable', cost: 0.26, cost_usd: 0.26 },
  { name: 'Eco-Bubble Mailer L',        length_cm: 28.0, width_cm: 20.0, height_cm:  4.0, material: 'Compostable', cost: 0.30, cost_usd: 0.30 },

  // 3. USPS / FedEx Standard Small Boxes
  { name: 'USPS Small Flat Rate Box',   length_cm: 21.9, width_cm: 14.3, height_cm:  4.8, material: 'Corrugated',  cost: 0.35, cost_usd: 0.35 },
  { name: 'Micro Cube Box XS',          length_cm: 10.0, width_cm: 10.0, height_cm: 10.0, material: 'Corrugated',  cost: 0.25, cost_usd: 0.25 },
  { name: 'Mini Cube Box S',            length_cm: 15.0, width_cm: 15.0, height_cm: 15.0, material: 'Corrugated',  cost: 0.32, cost_usd: 0.32 },
  { name: 'Courier Box S1',             length_cm: 20.0, width_cm: 15.0, height_cm: 10.0, material: 'Corrugated',  cost: 0.38, cost_usd: 0.38 },
  { name: 'Courier Box S2',             length_cm: 20.0, width_cm: 20.0, height_cm: 15.0, material: 'Corrugated',  cost: 0.44, cost_usd: 0.44 },

  // 4. Medium Boxes & Packing Cartons
  { name: 'Fulfillment Box M1',         length_cm: 25.0, width_cm: 20.0, height_cm: 15.0, material: 'Corrugated',  cost: 0.48, cost_usd: 0.48 },
  { name: 'Fulfillment Box M2',         length_cm: 30.0, width_cm: 20.0, height_cm: 15.0, material: 'Corrugated',  cost: 0.55, cost_usd: 0.55 },
  { name: 'Fulfillment Box M3',         length_cm: 30.0, width_cm: 25.0, height_cm: 20.0, material: 'Corrugated',  cost: 0.62, cost_usd: 0.62 },
  { name: 'Standard Cube Box M1',       length_cm: 20.0, width_cm: 20.0, height_cm: 20.0, material: 'Corrugated',  cost: 0.46, cost_usd: 0.46 },
  { name: 'Standard Cube Box M2',       length_cm: 25.0, width_cm: 25.0, height_cm: 25.0, material: 'Corrugated',  cost: 0.58, cost_usd: 0.58 },
  { name: 'USPS Medium Flat Rate 1',    length_cm: 28.0, width_cm: 22.0, height_cm: 15.0, material: 'Corrugated',  cost: 0.60, cost_usd: 0.60 },
  { name: 'USPS Medium Flat Rate 2',    length_cm: 35.0, width_cm: 30.0, height_cm: 12.0, material: 'Corrugated',  cost: 0.68, cost_usd: 0.68 },

  // 5. Large Carton Boxes
  { name: 'Enterprise Box L1',          length_cm: 35.0, width_cm: 25.0, height_cm: 20.0, material: 'Corrugated',  cost: 0.72, cost_usd: 0.72 },
  { name: 'Enterprise Box L2',          length_cm: 35.0, width_cm: 30.0, height_cm: 25.0, material: 'Corrugated',  cost: 0.80, cost_usd: 0.80 },
  { name: 'Enterprise Box L3',          length_cm: 40.0, width_cm: 30.0, height_cm: 20.0, material: 'Corrugated',  cost: 0.88, cost_usd: 0.88 },
  { name: 'Master Cube Box L',          length_cm: 30.0, width_cm: 30.0, height_cm: 30.0, material: 'Corrugated',  cost: 0.78, cost_usd: 0.78 },
  { name: 'USPS Large Flat Rate Box',   length_cm: 31.0, width_cm: 31.0, height_cm: 14.0, material: 'Corrugated',  cost: 0.75, cost_usd: 0.75 },
  { name: 'FedEx Standard Large Box',   length_cm: 45.0, width_cm: 35.0, height_cm: 25.0, material: 'Corrugated',  cost: 1.05, cost_usd: 1.05 },

  // 6. Extra Large & Heavy Duty Double-Wall Cartons
  { name: 'Master Box XL1',             length_cm: 45.0, width_cm: 40.0, height_cm: 30.0, material: 'Corrugated',  cost: 1.25, cost_usd: 1.25 },
  { name: 'Master Box XL2',             length_cm: 50.0, width_cm: 40.0, height_cm: 30.0, material: 'Corrugated',  cost: 1.45, cost_usd: 1.45 },
  { name: 'Industrial Cube Box XL',     length_cm: 40.0, width_cm: 40.0, height_cm: 40.0, material: 'Corrugated',  cost: 1.38, cost_usd: 1.38 },
  { name: 'Heavy Duty DW Double-Wall S',length_cm: 30.0, width_cm: 25.0, height_cm: 20.0, material: 'Double Wall', cost: 1.10, cost_usd: 1.10 },
  { name: 'Heavy Duty DW Double-Wall M',length_cm: 40.0, width_cm: 40.0, height_cm: 30.0, material: 'Double Wall', cost: 1.65, cost_usd: 1.65 },
  { name: 'Heavy Duty DW Double-Wall L',length_cm: 50.0, width_cm: 50.0, height_cm: 40.0, material: 'Double Wall', cost: 2.25, cost_usd: 2.25 },
]

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rows = STANDARD_BOXES.map(box => ({ ...box, user_id: user.id }))
    
    // Check if boxes already exist to avoid duplicate inserts if user clicks multiple times
    const { data: existing } = await supabase.from('box_catalog').select('id').eq('user_id', user.id)
    
    if (existing && existing.length > 0) {
       return NextResponse.json({ message: 'Catalog already populated', count: existing.length }, { status: 200 })
    }

    const { data, error } = await (supabase as any)
      .from('box_catalog')
      .insert(rows)
      .select()

    if (error) throw error
    
    return NextResponse.json({ success: true, inserted: data.length, data })
  } catch (err: any) {
    console.error('Seed error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
