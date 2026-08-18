import Link from "next/link";
import { Plus, Tent, MapPin, CalendarDays, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { CampCalendar } from "@/components/camps/camp-calendar";
import { CampMap, type CampPoint } from "@/components/camps/camp-map";
import { campMeta, CAMP_TONE } from "@/lib/constants/camps";

export default async function ProgramCamps() {
  await requireRole("program_manager");
  const supabase = await createClient();
  const { data } = await supabase
    .from("camps")
    .select("id, type, title, date_start, date_end, location, status, actual_turnout, geo_lat, geo_lng")
    .order("date_start", { ascending: false });

  const camps = data ?? [];
  const reached = camps.reduce((s, c) => s + (c.actual_turnout ?? 0), 0);
  const completed = camps.filter((c) => c.status === "completed").length;
  const campPoints: CampPoint[] = camps
    .filter((c) => c.geo_lat != null && c.geo_lng != null)
    .map((c) => ({
      id: c.id,
      lat: c.geo_lat as number,
      lng: c.geo_lng as number,
      title: c.title,
      typeLabel: campMeta(c.type).label,
      date: c.date_start,
      status: c.status,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Camps & Events</h1>
          <p className="mt-1 text-[15px] text-muted">{camps.length} camps</p>
        </div>
        <Link href="/program/camps/new">
          <Button><Plus size={18} /> Schedule camp</Button>
        </Link>
      </div>

      {camps.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total camps", value: camps.length },
            { label: "People reached", value: reached },
            { label: "Completed", value: completed },
          ].map((s) => (
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
      )}

      {camps.length > 0 && <CampCalendar camps={camps} />}

      {campPoints.length > 0 && (
        <Card>
          <CardBody>
            <CampMap points={campPoints} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""} />
          </CardBody>
        </Card>
      )}

      {camps.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {camps.map((c) => {
            const meta = campMeta(c.type);
            return (
              <Link key={c.id} href={`/program/camps/${c.id}`} className="block">
                <Card className="h-full transition-colors hover:border-primary">
                  <CardBody className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${CAMP_TONE[c.type]}`}>
                        {meta.label}
                      </span>
                      <StatusPill tone={c.status === "completed" ? "success" : c.status === "active" ? "info" : "neutral"}>
                        {c.status}
                      </StatusPill>
                    </div>
                    <p className="font-bold text-foreground">{c.title}</p>
                    <div className="space-y-1 text-sm text-muted">
                      <p className="flex items-center gap-1.5"><CalendarDays size={14} /> {c.date_start}{c.date_end ? ` – ${c.date_end}` : ""}</p>
                      {c.location && <p className="flex items-center gap-1.5"><MapPin size={14} /> {c.location}</p>}
                    </div>
                    <div className="flex items-center justify-end text-sm font-semibold text-primary">
                      Open <ChevronRight size={16} />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2"><Tent size={22} /></span>
            <p className="text-[15px] font-medium text-foreground">No camps yet</p>
            <p className="max-w-xs text-sm text-muted">Schedule a health camp, vaccination drive, or awareness session.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
