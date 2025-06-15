
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Use project credentials for the running app (do not erase here!)
const SUPABASE_URL = "https://pijhrmuamnwdgucfnycl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpamhybXVhbW53ZGd1Y2ZueWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNDk1NTAsImV4cCI6MjA2MDgyNTU1MH0.qf5P5eWDSLRmFKxIwtqBygxNAvIFtqGxJN3J4nX7ocE";

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

