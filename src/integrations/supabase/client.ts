
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Store Supabase credentials in constants - in a real app, these should be environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bwzjbgrvywjtcnhwkglk.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3empiZ3J2eXdqdGNuaHdrZ2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDc3OTIyMjUsImV4cCI6MjAyMzM2ODIyNX0.RPWHvO0NqpJ12f9oIShZfNAlkOmODTjvfA9R_RGqa78'

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
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
})
