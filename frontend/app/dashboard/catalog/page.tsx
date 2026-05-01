import { createClient } from '@/lib/supabase/server'
import CatalogClient from './CatalogClient'

export default async function CatalogPage() {
  const supabase = await createClient()
  
  // Box catalog is public read, anyone can view it based on RLS policy
  const { data: boxes, error } = await supabase
    .from('box_catalog')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching box catalog:', error)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Box Catalog</h1>
        <p className="text-gray-400 text-sm">Browse and manage available packaging boxes.</p>
      </div>

      <CatalogClient initialBoxes={boxes || []} />
    </div>
  )
}
