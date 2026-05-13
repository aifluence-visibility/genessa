"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ errorParam }: { errorParam?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errorParam === "unauthorized"
      ? "This sign-in is not linked to a Genessa operator profile. Ask an admin to set public.users.auth_user_id for your account, or sign out and use a different account."
      : null,
  );
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signErr) {
          setError(signErr.message);
          return;
        }
        router.refresh();
        router.push("/admin/dashboard");
      } catch {
        setError("Sign-in failed.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
          className="mt-1 w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)] outline-none ring-[var(--genessa-blue)] focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-[var(--ink-500)]">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
          className="mt-1 w-full rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--ink-0)] px-3 py-2 text-sm text-[var(--ink-900)] outline-none ring-[var(--genessa-blue)] focus:ring-2"
        />
      </div>
      {error ? (
        <p className="text-sm leading-relaxed text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center rounded-[var(--r-md)] bg-[var(--ink-900)] text-sm font-medium text-[var(--ink-0)] hover:opacity-95 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
