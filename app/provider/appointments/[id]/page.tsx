import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound, AlertTriangle, MessageSquare } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { VitalCards } from "@/components/patterns/vital-cards";
import { ConsentCard } from "@/components/notes/consent-card";
import { PrescriptionView, type Prescription } from "@/components/rx/prescription-view";
import { LabBlock, type Lab } from "@/components/rx/lab-block";
import type { Vitals } from "@/lib/vitals";

const statusMeta = {
  pending: { tone: "warning", label: "Pending" },
  claimed: { tone: "info", label: "Accepted" },
  in_consult: { tone: "info", label: "In consult" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

export default async function ProviderAppointmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("provider");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id,
       patient:patients ( full_name, age, gender ),
       vitals ( * )`,
    )
    .eq("id", id)
    .single();
  if (!appt) notFound();

  const [{ data: consent }, { data: rxList }, { data: labList }] =
    await Promise.all([
      supabase
        .from("consents")
        .select("granted_by_name, created_at")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("prescriptions")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("lab_requests")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const emergency = appt.type === "emergency";
  const p = appt.patient as unknown as {
    full_name: string;
    age: number | null;
    gender: string | null;
  } | null;
  const vitals = (appt.vitals as unknown as Vitals[])?.[0];
  const meta = statusMeta[appt.status as keyof typeof statusMeta];

  return (
    <div className="space-y-5">
      <Link
        href="/provider"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Home
      </Link>

      {emergency && (
        <div className="flex items-center gap-2 rounded-xl border border-emergency/30 bg-emergency-soft px-4 py-3 text-sm font-semibold text-emergency">
          <AlertTriangle size={18} /> Emergency case
        </div>
      )}

      <Card>
        <CardBody className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <UserRound size={26} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground">
                {p?.full_name ?? "Unknown patient"}
              </h1>
              <p className="text-sm text-muted">
                {[p?.age != null ? `${p.age} yrs` : null, p?.gender, appt.specialty]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        </CardBody>
      </Card>

      {vitals && <VitalCards vitals={vitals} />}

      <ConsentCard
        appointmentId={appt.id}
        patientId={appt.patient_id}
        existing={consent ?? null}
      />

      {(rxList ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Prescription</h2>
          {(rxList ?? []).map((rx) => (
            <PrescriptionView key={rx.id} rx={rx as Prescription} />
          ))}
        </div>
      )}

      {(labList ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Lab &amp; Diagnostics</h2>
          <LabBlock
            appointmentId={appt.id}
            labs={(labList ?? []) as Lab[]}
            canRequest={false}
            canUpload
          />
        </div>
      )}

      <Link href={`/provider/appointments/${appt.id}/chat`} className="block">
        <Button variant="secondary" className="w-full">
          <MessageSquare size={18} /> Open messages
        </Button>
      </Link>
    </div>
  );
}
