"use client";

import * as React from "react";
import { UserRound, Check, Lock, Loader2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { updateMyProfile, changeMyPassword } from "@/app/patient/actions";

export function PatientProfileEditor({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const [name, setName] = React.useState(initialName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [pwSaving, setPwSaving] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState<string | null>(null);
  const [pwErr, setPwErr] = React.useState<string | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    setSaving(true);
    const res = await updateMyProfile({ full_name: name, phone });
    setSaving(false);
    if (!res.ok) setErr(res.error ?? "Could not save.");
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (pw !== pw2) {
      setPwErr("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    const res = await changeMyPassword(pw);
    setPwSaving(false);
    if (!res.ok) setPwErr(res.error ?? "Could not update password.");
    else {
      setPwMsg("Password updated.");
      setPw("");
      setPw2("");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card>
        <CardBody className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserRound size={28} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-foreground">{name || "Patient"}</p>
            <StatusPill tone="primary" dot={false}>
              Public User
            </StatusPill>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} icon={<UserRound size={18} />} />
            </div>
            <div>
              <Label htmlFor="phone">Contact number</Label>
              <Input id="phone" inputMode="tel" placeholder="0300-1234567" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {err && (
              <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{err}</p>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : null}
              {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
            <Lock size={18} className="text-muted" /> Change password
          </h2>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} icon={<Lock size={18} />} />
            </div>
            <div>
              <Label htmlFor="pw2">Confirm new password</Label>
              <Input id="pw2" type="password" placeholder="••••••••" value={pw2} onChange={(e) => setPw2(e.target.value)} icon={<Lock size={18} />} />
            </div>
            {pwErr && (
              <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{pwErr}</p>
            )}
            {pwMsg && (
              <p className="rounded-lg bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success">{pwMsg}</p>
            )}
            <Button type="submit" variant="secondary" className="w-full" disabled={pwSaving || !pw}>
              {pwSaving ? "Updating…" : "Update password"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <SignOutButton className="text-[15px]" />
        </CardBody>
      </Card>
    </div>
  );
}
