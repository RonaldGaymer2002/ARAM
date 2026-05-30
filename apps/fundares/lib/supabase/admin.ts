import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { supabaseServiceKey, supabaseUrl } from './env';

/** Admin client with service role — bypasses RLS. Use only in API routes. */
export function createSupabaseAdmin() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
