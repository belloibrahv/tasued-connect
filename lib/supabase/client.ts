import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton instance for browser client
let supabaseInstance: SupabaseClient | null = null

/**
 * Creates or returns the singleton Supabase browser client.
 * This ensures we don't create multiple client instances which can cause
 * issues with realtime subscriptions and memory leaks.
 */
export function createClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}

/**
 * Resets the singleton instance (useful for testing or logout scenarios)
 */
export function resetClient(): void {
  supabaseInstance = null
}
