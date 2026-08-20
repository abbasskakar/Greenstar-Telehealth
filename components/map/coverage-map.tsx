"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { MapPin, Grid3x3, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  type: "emergency" | "regular";
  patient_name: string | null;
  specialty: string | null;
  status: string;
  created_at: string;
};

let scriptPromise: Promise<void> | null = null;
function loadMaps(key: string): Promise<void> {
  if (typeof window !== "undefined" && (window as any).google?.maps)
    return Promise.resolve();
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

export function CoverageMap({
  points,
  apiKey,
}: {
  points: MapPoint[];
  apiKey: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const overlays = React.useRef<any[]>([]);
  const heat = React.useRef<any>(null);
  const [mode, setMode] = React.useState<"pins" | "heat">("pins");
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
    if (heat.current) {
      heat.current.setMap(null);
      heat.current = null;
    }

    if (mode === "heat") {
      heat.current = new g.maps.visualization.HeatmapLayer({
        data: valid.map((p) => new g.maps.LatLng(p.lat, p.lng)),
        map: mapRef.current,
        // Larger, brighter, and capped intensity so even a few sparse visits glow.
        radius: 46,
        opacity: 0.85,
        dissipating: true,
        maxIntensity: Math.max(2, Math.ceil(valid.length / 4)),
      });
      return;
    }

    const info = new g.maps.InfoWindow();
    valid.forEach((p) => {
      const marker = new g.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        title: p.patient_name ?? "Visit",
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          fillColor: p.type === "emergency" ? "#d13a3a" : "#2e72c7",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
      });
      marker.addListener("click", () => {
        info.setContent(
          `<div style="font-family:system-ui;min-width:160px">
             <div style="font-weight:700;color:#14201b">${p.patient_name ?? "Visit"}</div>
             <div style="color:#5a6b62;font-size:13px">${[p.specialty, p.status].filter(Boolean).join(" · ")}</div>
             <div style="margin-top:4px;font-size:12px;color:${p.type === "emergency" ? "#d13a3a" : "#2e72c7"};font-weight:600;text-transform:uppercase">${p.type}</div>
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
  }, [mode, valid, ready]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 text-sm font-semibold">
          <button
            onClick={() => setMode("pins")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
              mode === "pins" ? "bg-primary text-primary-contrast" : "text-muted",
            )}
          >
            <MapPin size={15} /> Pins
          </button>
          <button
            onClick={() => setMode("heat")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
              mode === "heat" ? "bg-primary text-primary-contrast" : "text-muted",
            )}
          >
            <Grid3x3 size={15} /> Heat map
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emergency" /> Emergency
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-info" /> Regular
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border">
        <div ref={ref} className="h-[60vh] w-full bg-surface-2" />
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface p-6 text-center">
            <AlertTriangle size={22} className="text-warning" />
            <p className="max-w-sm text-sm text-muted">{error}</p>
          </div>
        )}
        {!valid.length && !error && (
          <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium text-muted shadow-card">
            No geo-tagged visits yet — provider appointments will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
