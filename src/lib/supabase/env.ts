import "server-only";

import { isSupabaseAuthConfigured } from "@/lib/supabase/env-public";

export { isSupabaseAuthConfigured };

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
