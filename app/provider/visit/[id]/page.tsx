import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, Stethoscope, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { VitalsForm } from "@/components/provider/vitals-form";
import { VitalCards } from "@/components/patterns/vital-cards";
import type { Vitals } from "@/lib/vitals";

export default async function ProviderVisit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireRole("provider");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      `id, type, specialty, chief_complaint, assigned_nurse_id, assigned_doctor_name,
       patient:patients ( full_name, age, gender ),
       vitals ( * )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!appt || appt.assigned_nurse_id !== profile.id) notFound();

  const p = appt.patient as unknown as { full_name: string; age: number | null; gender: string | null } | null;
  const existing = (appt.vitals as unknown as Vitals[])?.[0];
  const emergency = appt.type === "emergency";

  return (
    <div className="space-y-5">
      <Link href="/provider" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Home
      </Link>

      <Card className="overflow-hidden">
        {emergency && (
          <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-emergency">
            <AlertTriangle size={13} /> Emergency
          </div>
        )}
        <CardBody className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">{p?.full_name ?? "Patient"}</h1>
          <p className="text-sm text-muted">
            {[p?.age != null ? `${p.age} yrs` : null, p?.gender, appt.specialty].filter(Boolean).join(" · ") || appt.specialty}
          </p>
          {appt.chief_complaint && (
            <p className="border-t border-border pt-2 text-[15px] text-foreground">{appt.chief_complaint}</p>
          )}
          {appt.assigned_doctor_name && (
            <p className="flex items-center gap-1.5 text-sm text-info">
              <Stethoscope size={15} /> Doctor: {appt.assigned_doctor_name}
            </p>
          )}
        </CardBody>
      </Card>

      {existing ? (
        <Card>
          <CardBody className="space-y-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 size={17} /> Vitals already recorded for this visit
            </p>
            <VitalCards vitals={existing} />
          </CardBody>
        </Card>
      ) : (
        <VitalsForm appointmentId={appt.id} />
      )}
    </div>
  );
}
