import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ProviderEditAppointmentForm } from "@/components/provider/edit-appointment-form";
import type { Vitals } from "@/lib/vitals";

const s = (n: number | null | undefined) => (n == null ? "" : String(n));

export default async function ProviderEditAppointment({
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
      "id, type, status, specialty, chief_complaint, patient:patients ( full_name, age, gender, contact ), vitals ( * )",
    )
    .eq("id", id)
    .single();
  if (!appt) notFound();
  if (appt.status !== "pending") redirect(`/provider/appointments/${id}`);

  const p = appt.patient as unknown as {
    full_name: string;
    age: number | null;
    gender: string | null;
    contact: string | null;
  } | null;
  const v = (appt.vitals as unknown as Vitals[])?.[0];

  return (
    <div className="space-y-5">
      <Link href={`/provider/appointments/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit appointment</h1>
        <p className="mt-1 text-[15px] text-muted">Update patient, request, and vitals before a doctor accepts it.</p>
      </div>
      <ProviderEditAppointmentForm
        id={appt.id}
        initial={{
          full_name: p?.full_name ?? "",
          age: s(p?.age),
          gender: p?.gender ?? "",
          contact: p?.contact ?? "",
          specialty: appt.specialty ?? "General Medicine",
          complaint: appt.chief_complaint ?? "",
          emergency: appt.type === "emergency",
          bpSys: s(v?.bp_systolic),
          bpDia: s(v?.bp_diastolic),
          vitals: {
            heart_rate: s(v?.heart_rate),
            temperature_f: s(v?.temperature_f),
            spo2: s(v?.spo2),
            hemoglobin: s(v?.hemoglobin),
            blood_sugar: s(v?.blood_sugar),
          },
        }}
      />
    </div>
  );
}
