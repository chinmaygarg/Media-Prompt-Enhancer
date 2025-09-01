import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// For client components
export const createClientSupabase = () =>
  createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })

// For server components
export const createServerSupabase = () =>
  createServerComponentClient({
    cookies,
    supabaseUrl,
    supabaseKey: supabaseAnonKey,
  })

// For server actions and API routes (with service role)
export const createServiceSupabase = () =>
  createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

// Basic client for general use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)