import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env-public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/app/admin/login/login-form";
import { signOutAdmin } from "@/app/admin/login/actions";

export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: PageProps) {
  if (!isSupabaseAuthConfigured()) {
    redirect("/admin/dashboard");
  }

  const sp = (await searchParams) ?? {};
  const errorParam = sp.error?.trim();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("users").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (profile) {
      redirect("/admin/dashboard");
    }
  }

  const staleSession = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--ink-50)] px-4 py-12 text-[var(--ink-800)]">
      <div className="w-full max-w-md rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--ink-0)] p-8 shadow-[var(--shadow-xs)]">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)]">Genessa internal admin</h1>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink-600)]">Sign in with your operator credentials.</p>

        <div className="mt-8">
          <LoginForm errorParam={errorParam} />
        </div>

        {staleSession && user ? (
          <form action={signOutAdmin} className="mt-6 border-t border-[var(--border)] pt-6">
            <p className="mb-3 text-sm text-[var(--ink-600)]">
              Signed in as {user.email ?? "unknown"} but not linked to an operator row in{" "}
              <code className="rounded bg-[var(--ink-100)] px-1 font-mono text-[12px]">public.users</code>.
            </p>
            <button type="submit" className="text-sm font-medium text-[var(--genessa-blue)] hover:underline">
              Sign out
            </button>
          </form>
        ) : null}

        <p className="mt-8 text-center text-xs text-[var(--ink-500)]">
          <Link href="/" className="text-[var(--genessa-blue)] hover:underline">
            ← Marketing site
          </Link>
        </p>
      </div>
    </div>
  );
}
