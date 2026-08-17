"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RefreshCw, Copy, Check, ArrowLeft, UserPlus } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { createStaffUser } from "@/app/admin/users/actions";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  // Length varies by call index is not needed; build a 10-char password.
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out + "@1";
}

export function CreateUserForm() {
  const router = useRouter();
  const [role, setRole] = React.useState<"provider" | "doctor" | "program_manager">("provider");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [specialty, setSpecialty] = React.useState<string>(SPECIALTIES[0]);
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createStaffUser({
      full_name: fullName,
      email,
      role,
      specialty: role === "doctor" ? specialty : undefined,
      phone: phone || undefined,
      password,
    });
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Could not create the user.");
    else setCreated({ email, password });
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <Card>
          <CardBody className="space-y-4 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
              <Check size={24} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">Account created</h2>
              <p className="mt-1 text-sm text-muted">
                Share these credentials with the user. The password is shown only
                once.
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-4 text-left">
              <Row label="Email" value={created.email} />
              <Row label="Password" value={created.password} mono />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Email: ${created.email}\nPassword: ${created.password}`,
                );
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy credentials"}
            </button>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreated(null);
                  setFullName("");
                  setEmail("");
                  setPhone("");
                  setPassword("");
                }}
              >
                Add another
              </Button>
              <Button className="flex-1" onClick={() => router.push("/admin/users")}>
                Done
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back to users
      </Link>

      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="provider">Provider (LHV / Nurse / CMW)</option>
                <option value="doctor">Doctor</option>
                <option value="program_manager">Program Manager</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                placeholder="e.g. Dr. Ayesha Khan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@greenstar.health"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {role === "doctor" && (
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                placeholder="03xx-xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                trailing={
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    <RefreshCw size={14} /> Generate
                  </button>
                }
              />
            </div>

            {error && (
              <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              <UserPlus size={18} />
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted">{label}</span>
      <span className={mono ? "font-mono text-sm font-semibold text-foreground" : "text-sm font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}
