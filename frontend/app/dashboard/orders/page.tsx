import { createClient } from '@/lib/supabase/server'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  const [ordersResponse, productsResponse] = await Promise.all([
    supabase.from('orders').select('*, product:product_id(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('products').select('id, name, sku').eq('user_id', user.id)
  ])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Orders</h1>
        <p className="text-gray-400 text-sm">Manage packaging orders and track their shipment status.</p>
      </div>

      <OrdersClient 
        initialOrders={ordersResponse.data || []} 
        products={productsResponse.data || []} 
      />
    </div>
  )
}
