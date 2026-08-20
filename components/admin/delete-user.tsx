"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteStaffUser } from "@/app/admin/users/actions";

export function DeleteUserButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    setLoading(true);
    setError(null);
    const res = await deleteStaffUser(userId);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Could not delete.");
      setConfirming(false);
    } else {
      router.push("/admin/users");
      router.refresh();
    }
  }

  return (
    <div>
      <Button variant="outline" className="w-full text-emergency" onClick={() => setConfirming(true)}>
        <Trash2 size={18} /> Delete user
      </Button>
      {error && <p className="mt-2 text-sm font-medium text-emergency">{error}</p>}

      {confirming && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-float">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emergency-soft text-emergency">
              <Trash2 size={26} />
            </span>
            <h3 className="text-lg font-bold text-foreground">Delete {name}?</h3>
            <p className="mt-1.5 text-sm text-muted">
              This permanently removes their account and login. This can’t be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)} disabled={loading}>
                Keep it
              </Button>
              <Button className="flex-1 bg-emergency hover:bg-emergency" onClick={remove} disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {loading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
