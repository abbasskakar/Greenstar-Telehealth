import {
  Users,
  CalendarCheck,
  AlertTriangle,
  Percent,
  UserCog,
  Tent,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { ExportBar, type ReportRow } from "./export-bar";

function monthKey(d: Date) {
  return d.toLocaleString("en", { month: "short" });
}

export async function ReportsView() {
  const supabase = await createClient();

  const [
    { count: patients },
    { data: appts },
    { count: providers },
    { count: doctors },
    { data: camps },
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("type, status, specialty, created_at").limit(2000),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "provider"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "doctor"),
    supabase.from("camps").select("actual_turnout, counters"),
  ]);

  const rows = (appts ?? []) as {
    type: string;
    status: string;
    specialty: string | null;
    created_at: string;
  }[];

  const total = rows.length;
  const emergencies = rows.filter((r) => r.type === "emergency").length;
  const completed = rows.filter((r) => r.status === "completed").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const campReach = (camps ?? []).reduce(
    (s, c) => s + (c.actual_turnout ?? 0),
    0,
  );

  // last 6 months bar data
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const count = rows.filter((r) => {
      const t = new Date(r.created_at);
      return t >= d && t < next;
    }).length;
    months.push({ label: monthKey(d), count });
  }
  const maxMonth = Math.max(1, ...months.map((m) => m.count));

  // specialty breakdown (top 5)
  const bySpec = new Map<string, number>();
  rows.forEach((r) => r.specialty && bySpec.set(r.specialty, (bySpec.get(r.specialty) ?? 0) + 1));
  const topSpecs = [...bySpec.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stats = [
    { label: "Patients served", value: patients ?? 0, Icon: Users, cls: "bg-primary-soft text-primary" },
    { label: "Appointments", value: total, Icon: CalendarCheck, cls: "bg-info-soft text-info" },
    { label: "Emergency cases", value: emergencies, Icon: AlertTriangle, cls: "bg-emergency-soft text-emergency" },
    { label: "Completion rate", value: `${completionRate}%`, Icon: Percent, cls: "bg-success-soft text-success" },
    { label: "Field staff", value: (providers ?? 0) + (doctors ?? 0), Icon: UserCog, cls: "bg-warning-soft text-warning" },
    { label: "Camp reach", value: campReach, Icon: Tent, cls: "bg-purple-soft text-purple" },
  ];

  const indicators: Record<string, number> = {
    patients_served: patients ?? 0,
    appointments_total: total,
    emergency_cases: emergencies,
    completed_appointments: completed,
    completion_rate_pct: completionRate,
    active_providers: providers ?? 0,
    active_doctors: doctors ?? 0,
    camp_people_reached: campReach,
  };

  const exportRows: ReportRow[] = rows.map((r) => ({
    date: r.created_at.slice(0, 10),
    type: r.type,
    status: r.status,
    specialty: r.specialty,
  }));

  return (
    <div className="space-y-6">
      <ExportBar rows={exportRows} indicators={indicators} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.cls}`}>
                <s.Icon size={20} />
              </span>
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
              </p>
              <p className="text-sm text-muted">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="mb-4 font-bold text-foreground">Appointments — last 6 months</h3>
            <div className="flex h-40 items-end justify-between gap-2">
              {months.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold tabular-nums text-muted">{m.count}</span>
                  <div
                    className="w-full rounded-t-md bg-primary"
                    style={{ height: `${(m.count / maxMonth) * 100}%`, minHeight: m.count ? 6 : 2 }}
                  />
                  <span className="text-xs text-muted-2">{m.label}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-4 font-bold text-foreground">Top specialties</h3>
            {topSpecs.length ? (
              <ul className="space-y-3">
                {topSpecs.map(([name, count]) => (
                  <li key={name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-foreground">{name}</span>
                      <span className="font-semibold tabular-nums text-muted">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(count / topSpecs[0][1]) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No data yet.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="text-xs text-muted-2">
        Donor-ready indicators export as CSV or a DHIS2 / FHIR-lite JSON payload. Response-time
        metrics expand as more appointments flow through the system.
      </p>
    </div>
  );
}
