import { Users, UserCog, Stethoscope, HeartPulse } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { ComingSoon } from "@/components/patterns/coming-soon";

async function count(table: string, filter?: [string, string]) {
  const supabase = await createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminHome() {
  await requireRole("admin");
  const [users, patients, providers, doctors] = await Promise.all([
    count("profiles"),
    count("patients"),
    count("profiles", ["role", "provider"]),
    count("profiles", ["role", "doctor"]),
  ]);

  const stats = [
    { label: "Total Users", value: users, icon: Users, tone: "primary" },
    { label: "Patients", value: patients, icon: HeartPulse, tone: "info" },
    { label: "Providers", value: providers, icon: UserCog, tone: "success" },
    { label: "Doctors", value: doctors, icon: Stethoscope, tone: "warning" },
  ] as const;

  const toneBg: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    info: "bg-info-soft text-info",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="mt-1 text-[15px] text-muted">
          Monitor system metrics and daily operations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardBody>
                <span
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${toneBg[s.tone]}`}
                >
                  <Icon size={22} />
                </span>
                <p className="font-mono text-3xl font-bold tabular-nums text-foreground">
                  {s.value.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <ComingSoon
        title="Appointment monitoring & live roster"
        note="System-wide appointment tracking, online-doctor roster, and audit views arrive as their modules are built."
      />
    </div>
  );
}
