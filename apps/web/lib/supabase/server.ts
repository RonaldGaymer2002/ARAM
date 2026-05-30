import 'server-only';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAnonKey, supabaseUrl } from './env';

/** Server client (use in Server Components, Route Handlers, middleware) */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        pairs: { name: string; value: string; options: CookieOptions }[]
      ) =>
        pairs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
    },
  });
}
