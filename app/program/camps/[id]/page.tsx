import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, CalendarDays, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { campMeta, CAMP_TONE } from "@/lib/constants/camps";
import { CampDetail, type Camp } from "@/components/camps/camp-detail";

export default async function CampDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("program_manager");
  const supabase = await createClient();

  const { data: camp } = await supabase.from("camps").select("*").eq("id", id).single();
  if (!camp) notFound();

  const { count: linked } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("camp_id", id);

  const meta = campMeta(camp.type);

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/program/camps" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Camps
      </Link>

      <Card>
        <CardBody className="space-y-2">
          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${CAMP_TONE[camp.type]}`}>
            {meta.label}
          </span>
          <h1 className="text-2xl font-bold text-foreground">{camp.title}</h1>
          <div className="space-y-1 text-sm text-muted">
            <p className="flex items-center gap-1.5"><CalendarDays size={14} /> {camp.date_start}{camp.date_end ? ` – ${camp.date_end}` : ""}</p>
            {camp.location && <p className="flex items-center gap-1.5"><MapPin size={14} /> {camp.location}</p>}
            {camp.team && <p className="flex items-center gap-1.5"><Users size={14} /> {camp.team}</p>}
            {camp.expected_turnout != null && <p>Expected turnout: {camp.expected_turnout}</p>}
          </div>
          {typeof linked === "number" && linked > 0 && (
            <p className="text-sm font-medium text-primary">{linked} linked appointment(s)</p>
          )}
        </CardBody>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">Activity log</h2>
        <CampDetail camp={camp as Camp} />
      </div>
    </div>
  );
}
