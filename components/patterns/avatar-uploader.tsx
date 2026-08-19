"use client";

import * as React from "react";
import { UserRound, Camera, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AvatarUploader({
  userId,
  initialUrl,
  className,
}: {
  userId: string;
  initialUrl: string | null;
  className?: string;
}) {
  const [url, setUrl] = React.useState<string | null>(initialUrl);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Image must be under 3 MB.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data
        .publicUrl;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (dbErr) throw dbErr;

      // Best-effort cleanup of older files in this user's folder.
      const { data: list } = await supabase.storage.from("avatars").list(userId);
      const old = (list ?? [])
        .filter((f) => `${userId}/${f.name}` !== path)
        .map((f) => `${userId}/${f.name}`);
      if (old.length) await supabase.storage.from("avatars").remove(old);

      setUrl(publicUrl);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: list } = await supabase.storage.from("avatars").list(userId);
      const paths = (list ?? []).map((f) => `${userId}/${f.name}`);
      if (paths.length) await supabase.storage.from("avatars").remove(paths);
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
      setUrl(null);
    } catch {
      setError("Could not remove photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-primary text-primary-contrast shadow-pop">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <UserRound size={40} />
          )}
        </span>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          aria-label={url ? "Change photo" : "Add photo"}
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-contrast shadow-pop transition-transform active:scale-95 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />
      </div>

      {url && !busy && (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emergency hover:underline"
        >
          <Trash2 size={13} /> Remove photo
        </button>
      )}
      {error && <p className="text-xs font-medium text-emergency">{error}</p>}
    </div>
  );
}
