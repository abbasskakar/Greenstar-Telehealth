import Link from "next/link";
import { Plus, UserRound, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export default async function ProviderPatients() {
  const { profile } = await requireRole("provider");
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("id, full_name, age, gender")
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const patients = data ?? [];

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
        <div className="space-y-2.5">
          {patients.map((p) => (
            <Link key={p.id} href={`/provider/patients/${p.id}`} className="block">
              <Card className="transition-colors hover:border-primary">
                <CardBody className="flex items-center gap-3 py-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <UserRound size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {p.full_name}
                    </p>
                    <p className="text-sm text-muted">
                      {[p.age != null ? `${p.age} yrs` : null, p.gender]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-2" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
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
