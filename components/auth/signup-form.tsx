"use client";

import * as React from "react";
import Link from "next/link";
import { IdCard, User, Lock, Phone, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { formatCnic, cnicSchema } from "@/lib/validation/cnic";
import { createClient } from "@/lib/supabase/client";
import { signUpPublic } from "@/app/(auth)/sign-up/actions";

export function SignUpForm() {
  const [cnic, setCnic] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [agree, setAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!cnicSchema.safeParse(cnic).success) return setError("Enter a valid 13-digit CNIC");
    if (password !== confirm) return setError("Passwords do not match");
    if (!agree) return setError("Please accept the terms to continue");

    setLoading(true);
    const res = await signUpPublic({
      cnic,
      username,
      full_name: fullName,
      age: age ? Number(age) : null,
      gender: gender || undefined,
      contact: contact || undefined,
      password,
    });
    if (!res.ok || !res.email) {
      setLoading(false);
      return setError(res.error ?? "Could not create your account.");
    }
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: res.email,
      password,
    });
    setLoading(false);
    if (signInErr) window.location.href = "/login";
    else window.location.href = "/";
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary-soft to-transparent" />
      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <Logo withWordmark />
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-5 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-[26px] font-bold text-foreground">Create your account</h1>
          <p className="mt-1.5 text-[15px] text-muted">Register as a patient with your CNIC</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cnic">CNIC Number</Label>
            <Input id="cnic" inputMode="numeric" placeholder="12345-1234567-1" value={cnic} onChange={(e) => setCnic(formatCnic(e.target.value))} icon={<IdCard size={18} />} />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="johndoe123" value={username} onChange={(e) => setUsername(e.target.value)} icon={<User size={18} />} />
          </div>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" inputMode="numeric" placeholder="Years" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="contact">Contact number</Label>
            <Input id="contact" placeholder="0300-1234567" value={contact} onChange={(e) => setContact(e.target.value)} icon={<Phone size={18} />} />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} icon={<Lock size={18} />} />
          </div>

          <label className="flex items-start gap-2.5 text-sm text-muted">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--primary)]" />
            <span>I agree to the Terms of Service and Privacy Policy of Greenstar Telehealth.</span>
          </label>

          {error && (
            <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
            {!loading && <ArrowRight size={18} />}
          </Button>
        </form>

        <p className="mt-6 text-center text-[15px] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
        </p>
      </main>
    </div>
  );
}
