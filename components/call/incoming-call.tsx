"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PhoneOff, Video, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acceptCall, declineCall } from "@/app/call/actions";

type Call = { id: string; doctor_name: string | null; patient_name: string | null };
type Row = {
  id: string;
  status: string;
  doctor_name: string | null;
  patient_name: string | null;
};

export function IncomingCallListener({ providerId }: { providerId: string }) {
  const router = useRouter();
  const [call, setCall] = React.useState<Call | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.access_token) {
        await supabase.realtime.setAuth(data.session.access_token);
      }
      if (cancelled) return;
      channel = supabase
        .channel(`incoming:${providerId}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "call_sessions",
            filter: `provider_id=eq.${providerId}`,
          },
          (payload) => {
            const r = payload.new as Row;
            if (r.status === "ringing")
              setCall({ id: r.id, doctor_name: r.doctor_name, patient_name: r.patient_name });
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "call_sessions",
            filter: `provider_id=eq.${providerId}`,
          },
          (payload) => {
            const r = payload.new as Row;
            setCall((c) => (c && c.id === r.id && r.status !== "ringing" ? null : c));
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
  }, [providerId]);

  // Ringtone + vibration while ringing (WhatsApp-style)
  React.useEffect(() => {
    if (!call) return;
    let stopped = false;
    let ctx: AudioContext | null = null;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      const ring = () => {
        if (stopped || !ctx) return;
        [0, 0.4].forEach((offset) => {
          const osc = ctx!.createOscillator();
          const gain = ctx!.createGain();
          osc.connect(gain);
          gain.connect(ctx!.destination);
          osc.frequency.value = 480;
          const t = ctx!.currentTime + offset;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
          osc.start(t);
          osc.stop(t + 0.4);
        });
      };
      ring();
      const interval = setInterval(ring, 2200);
      navigator.vibrate?.([500, 400, 500, 400]);
      const vib = setInterval(() => navigator.vibrate?.([500, 400, 500, 400]), 2200);
      return () => {
        stopped = true;
        clearInterval(interval);
        clearInterval(vib);
        navigator.vibrate?.(0);
        ctx?.close();
      };
    } catch {
      /* audio blocked — visual ring still shows */
    }
  }, [call]);

  if (!call) return null;

  async function accept() {
    if (!call) return;
    setBusy(true);
    await acceptCall(call.id);
    router.push(`/call/${call.id}`);
  }
  async function decline() {
    if (!call) return;
    setBusy(true);
    await declineCall(call.id);
    setCall(null);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-gradient-to-b from-[#111e19] to-[#0b1411] px-6 py-16 text-white">
      <div className="flex flex-col items-center gap-2 pt-6">
        <span className="rounded-full border border-emergency/40 px-4 py-1 text-xs font-bold uppercase tracking-widest text-emergency">
          Incoming video call
        </span>
        <p className="mt-2 text-sm text-white/60">Greenstar Telehealth</p>
      </div>

      <div className="flex flex-col items-center gap-5">
        <span className="gs-pulse flex h-32 w-32 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/10">
          <UserRound size={56} className="text-white/80" />
        </span>
        <div className="text-center">
          <h2 className="text-2xl font-bold">{call.doctor_name ?? "Doctor"}</h2>
          {call.patient_name && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-white/60">
              <UserRound size={14} /> Patient: {call.patient_name}
            </p>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-xs items-center justify-around">
        <button
          onClick={decline}
          disabled={busy}
          className="flex flex-col items-center gap-2"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emergency text-white transition-transform active:scale-95">
            <PhoneOff size={26} />
          </span>
          <span className="text-sm">Decline</span>
        </button>
        <button
          onClick={accept}
          disabled={busy}
          className="flex flex-col items-center gap-2"
        >
          <span className="gs-pulse flex h-16 w-16 items-center justify-center rounded-full bg-success text-white transition-transform active:scale-95">
            <Video size={26} />
          </span>
          <span className="text-sm">Accept</span>
        </button>
      </div>
    </div>
  );
}
