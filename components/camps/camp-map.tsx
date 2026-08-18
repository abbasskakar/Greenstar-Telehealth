"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { AlertTriangle, MapPinned } from "lucide-react";

export type CampPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  typeLabel: string;
  date: string;
  status: string;
};

let scriptPromise: Promise<void> | null = null;
function loadMaps(key: string): Promise<void> {
  if (typeof window !== "undefined" && (window as any).google?.maps)
    return Promise.resolve();
  // Reuse an already-injected Maps script if the coverage map loaded one
  const existing =
    typeof document !== "undefined" &&
    document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com"]');
  if (existing) {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve) => {
      const check = () => {
        if ((window as any).google?.maps) resolve();
        else setTimeout(check, 150);
      };
      check();
    });
    return scriptPromise;
  }
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=visualization`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("maps load failed"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function CampMap({ points, apiKey }: { points: CampPoint[]; apiKey: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const overlays = React.useRef<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  const valid = React.useMemo(
    () => points.filter((p) => p.lat != null && p.lng != null),
    [points],
  );

  React.useEffect(() => {
    let cancelled = false;
    if (!apiKey) {
      setError("No Google Maps key configured.");
      return;
    }
    loadMaps(apiKey)
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = (window as any).google;
        const center = valid.length
          ? { lat: valid[0].lat, lng: valid[0].lng }
          : { lat: 30.3753, lng: 69.3451 };
        mapRef.current = new g.maps.Map(ref.current, {
          center,
          zoom: valid.length ? 7 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        setReady(true);
      })
      .catch(() =>
        setError(
          "Could not load Google Maps — check the API key and its HTTP-referrer restrictions (allow localhost).",
        ),
      );
    return () => {
      cancelled = true;
    };
  }, [apiKey, valid]);

  React.useEffect(() => {
    const g = (window as any).google;
    if (!ready || !g || !mapRef.current) return;
    overlays.current.forEach((m) => m.setMap(null));
    overlays.current = [];

    const info = new g.maps.InfoWindow();
    valid.forEach((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        title: p.title,
        icon: {
          path: "M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z",
          fillColor: "#0f7a57",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: 1.6,
          anchor: new g.maps.Point(12, 22),
        },
      });
      marker.addListener("click", () => {
        info.setContent(
          `<div style="font-family:system-ui;min-width:170px">
             <div style="font-weight:700;color:#14201b">${p.title}</div>
             <div style="color:#5a6b62;font-size:13px">${p.typeLabel}</div>
             <div style="margin-top:4px;font-size:12px;color:#5a6b62">${p.date} · ${p.status}</div>
           </div>`,
        );
        info.open(mapRef.current, marker);
      });
      overlays.current.push(marker);
    });

    if (valid.length > 1) {
      const b = new g.maps.LatLngBounds();
      valid.forEach((p) => b.extend({ lat: p.lat, lng: p.lng }));
      mapRef.current.fitBounds(b);
    }
  }, [valid, ready]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MapPinned size={16} className="text-primary" /> Camp locations
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div ref={ref} className="h-[48vh] w-full bg-surface-2" />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface p-6 text-center">
            <AlertTriangle size={22} className="text-warning" />
            <p className="max-w-sm text-sm text-muted">{error}</p>
          </div>
        )}
        {!valid.length && !error && (
          <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium text-muted shadow-card">
            No geo-tagged camps yet — new camps capture GPS automatically.
          </div>
        )}
      </div>
    </div>
  );
}
