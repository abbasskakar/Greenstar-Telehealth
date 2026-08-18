"use client";

import * as React from "react";
import { touchActivity } from "@/lib/actions/duty";

/** Pings the server every 2 minutes so an on-duty clinician stays
 *  "effective online" (the pg_cron job flips stale sessions to Off Duty). */
export function DutyHeartbeat() {
  React.useEffect(() => {
    void touchActivity();
    const t = setInterval(() => void touchActivity(), 120_000);
    return () => clearInterval(t);
  }, []);
  return null;
}
