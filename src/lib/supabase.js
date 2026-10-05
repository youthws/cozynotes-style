import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// The anon key is designed to be public. Your data is protected by
// the Row Level Security rules in supabase/schema.sql, not by hiding this key.
export const isConfigured = Boolean(url && key)
export const supabase = isConfigured ? createClient(url, key) : null
