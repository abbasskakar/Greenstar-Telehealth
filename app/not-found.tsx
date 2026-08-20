import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Branded 404 — shown by notFound() and unknown routes. */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Compass size={26} />
        </span>
        <div className="space-y-1.5">
          <p className="font-mono text-3xl font-bold text-foreground">404</p>
          <h1 className="text-lg font-bold text-foreground">Page not found</h1>
          <p className="text-sm text-muted">
            The page you’re looking for doesn’t exist or may have moved.
          </p>
        </div>
        <Link href="/">
          <Button>
            <Home size={17} /> Back home
          </Button>
        </Link>
      </div>
    </div>
  );
}
