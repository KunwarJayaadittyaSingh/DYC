import { createClient } from '@supabase/supabase-js'
 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
 
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart the dev server.'
  )
}
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
 