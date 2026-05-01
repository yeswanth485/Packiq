import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error('Supabase environment variables are missing! Check your Vercel settings.')
  }

  return createBrowserClient<Database>(url!, anonKey!)
}
