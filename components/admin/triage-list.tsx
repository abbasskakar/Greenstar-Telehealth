"use client";

import * as React from "react";
import { AlertTriangle, UserCog, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { WaitTimer } from "@/components/patterns/wait-timer";
import { AssignModal, type StaffOption, type AssignTarget } from "@/components/admin/assign-modal";

export function TriageList({
  cases,
  doctors,
  nurses,
}: {
  cases: (AssignTarget & { created_at: string })[];
  doctors: StaffOption[];
  nurses: StaffOption[];
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const active = cases.find((c) => c.id === openId) ?? null;

  return (
    <>
      <div className="space-y-3">
        {cases.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            {c.type === "emergency" && (
              <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-emergency">
                <AlertTriangle size={13} /> Emergency
              </div>
            )}
            <CardBody className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-foreground">{c.patient_name ?? "Unknown patient"}</p>
                <p className="truncate text-sm text-primary">{c.specialty ?? "General"}</p>
                {c.chief_complaint && (
                  <p className="truncate text-sm text-muted">{c.chief_complaint}</p>
                )}
                <div className="mt-1.5 text-xs text-muted-2">
                  Waiting <WaitTimer since={c.created_at} />
                </div>
              </div>
              <button
                onClick={() => setOpenId(c.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-contrast shadow-brand transition-colors hover:bg-primary-strong"
              >
                <UserCog size={16} /> Assign <ChevronRight size={15} />
              </button>
            </CardBody>
          </Card>
        ))}
      </div>

      {active && (
        <AssignModal appt={active} doctors={doctors} nurses={nurses} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}
