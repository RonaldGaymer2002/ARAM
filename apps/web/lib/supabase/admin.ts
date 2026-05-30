import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { supabaseUrl } from './env';

/** Service-role client (server only, bypasses RLS) */
export function createServiceClient() {
  return createSupabaseClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
