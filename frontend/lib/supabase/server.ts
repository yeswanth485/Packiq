import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-for-build.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key_for_build'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('SERVER ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  console.log('Supabase client initialized with URL:', url.substring(0, 10) + '...')

  const cookieStore = await cookies()
  return createServerClient<Database>(url, anonKey, {
    global: {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component — cookies can't be set; middleware handles refresh
        }
      },
    },
  })
}

export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-for-build.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key_for_build'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Missing Supabase service role environment variables')
  }

  const cookieStore = await cookies()
  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll() {},
    },
  })
}
