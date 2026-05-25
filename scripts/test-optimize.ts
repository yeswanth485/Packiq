import { createClient } from '@supabase/supabase-js'

async function runTest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const password = process.env.TEST_USER_PASSWORD || 'password123'

  if (!url || !key) {
    console.error('Missing Supabase env vars')
    return
  }

  const supabase = createClient(url, key)

  console.log('Logging in...')
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError) {
    console.error('Auth error:', authError.message)
    return
  }

  const token = authData.session.access_token
  console.log('Got token.')

  const testProducts = [
    { sku:'TEST-001', product_name:'Glass Vase', weight_kg:1.2, length_cm:20, width_cm:15, height_cm:25, fragility:'HIGH' },
    { sku:'TEST-002', product_name:'Book Set', weight_kg:3.5, length_cm:30, width_cm:22, height_cm:18, fragility:'LOW' },
    { sku:'TEST-003', product_name:'Watch', weight_kg:0.3, length_cm:12, width_cm:10, height_cm:8, fragility:'CRITICAL' },
  ]

  console.log('Testing /api/optimize...')
  const optRes = await fetch('http://localhost:3000/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ products: testProducts, fileName: 'test.csv' })
  })
  const optJson = await optRes.json()
  console.log('Optimize result:', JSON.stringify(optJson, null, 2))

  if (optJson.session_id) {
    console.log('Testing /api/orders...')
    const ordRes = await fetch(`http://localhost:3000/api/orders?session_id=${optJson.session_id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const ordJson = await ordRes.json()
    console.log('Orders:', ordJson.count, 'rows')
    console.log('First order:', ordJson.orders?.[0])
  }

  console.log('Testing /api/optimization-results...')
  const resRes = await fetch('http://localhost:3000/api/optimization-results', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const resJson = await resRes.json()
  console.log('Optimized:', resJson.optimized?.length)
  console.log('Not optimized:', resJson.notOptimized?.length)
}

runTest().catch(console.error)
