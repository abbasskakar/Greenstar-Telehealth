"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  label = "Sign out",
  iconOnly = false,
}: {
  className?: string;
  label?: string;
  iconOnly?: boolean;
}) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  if (iconOnly) {
    return (
      <button
        onClick={signOut}
        aria-label={label}
        title={label}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-2 transition-colors hover:bg-emergency-soft hover:text-emergency",
          className,
        )}
      >
        <LogOut size={18} />
      </button>
    );
  }
  return (
    <button
      onClick={signOut}
      className={cn(
        "inline-flex items-center gap-2.5 text-sm font-medium text-muted transition-colors hover:text-emergency",
        className,
      )}
    >
      <LogOut size={18} />
      {label}
    </button>
  );
}
