"use client";

import * as React from "react";
import Link from "next/link";
import { User, Lock, Eye, EyeOff, IdCard, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatCnic, cnicSchema } from "@/lib/validation/cnic";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [mode, setMode] = React.useState<"staff" | "patient">("staff");
  const [showPw, setShowPw] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [cnic, setCnic] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isPatient = mode === "patient";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let email: string;
    if (isPatient) {
      const parsed = cnicSchema.safeParse(cnic);
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }
      email = `cnic+${parsed.data}@greenstar.local`;
    } else {
      if (!username.trim()) {
        setError("Enter your email");
        return;
      }
      email = username.trim();
    }
    if (!password) {
      setError("Enter your password");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("Incorrect credentials. Please check and try again.");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary-soft to-transparent"
      />

      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <Logo withWordmark />
        <ThemeToggle />
      </header>

      <main className="gs-rise relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8">
        <div className="mb-7 text-center">
          <h1 className="text-[28px] font-bold text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            Sign in to continue to Greenstar
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="gs-rise">
            {isPatient ? (
              <div>
                <Label htmlFor="cnic">CNIC Number</Label>
                <Input
                  id="cnic"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="12345-1234567-1"
                  value={cnic}
                  onChange={(e) => setCnic(formatCnic(e.target.value))}
                  icon={<IdCard size={18} />}
                />
                <p className="mt-1.5 text-xs text-muted-2">Enter your 13-digit CNIC</p>
              </div>
            ) : (
              <div>
                <Label htmlFor="username">Email</Label>
                <Input
                  id="username"
                  type="email"
                  autoComplete="username"
                  placeholder="you@greenstar.health"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  icon={<User size={18} />}
                />
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="password" className="mb-0">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="text-muted hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          {error && (
            <p className="rounded-xl bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
            {!loading && <ArrowRight size={18} />}
          </Button>
        </form>

        {/* Subtle mode switch — no upfront role picker */}
        <div className="mt-6 rounded-xl border border-border bg-surface-2/50 p-1.5 text-center text-sm">
          {isPatient ? (
            <span className="text-muted">
              Staff member?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("staff");
                  setError(null);
                }}
                className="font-semibold text-primary hover:underline"
              >
                Sign in with email
              </button>
            </span>
          ) : (
            <span className="text-muted">
              Patient?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("patient");
                  setError(null);
                }}
                className="font-semibold text-primary hover:underline"
              >
                Sign in with CNIC
              </button>
            </span>
          )}
        </div>

        {isPatient && (
          <p className="mt-5 text-center text-[15px] text-muted">
            New patient?{" "}
            <Link href="/sign-up" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        )}

        <p className="mt-8 text-center text-xs text-muted-2">
          Staff accounts are created by your administrator.
        </p>
      </main>
    </div>
  );
}
