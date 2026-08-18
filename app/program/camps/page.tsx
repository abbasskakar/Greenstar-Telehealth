import Link from "next/link";
import { Plus, Tent, MapPin, CalendarDays, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { campMeta, CAMP_TONE } from "@/lib/constants/camps";

export default async function ProgramCamps() {
  await requireRole("program_manager");
  const supabase = await createClient();
  const { data } = await supabase
    .from("camps")
    .select("id, type, title, date_start, date_end, location, status, actual_turnout")
    .order("date_start", { ascending: false });

  const camps = data ?? [];

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
