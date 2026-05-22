"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }}>{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          padding: "10px 14px",
          borderRadius: 9,
          border: `1px solid ${focused ? "var(--genessa-blue)" : "var(--border-strong)"}`,
          background: "var(--bg)",
          color: "var(--fg)",
          fontSize: 14,
          outline: "none",
          width: "100%",
          boxShadow: focused ? "var(--shadow-glow)" : "none",
          transition: "border-color 180ms ease, box-shadow 180ms ease",
          fontFamily: "var(--font-geist-sans)",
        }}
      />
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <>
      <Nav />
      <main
        className="flex items-center justify-center px-4"
        style={{ minHeight: "calc(100vh - 140px)" }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div
            className="p-8 rounded-[18px]"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ marginBottom: 28 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Welcome back</div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  margin: 0,
                  color: "var(--fg)",
                }}
              >
                Sign in to Genessa
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <InputField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@company.com"
              />
              <InputField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

              {error && (
                <p style={{ fontSize: 13, color: "var(--score-bad)", margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--genessa-gradient)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "var(--shadow-glow)",
                  marginTop: 4,
                  fontFamily: "var(--font-geist-sans)",
                }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p
              style={{
                marginTop: 20,
                fontSize: 13,
                color: "var(--fg-3)",
                textAlign: "center",
              }}
            >
              {"Don't have an account? "}
              <Link
                href="/auth/signup"
                style={{ color: "var(--genessa-blue)", fontWeight: 500 }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
