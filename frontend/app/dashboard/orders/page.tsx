import { createClient } from '@/lib/supabase/server'
import { Suspense, lazy } from 'react'
import DashboardLoading from '../loading'

const OrdersClient = lazy(() => import('./OrdersClient'))

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialOrders: any[] = []
  let products: any[] = []

  if (user) {
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    initialOrders = orders || []

    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)

    products = prods || []
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <OrdersClient initialOrders={initialOrders} products={products} />
    </Suspense>
  )
}
