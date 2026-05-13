import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AdminMainLayout({ children }: { children: ReactNode }) {
  let userEmail: string | null = null;

  if (isSupabaseAuthConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/admin/login");
    }
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!profile) {
      redirect("/admin/login?error=unauthorized");
    }
    userEmail = user.email ?? null;
  }

  return (
    <AdminShell databaseEnvReady={isSupabaseConfigured()} authEnabled={isSupabaseAuthConfigured()} userEmail={userEmail}>
      {children}
    </AdminShell>
  );
}
