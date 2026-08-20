import { Loader2 } from "lucide-react";

/** Route-level fallback shown while a server component streams in. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}
