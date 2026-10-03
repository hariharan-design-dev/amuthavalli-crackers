import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase Client (Service Role)
 *
 * CRITICAL SECURITY INVARIANT:
 * This client utilizes the Supabase Service Role key which bypasses Row Level Security (RLS).
 * It MUST ONLY be imported and executed inside server-side environments (Server Actions / Route Handlers).
 * It MUST NEVER be exported to client components or bundled into browser scripts.
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing server-side Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
