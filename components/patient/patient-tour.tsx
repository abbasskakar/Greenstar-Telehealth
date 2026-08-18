"use client";

import * as React from "react";
import { CalendarPlus, Stethoscope, MessagesSquare, Bell, Check, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const STEPS = [
  { Icon: CalendarPlus, title: "Book a consultation", desc: "Tap “Book an appointment” and describe your problem." },
  { Icon: Stethoscope, title: "A doctor reviews it", desc: "Your case is sent to available doctors in real time." },
  { Icon: MessagesSquare, title: "Chat or video call", desc: "Message the doctor, send a voice note, or join a video call." },
];

export function PatientTour() {
  const [show, setShow] = React.useState(false);
  const [notif, setNotif] = React.useState(false);

  React.useEffect(() => {
    if (!localStorage.getItem("gs-patient-onboarded")) setShow(true);
  }, []);

  function done() {
    localStorage.setItem("gs-patient-onboarded", "1");
    setShow(false);
  }

  async function askNotif() {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setNotif(p === "granted");
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-float">
        <div className="mb-4 flex items-start justify-between">
          <Logo withWordmark />
          <button onClick={done} aria-label="Skip" className="text-muted-2 hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <h2 className="text-xl font-bold text-foreground">Welcome to Greenstar</h2>
        <p className="mt-1 text-[15px] text-muted">Here’s how you get care in three steps.</p>

        <ol className="mt-5 space-y-3">
          {STEPS.map((s, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <s.Icon size={20} />
              </span>
              <span>
                <span className="block font-semibold text-foreground">{s.title}</span>
                <span className="block text-sm text-muted">{s.desc}</span>
              </span>
            </li>
          ))}
        </ol>

        <button
          onClick={askNotif}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Bell size={20} />
            </span>
            <span>
              <span className="block font-semibold text-foreground">Turn on notifications</span>
              <span className="block text-sm text-muted">Get alerts for replies &amp; calls</span>
            </span>
          </span>
          {notif && <Check size={20} className="text-success" />}
        </button>

        <Button className="mt-5 w-full" size="lg" onClick={done}>
          Get started
        </Button>
      </div>
    </div>
  );
}
