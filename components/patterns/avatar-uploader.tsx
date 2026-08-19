"use client";

import * as React from "react";
import { UserRound, Camera, Trash2, Loader2, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AvatarCropModal } from "@/components/patterns/avatar-crop-modal";
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [cropFile, setCropFile] = React.useState<File | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pickFile() {
    setMenuOpen(false);
    fileRef.current?.click();
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8 MB.");
      return;
    }
    setError(null);
    setCropFile(file); // opens the crop modal
  }

  async function uploadBlob(blob: Blob) {
    setCropFile(null);
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data
        .publicUrl;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
      if (dbErr) throw dbErr;

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
    setMenuOpen(false);
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
    <div ref={wrapRef} className={cn("relative flex flex-col items-center", className)}>
      <div className="relative">
        <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-primary text-primary-contrast shadow-pop">
          {busy ? (
            <Loader2 size={30} className="animate-spin" />
          ) : url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <UserRound size={46} />
          )}
        </span>

        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          disabled={busy}
          aria-label="Edit photo"
          className="absolute bottom-0.5 right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface bg-primary text-primary-contrast shadow-pop transition-transform active:scale-95 disabled:opacity-60"
        >
          <Camera size={16} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-float">
          <button
            type="button"
            onClick={pickFile}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-surface-2"
          >
            <ImagePlus size={16} className="text-primary" />
            {url ? "Change photo" : "Upload a photo"}
          </button>
          {url && (
            <button
              type="button"
              onClick={onDelete}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-emergency hover:bg-emergency-soft"
            >
              <Trash2 size={16} /> Remove photo
            </button>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      {error && <p className="mt-2 text-xs font-medium text-emergency">{error}</p>}

      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onCropped={uploadBlob}
        />
      )}
    </div>
  );
}
