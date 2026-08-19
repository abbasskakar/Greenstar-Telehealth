import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { PatientsTable, type AdminPatientRow } from "@/components/admin/patients-table";

export default async function AdminPatients() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("patients")
    .select("id, full_name, age, gender, contact, mrn, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows: AdminPatientRow[] = (data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    age: p.age,
    gender: p.gender,
    contact: p.contact,
    mrn: p.mrn,
    source: p.owner_id ? "self" : "provider",
    created_at: p.created_at,
  }));

  const self = rows.filter((r) => r.source === "self").length;
  const byProvider = rows.length - self;

  const stats = [
    { label: "Total patients", value: rows.length },
    { label: "Self-registered", value: self },
    { label: "Added by providers", value: byProvider },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Patients</h1>
        <p className="mt-1 text-[15px] text-muted">
          Everyone in the registry — public self-registrations and provider-added patients.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {s.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <PatientsTable patients={rows} />
    </div>
  );
}
