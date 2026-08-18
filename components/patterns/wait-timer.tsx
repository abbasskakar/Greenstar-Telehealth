"use client";

import * as React from "react";
import { Clock } from "lucide-react";

export function WaitTimer({ since }: { since: string }) {
  const start = React.useMemo(() => new Date(since).getTime(), [since]);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const secs = Math.max(0, Math.floor((now - start) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const label =
    secs < 3600
      ? `${m}:${String(s).padStart(2, "0")}`
      : `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-muted-2">
      <Clock size={12} /> waiting {label}
    </span>
  );
}
