import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, IdCard, Activity, Pill, FlaskConical, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { VitalCards } from "@/components/patterns/vital-cards";
import { VitalTrends } from "@/components/patterns/vital-trends";
import { PrescriptionView, type Prescription } from "@/components/rx/prescription-view";
import type { Vitals } from "@/lib/vitals";

const statusTone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  pending: "warning",
  claimed: "info",
  in_consult: "info",
  completed: "success",
  cancelled: "neutral",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function AdminPatientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("admin");
  const admin = createAdminClient();

  const { data: patient } = await admin
    .from("patients")
    .select("id, full_name, age, gender, contact, allergies, mrn, cnic_last4, owner_id, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!patient) notFound();

  const [{ data: appts }, { data: vitalRows }] = await Promise.all([
    admin
      .from("appointments")
      .select("id, type, status, specialty, chief_complaint, created_at, assigned_doctor_name")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("vitals")
      .select("bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, hemoglobin, blood_sugar, captured_at")
      .eq("patient_id", id)
      .order("captured_at", { ascending: true }),
  ]);

  const apptIds = (appts ?? []).map((a) => a.id);
  const [{ data: rxList }, { data: labList }] = await Promise.all([
    apptIds.length
      ? admin.from("prescriptions").select("*").in("appointment_id", apptIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    apptIds.length
      ? admin.from("lab_requests").select("id, tests, status, created_at").in("appointment_id", apptIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as { id: string; tests: string[]; status: string; created_at: string }[] }),
  ]);

  const series = (vitalRows ?? []) as unknown as Vitals[];
  const newest = series.at(-1);
  const source = patient.owner_id ? "Self-registered" : "Provider-added";

  return (
    <div className="space-y-6">
      <Link href="/admin/patients" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Patients
      </Link>

      {/* Profile */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={patient.full_name} size={56} />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground">{patient.full_name}</h1>
                <p className="text-sm text-muted">
                  {[patient.age != null ? `${patient.age} yrs` : null, patient.gender].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </div>
            <StatusPill tone={patient.owner_id ? "info" : "success"} dot={false}>
              {source}
            </StatusPill>
          </div>
          <div className="space-y-2.5 border-t border-border pt-4">
            <Row label="MRN" value={patient.mrn || "—"} />
            {patient.contact && <Row label="Contact" value={patient.contact} />}
            {patient.cnic_last4 && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted"><IdCard size={14} /> CNIC</span>
                <span className="font-medium text-foreground">••••• ••••{patient.cnic_last4}</span>
              </div>
            )}
            <Row label="Registered" value={new Date(patient.created_at).toLocaleDateString()} />
          </div>
          {patient.allergies && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emergency-soft px-3 py-2 text-sm font-medium text-emergency">
              <ShieldAlert size={15} /> Allergies: {patient.allergies}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Vitals */}
      {newest && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Activity size={18} className="text-primary" /> Latest vitals
          </h2>
          <VitalCards vitals={newest} />
          <VitalTrends series={series} />
        </section>
      )}

      {/* Appointments */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <CalendarDays size={18} className="text-primary" /> Appointments ({appts?.length ?? 0})
        </h2>
        {appts?.length ? (
          <div className="space-y-2">
            {appts.map((a) => (
              <Card key={a.id}>
                <CardBody className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {a.specialty} {a.type === "emergency" && <span className="text-xs font-bold text-emergency">· EMERGENCY</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {new Date(a.created_at).toLocaleDateString()}
                      {a.assigned_doctor_name ? ` · ${a.assigned_doctor_name}` : ""}
                    </p>
                  </div>
                  <StatusPill tone={statusTone[a.status] ?? "neutral"}>{a.status}</StatusPill>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No appointments.</p>
        )}
      </section>

      {/* Prescriptions */}
      {(rxList ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Pill size={18} className="text-primary" /> Prescriptions
          </h2>
          {(rxList ?? []).map((rx) => (
            <PrescriptionView key={(rx as Prescription).id} rx={rx as Prescription} />
          ))}
        </section>
      )}

      {/* Labs */}
      {(labList ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <FlaskConical size={18} className="text-primary" /> Lab &amp; diagnostics
          </h2>
          <div className="space-y-2">
            {(labList ?? []).map((lab) => (
              <Card key={lab.id}>
                <CardBody className="flex items-center justify-between gap-3 py-3">
                  <p className="truncate text-sm font-medium text-foreground">{(lab.tests ?? []).join(", ") || "Lab test"}</p>
                  <StatusPill tone={lab.status === "resulted" ? "success" : "warning"}>
                    {lab.status === "resulted" ? "Resulted" : "Requested"}
                  </StatusPill>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
