"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
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
