"use client";

import * as React from "react";
import {
  UserRound,
  Check,
  Lock,
  Loader2,
  Pencil,
  X,
  ChevronRight,
  Phone,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { AvatarUploader } from "@/components/patterns/avatar-uploader";
import { updateMyProfile, changeMyPassword } from "@/app/patient/actions";

export function PatientProfileEditor({
  userId,
  initialName,
  initialPhone,
  initialAvatar = null,
}: {
  userId: string;
  initialName: string;
  initialPhone: string;
  initialAvatar?: string | null;
}) {
  const [name, setName] = React.useState(initialName);
  const [phone, setPhone] = React.useState(initialPhone);
  const [draftName, setDraftName] = React.useState(initialName);
  const [draftPhone, setDraftPhone] = React.useState(initialPhone);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [pwOpen, setPwOpen] = React.useState(false);
  const [pw, setPw] = React.useState("");
  const [pw2, setPw2] = React.useState("");
  const [pwSaving, setPwSaving] = React.useState(false);
  const [pwMsg, setPwMsg] = React.useState<string | null>(null);
  const [pwErr, setPwErr] = React.useState<string | null>(null);

  function startEdit() {
    setDraftName(name);
    setDraftPhone(phone);
    setErr(null);
    setSaved(false);
    setEditing(true);
  }

  async function saveProfile() {
    setErr(null);
    setSaving(true);
    const res = await updateMyProfile({ full_name: draftName, phone: draftPhone });
    setSaving(false);
    if (!res.ok) {
      setErr(res.error ?? "Could not save.");
      return;
    }
    setName(draftName);
    setPhone(draftPhone);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function savePassword() {
    setPwErr(null);
    setPwMsg(null);
    if (pw !== pw2) {
      setPwErr("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    const res = await changeMyPassword(pw);
    setPwSaving(false);
    if (!res.ok) {
      setPwErr(res.error ?? "Could not update password.");
      return;
    }
    setPwMsg("Password updated.");
    setPw("");
    setPw2("");
    setTimeout(() => {
      setPwOpen(false);
      setPwMsg(null);
    }, 1500);
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card className="overflow-hidden">
        <div className="gs-brand-gradient h-28" />
        <CardBody className="space-y-5 pt-0">
          {/* Identity — centered */}
          <div className="flex flex-col items-center text-center">
            <div className="-mt-20">
              <AvatarUploader userId={userId} initialUrl={initialAvatar} />
            </div>
            <p className="mt-3 max-w-full truncate text-xl font-bold text-foreground">
              {name || "Patient"}
            </p>
            <div className="mt-1.5">
              <StatusPill tone="primary" dot={false}>
                Public User
              </StatusPill>
            </div>
          </div>

          {saved && (
            <p className="flex items-center gap-1.5 rounded-xl bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success">
              <Check size={16} /> Profile updated.
            </p>
          )}

          {/* Personal details — read mode with an edit toggle */}
          <div className="border-t border-border pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-2">
                Personal details
              </h2>
              {!editing && (
                <button
                  onClick={startEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary/50"
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={draftName} onChange={(e) => setDraftName(e.target.value)} icon={<UserRound size={18} />} />
                </div>
                <div>
                  <Label htmlFor="phone">Contact number</Label>
                  <Input id="phone" inputMode="tel" placeholder="0300-1234567" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} icon={<Phone size={18} />} />
                </div>
                {err && (
                  <p className="rounded-xl bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{err}</p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditing(false)} disabled={saving}>
                    <X size={16} /> Cancel
                  </Button>
                  <Button className="flex-1" onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Row label="Full name" value={name || "—"} />
                <Row label="Contact number" value={phone || "Not added"} />
              </dl>
            )}
          </div>

          {/* Change password — collapsed, opens on tap */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => {
                setPwOpen((o) => !o);
                setPwErr(null);
                setPwMsg(null);
              }}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <Lock size={17} className="text-muted" /> Change password
              </span>
              <ChevronRight
                size={18}
                className={`text-muted-2 transition-transform ${pwOpen ? "rotate-90" : ""}`}
              />
            </button>

            {pwOpen && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="pw">New password</Label>
                  <Input id="pw" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} icon={<Lock size={18} />} />
                </div>
                <div>
                  <Label htmlFor="pw2">Confirm new password</Label>
                  <Input id="pw2" type="password" placeholder="••••••••" value={pw2} onChange={(e) => setPw2(e.target.value)} icon={<Lock size={18} />} />
                </div>
                {pwErr && (
                  <p className="rounded-xl bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{pwErr}</p>
                )}
                {pwMsg && (
                  <p className="rounded-xl bg-success-soft px-3.5 py-2.5 text-sm font-medium text-success">{pwMsg}</p>
                )}
                <Button variant="secondary" className="w-full" onClick={savePassword} disabled={pwSaving || !pw}>
                  {pwSaving ? "Updating…" : "Update password"}
                </Button>
              </div>
            )}
          </div>

          {/* Sign out — red */}
          <div className="border-t border-border pt-4">
            <SignOutButton className="text-[15px] font-semibold text-emergency hover:text-emergency" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
