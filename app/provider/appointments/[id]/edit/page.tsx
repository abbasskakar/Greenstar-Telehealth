import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ProviderEditAppointmentForm } from "@/components/provider/edit-appointment-form";

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
    .select("id, type, status, specialty, chief_complaint")
    .eq("id", id)
    .single();
  if (!appt) notFound();
  if (appt.status !== "pending") redirect(`/provider/appointments/${id}`);

  return (
    <div className="space-y-5">
      <Link href={`/provider/appointments/${id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit appointment</h1>
        <p className="mt-1 text-[15px] text-muted">Update before a doctor accepts it.</p>
      </div>
      <ProviderEditAppointmentForm
        id={appt.id}
        initialSpecialty={appt.specialty ?? "General Medicine"}
        initialComplaint={appt.chief_complaint ?? ""}
        initialEmergency={appt.type === "emergency"}
      />
    </div>
  );
}
