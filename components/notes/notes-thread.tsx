"use client";

import * as React from "react";
import { Send, Mic, X, Play, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addTextNote, addVoiceNote } from "@/app/notes/actions";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type Note = {
  id: string;
  author_id: string | null;
  author_name: string | null;
  author_role: string | null;
  kind: "text" | "voice";
  body: string | null;
  audio_path: string | null;
  duration_sec: number | null;
  created_at: string;
};

function clock(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function NotesThread({
  appointmentId,
  currentUserId,
  initial,
  avatars = {},
  header,
  fullHeight = false,
}: {
  appointmentId: string;
  currentUserId: string;
  initial: Note[];
  avatars?: Record<string, string | null>;
  header?: React.ReactNode;
  fullHeight?: boolean;
}) {
  const [notes, setNotes] = React.useState<Note[]>(initial);
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const startRef = React.useRef(0);
  const cancelRef = React.useRef(false);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes.length]);

  React.useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.access_token) await supabase.realtime.setAuth(data.session.access_token);
      if (cancelled) return;
      channel = supabase
        .channel(`notes:${appointmentId}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notes",
            filter: `appointment_id=eq.${appointmentId}`,
          },
          (payload) => {
            const n = payload.new as Note;
            setNotes((prev) => (prev.some((x) => x.id === n.id) ? prev : [...prev, n]));
          },
        )
        .subscribe();
      if (cancelled) {
        supabase.removeChannel(channel);
        channel = null;
      }
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const res = await addTextNote(appointmentId, body);
    if (!res.ok) setText(body);
    setSending(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (cancelRef.current) {
          cancelRef.current = false;
          return; // discarded — don't upload
        }
        const blob = new Blob(chunks, { type: "audio/webm" });
        const duration = (Date.now() - startRef.current) / 1000;
        setUploading(true);
        const supabase = createClient();
        const path = `${appointmentId}/${crypto.randomUUID()}.webm`;
        const { error } = await supabase.storage
          .from("voice-notes")
          .upload(path, blob, { contentType: "audio/webm" });
        if (!error) await addVoiceNote(appointmentId, path, duration);
        setUploading(false);
      };
      recRef.current = rec;
      startRef.current = Date.now();
      rec.start();
      setRecording(true);
      setElapsed(0);
    } catch {
      setRecording(false);
    }
  }

  function sendRecording() {
    cancelRef.current = false;
    recRef.current?.stop(); // onstop uploads
    setRecording(false);
  }

  function cancelRecording() {
    cancelRef.current = true;
    recRef.current?.stop(); // onstop discards
    setRecording(false);
  }

  React.useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card",
        fullHeight && "min-h-0 flex-1",
      )}
    >
      {header && <div className="shrink-0 border-b border-border">{header}</div>}
      <div
        className={cn(
          "space-y-3 overflow-y-auto p-4",
          fullHeight ? "min-h-0 flex-1" : "max-h-[440px] min-h-[180px]",
        )}
      >
        {notes.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No notes yet. Start the conversation.
          </p>
        )}
        {notes.map((n, i) => {
          const mine = n.author_id === currentUserId;
          const showDate = i === 0 || !sameDay(notes[i - 1].created_at, n.created_at);
          return (
            <React.Fragment key={n.id}>
              {showDate && (
                <div className="my-1 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-2">{dayLabel(n.created_at)}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <div className={cn("flex items-start gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                {!mine && (
                  <Avatar
                    url={n.author_id ? avatars[n.author_id] : null}
                    name={n.author_name}
                    size={30}
                    className="mt-5"
                  />
                )}
                <div className={cn("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
                  <span className="mb-1.5 flex items-center gap-1.5 px-1 text-xs">
                    <span className="font-semibold text-foreground">
                      {mine ? "You" : n.author_name ?? "User"}
                    </span>
                    <span className="text-muted-2">{clock(n.created_at)}</span>
                  </span>
                  <div
                    className={cn(
                      "w-fit max-w-full rounded-2xl px-3.5 py-2.5 text-[15px]",
                      mine
                        ? "rounded-br-sm bg-primary text-primary-contrast"
                        : "rounded-bl-sm bg-surface-2 text-foreground",
                    )}
                  >
                    {n.kind === "voice" ? (
                      <VoicePlayer path={n.audio_path} duration={n.duration_sec} mine={mine} />
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{n.body}</p>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendText} className="flex shrink-0 items-end gap-2 border-t border-border p-3">
        {recording ? (
          <>
            <button
              type="button"
              onClick={cancelRecording}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-emergency"
              aria-label="Cancel recording"
            >
              <X size={20} />
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-emergency-soft px-4 py-2.5 text-sm font-medium text-emergency">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emergency" />
              Recording… {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
            </div>
            <button
              type="button"
              onClick={sendRecording}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-contrast"
              aria-label="Send voice note"
            >
              <Send size={18} />
            </button>
          </>
        ) : (
          <>
            <textarea
              rows={1}
              value={text}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) sendText(e);
              }}
              placeholder="Type a clinical note…"
              className="max-h-28 flex-1 resize-none rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
            {uploading ? (
              <button type="button" disabled className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                <Loader2 size={20} className="animate-spin" />
              </button>
            ) : text.trim() ? (
              <button
                type="submit"
                disabled={sending}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-contrast disabled:opacity-60"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary"
                aria-label="Record voice note"
              >
                <Mic size={20} />
              </button>
            )}
          </>
        )}
      </form>
    </div>
  );
}

function VoicePlayer({
  path,
  duration,
  mine,
}: {
  path: string | null;
  duration: number | null;
  mine: boolean;
}) {
  const [loading, setLoading] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  async function play() {
    if (!path) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.storage.from("voice-notes").createSignedUrl(path, 3600);
    setLoading(false);
    if (data?.signedUrl) {
      audioRef.current = new Audio(data.signedUrl);
      audioRef.current.play();
    }
  }

  return (
    <button onClick={play} className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          mine ? "bg-white/20" : "bg-primary/15 text-primary",
        )}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
      </span>
      <span className="font-medium">Voice note</span>
      {duration != null && (
        <span className={cn("text-sm", mine ? "text-white/70" : "text-muted-2")}>
          {Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, "0")}
        </span>
      )}
    </button>
  );
}
