"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth/callback" },
      });
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        setError(authError.message);
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
            {done ? (
              <div className="text-center" style={{ padding: "8px 0" }}>
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
                  style={{ background: "var(--genessa-gradient-soft)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--genessa-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    margin: "0 0 10px",
                    color: "var(--fg)",
                  }}
                >
                  Check your email
                </h2>
                <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.55, margin: 0 }}>
                  We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
                </p>
                <Link
                  href="/auth/login"
                  style={{
                    display: "inline-block",
                    marginTop: 24,
                    fontSize: 14,
                    color: "var(--genessa-blue)",
                    fontWeight: 500,
                  }}
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 28 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>Get started</div>
                  <h1
                    style={{
                      fontSize: 26,
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      margin: 0,
                      color: "var(--fg)",
                    }}
                  >
                    Create your account
                  </h1>
                </div>

                <div className="flex flex-col gap-4" style={{ marginBottom: 20 }}>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg)",
                      color: "var(--fg)",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                      width: "100%",
                      fontFamily: "var(--font-geist-sans)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    <span style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 500 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>
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
                    placeholder="At least 8 characters"
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
                    {loading ? "Creating account…" : "Create account"}
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
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    style={{ color: "var(--genessa-blue)", fontWeight: 500 }}
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
