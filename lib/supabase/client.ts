import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas. ' +
    'Copiá .env.local.example a .env.local y completá los valores.'
  )
}

export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseKey!)
}
