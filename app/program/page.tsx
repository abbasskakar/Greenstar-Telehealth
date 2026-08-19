import Link from "next/link";
import { Users, CalendarCheck, Tent, Map, BarChart3, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";

async function count(supabase: Awaited<ReturnType<typeof createClient>>, table: string) {
  const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function ProgramHome() {
  const { profile } = await requireRole("program_manager");
  const firstName = (profile.full_name || "Manager").split(" ")[0];
  const supabase = await createClient();
  const [patients, appts, camps] = await Promise.all([
    count(supabase, "patients"),
    count(supabase, "appointments"),
    count(supabase, "camps"),
  ]);

  const stats = [
    { label: "Patients", value: patients, Icon: Users, cls: "bg-primary-soft text-primary" },
    { label: "Appointments", value: appts, Icon: CalendarCheck, cls: "bg-info-soft text-info" },
    { label: "Camps", value: camps, Icon: Tent, cls: "bg-success-soft text-success" },
  ];

  const links = [
    { href: "/program/camps", label: "Camps & Events", desc: "Schedule and log outreach", Icon: Tent },
    { href: "/program/map", label: "Coverage Map", desc: "Field reach & heat map", Icon: Map },
    { href: "/program/reports", label: "Reports", desc: "KPIs & donor exports", Icon: BarChart3 },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome, {firstName}</h1>
        <p className="mt-1 text-[15px] text-muted">Program coverage, camps, and donor reporting.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.cls}`}>
                <s.Icon size={20} />
              </span>
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">{s.value.toLocaleString()}</p>
              <p className="text-sm text-muted">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card interactive className="h-full">
              <CardBody className="flex items-start justify-between gap-2">
                <div>
                  <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-primary">
                    <l.Icon size={20} />
                  </span>
                  <p className="font-semibold text-foreground">{l.label}</p>
                  <p className="text-sm text-muted">{l.desc}</p>
                </div>
                <ChevronRight size={18} className="text-muted-2" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
