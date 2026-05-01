import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-for-build.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key_for_build'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are missing! Check your Vercel settings.')
  }

  return createBrowserClient<Database>(url, anonKey, {
    global: {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    }
  })
}
