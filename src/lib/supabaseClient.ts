import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (see .env.local.example).',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Trivial connectivity check — pings the Auth health endpoint rather than an
 * app table, since no content tables exist yet (Phase 4), and the PostgREST
 * root endpoint requires the service_role key.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey },
    })
    return response.ok
  } catch (error) {
    console.error('Supabase connectivity check failed:', error)
    return false
  }
}
