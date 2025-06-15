import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Store Supabase credentials using undefined or environment (for production)
const SUPABASE_URL = ""; // <-- Set this securely from environment/secrets
const SUPABASE_ANON_KEY = ""; // <-- Set this securely from environment/secrets

/**
 * Checks if Supabase is accessible
 * @returns Promise<boolean> True if Supabase is accessible, false otherwise
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('books').select('id').limit(1)
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Supabase connection exception:', err)
    return false
  }
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    db: {
      schema: 'public',
    },
  }
)
