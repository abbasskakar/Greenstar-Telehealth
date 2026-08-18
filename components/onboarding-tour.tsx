"use client";

import * as React from "react";
import { MapPin, Bell, Check, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function OnboardingTour() {
  const { lang, setLang } = useT();
  const [show, setShow] = React.useState(false);
  const [loc, setLoc] = React.useState(false);
  const [notif, setNotif] = React.useState(false);

  React.useEffect(() => {
    if (!localStorage.getItem("gs-onboarded")) setShow(true);
  }, []);

  function done() {
    localStorage.setItem("gs-onboarded", "1");
    setShow(false);
  }

  async function askLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => setLoc(true),
      () => setLoc(false),
    );
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
        <p className="mt-1 text-[15px] text-muted">A quick setup to get you ready for the field.</p>

        <div className="mt-5 space-y-3">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-foreground">Language / زبان</p>
            <div className="flex rounded-lg bg-surface-2 p-0.5 text-sm font-semibold">
              <button onClick={() => setLang("en")} className={cn("flex-1 rounded-md px-3 py-2", lang === "en" ? "bg-surface text-foreground shadow-card" : "text-muted")}>English</button>
              <button onClick={() => setLang("ur")} className={cn("flex-1 rounded-md px-3 py-2", lang === "ur" ? "bg-surface text-foreground shadow-card" : "text-muted")}>اردو</button>
            </div>
          </div>

          <button onClick={askLocation} className="flex w-full items-center justify-between rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><MapPin size={20} /></span>
              <span>
                <span className="block font-semibold text-foreground">Location</span>
                <span className="block text-sm text-muted">Tag visits for coverage maps</span>
              </span>
            </span>
            {loc && <Check size={20} className="text-success" />}
          </button>

          <button onClick={askNotif} className="flex w-full items-center justify-between rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Bell size={20} /></span>
              <span>
                <span className="block font-semibold text-foreground">Notifications</span>
                <span className="block text-sm text-muted">Get alerts for calls &amp; notes</span>
              </span>
            </span>
            {notif && <Check size={20} className="text-success" />}
          </button>
        </div>

        <Button className="mt-5 w-full" size="lg" onClick={done}>Get started</Button>
      </div>
    </div>
  );
}
