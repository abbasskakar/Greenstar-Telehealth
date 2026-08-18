import Link from "next/link";
import { Plus, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PatientList, type PatientRow } from "@/components/provider/patient-list";

export default async function ProviderPatients() {
  const { profile } = await requireRole("provider");
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("id, full_name, age, gender, mrn, contact")
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const patients = (data ?? []) as PatientRow[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="mt-0.5 text-sm text-muted">
            {patients.length} registered
          </p>
        </div>
        <Link href="/provider/new">
          <Button size="sm">
            <Plus size={18} /> New
          </Button>
        </Link>
      </div>

      {patients.length ? (
        <PatientList patients={patients} />
      ) : (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
              <UserRound size={22} />
            </span>
            <p className="text-[15px] font-medium text-foreground">No patients yet</p>
            <p className="max-w-xs text-sm text-muted">
              Register your first patient when creating an appointment.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
