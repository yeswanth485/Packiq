const testProducts = [
  { sku:'TEST-001', product_name:'Glass Vase', weight_kg:1.2, length_cm:20, width_cm:15, height_cm:25, fragility:'HIGH' },
  { sku:'TEST-002', product_name:'Book Set', weight_kg:3.5, length_cm:30, width_cm:22, height_cm:18, fragility:'LOW' },
  { sku:'TEST-003', product_name:'Watch', weight_kg:0.3, length_cm:12, width_cm:10, height_cm:8, fragility:'CRITICAL' },
]

async function runTests() {
  const token = process.env.TEST_AUTH_TOKEN
  if (!token) {
    console.error('TEST_AUTH_TOKEN is required')
    process.exit(1)
  }

  console.log('--- Testing Optimize API ---')
  const resOptimize = await fetch('http://localhost:3000/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ products: testProducts, fileName: 'test.csv' })
  })
  const jsonOptimize = await resOptimize.json()
  console.log('Optimize result:', JSON.stringify(jsonOptimize, null, 2))

  console.log('\n--- Testing Orders API ---')
  const resOrders = await fetch('http://localhost:3000/api/orders', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const jsonOrders = await resOrders.json()
  console.log('Orders:', jsonOrders.count, 'rows')
  console.log('First order:', JSON.stringify(jsonOrders.orders?.[0], null, 2))

  console.log('\n--- Testing Results API ---')
  const resResults = await fetch('http://localhost:3000/api/optimization-results', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const jsonResults = await resResults.json()
  console.log('Optimized:', jsonResults.optimized?.length)
  console.log('Not optimized:', jsonResults.notOptimized?.length)
}

runTests().catch(console.error)
