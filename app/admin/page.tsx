import { Users, UserCog, Stethoscope, HeartPulse, Circle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { RealtimeRefresh } from "@/components/notifications/realtime-refresh";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";

async function count(table: string, filter?: [string, string]) {
  const supabase = await createClient();
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminHome() {
  await requireRole("admin");
  const supabase = await createClient();
  const [users, patients, providers, doctors] = await Promise.all([
    count("profiles"),
    count("patients"),
    count("profiles", ["role", "provider"]),
    count("profiles", ["role", "doctor"]),
  ]);

  const { data: roster } = await supabase
    .from("profiles")
    .select("id, full_name, role, specialty")
    .eq("duty", "on_duty")
    .in("role", ["doctor", "provider"])
    .order("full_name");

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

  const onDuty = roster ?? [];

  return (
    <div className="space-y-7">
      <RealtimeRefresh table="profiles" channel="admin-roster" />
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

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-foreground">
              <Circle size={10} className="fill-success text-success" /> On-duty roster
            </h2>
            <span className="text-sm text-muted">{onDuty.length} online</span>
          </div>
          {onDuty.length ? (
            <ul className="divide-y divide-border">
              {onDuty.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium text-foreground">{u.full_name}</p>
                    <p className="text-xs text-muted-2">
                      {ROLE_LABEL[u.role as Role]}
                      {u.specialty ? ` · ${u.specialty}` : ""}
                    </p>
                  </div>
                  <StatusPill tone="success">On Duty</StatusPill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">No staff on duty right now.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
