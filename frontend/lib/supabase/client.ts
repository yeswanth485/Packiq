import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 🔴 BUG #6 FIX: Throw error instead of using placeholder credentials (only at runtime)
  if (!url || !key) {
    const missing: string[] = []
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!key) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    const errorMsg = `Missing required Supabase environment variables: ${missing.join(', ')}. 
    
Please check your .env.local file and ensure these variables are set:
- NEXT_PUBLIC_SUPABASE_URL (e.g., https://your-project.supabase.co)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g., eyJhbGciOi...)

Learn more: https://supabase.com/docs/reference/javascript/initializing`
    
    console.error('[Supabase Client Error]', errorMsg)
    
    // Create a proxy that throws on any method call instead of throwing immediately
    // This allows the build to succeed while still catching runtime errors
    return new Proxy({}, {
      get: () => {
        throw new Error(errorMsg)
      }
    }) as any
  }

  return createBrowserClient<Database>(url, key)
}
