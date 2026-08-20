"use client";

import * as React from "react";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** App-wide error boundary — replaces the browser's bare "This page couldn't
 *  load" with a branded, recoverable screen. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surface the error in the console for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emergency-soft text-emergency">
          <AlertTriangle size={26} />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted">
            This page ran into an unexpected problem. You can try again, or head back home.
          </p>
        </div>
        <div className="flex gap-2.5 pt-1">
          <Button onClick={reset}>
            <RotateCw size={17} /> Try again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home size={17} /> Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
