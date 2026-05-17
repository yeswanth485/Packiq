import { createClient } from '@/lib/supabase/server'
import ProductsClient from './ProductsClient'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch initial products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="px-4 md:px-0 pb-20">
      <div className="max-w-[1200px] w-full mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Product Catalog</h1>
          <p className="text-gray-500 text-sm font-medium">Manage your saved SKUs to quickly optimize packaging.</p>
        </div>

        <ProductsClient initialProducts={products || []} />
      </div>
    </main>
  )
}
