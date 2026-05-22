// Browser client — for "use client" components
export { createSupabaseBrowserClient as createClient } from "@/lib/supabase/client";

// Server client — for Server Components and Route Handlers only
export { createSupabaseServerClient as createServerClient } from "@/lib/supabase/server";
