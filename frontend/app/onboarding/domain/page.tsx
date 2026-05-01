'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function DomainSetup() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ company_domain: domain }).eq('id', user.id)
      router.push('/onboarding/employees')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl"
      >
        <div className="mb-8">
          <div className="flex gap-1 mb-4">
            <div className="h-1 flex-1 bg-blue-500 rounded-full" />
            <div className="h-1 flex-1 bg-blue-500 rounded-full" />
            <div className="h-1 flex-1 bg-zinc-800 rounded-full" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Digital Identity</h1>
          <p className="text-zinc-400">Where can your customers find you online?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Company Domain</label>
            <div className="flex bg-black border border-zinc-800 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50">
              <span className="p-3 text-zinc-600 bg-zinc-950 border-r border-zinc-800">https://</span>
              <input
                type="text"
                required
                className="flex-1 bg-transparent p-3 text-white focus:outline-none"
                placeholder="acme.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
