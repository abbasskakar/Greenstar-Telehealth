import { MapPinned, AlertTriangle, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { CoverageMap, type MapPoint } from "./coverage-map";
import { MapFilters } from "./map-filters";

export async function CoverageView({
  search = {},
}: {
  search?: { type?: string; spec?: string; days?: string };
}) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, geo_lat, geo_lng, created_at,
       patient:patients ( full_name )`,
    )
    .not("geo_lat", "is", null);

  if (search.type === "emergency" || search.type === "regular")
    query = query.eq("type", search.type);
  if (search.spec) query = query.eq("specialty", search.spec);
  const days = Number(search.days);
  if (days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte("created_at", since.toISOString());
  }

  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(500);

  const points: MapPoint[] = (data ?? []).map((a) => {
    const row = a as unknown as {
      id: string;
      type: "emergency" | "regular";
      status: string;
      specialty: string | null;
      geo_lat: number;
      geo_lng: number;
      created_at: string;
      patient: { full_name: string } | null;
    };
    return {
      id: row.id,
      lat: row.geo_lat,
      lng: row.geo_lng,
      type: row.type,
      patient_name: row.patient?.full_name ?? null,
      specialty: row.specialty,
      status: row.status,
      created_at: row.created_at,
    };
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const stats = [
    { label: "Visits mapped", value: points.length, Icon: MapPinned, cls: "bg-primary-soft text-primary" },
    { label: "Emergency cases", value: points.filter((p) => p.type === "emergency").length, Icon: AlertTriangle, cls: "bg-emergency-soft text-emergency" },
    { label: "This month", value: points.filter((p) => new Date(p.created_at) >= monthStart).length, Icon: CalendarDays, cls: "bg-info-soft text-info" },
  ];

  return (
    <div className="space-y-5">
      <MapFilters
        type={search.type ?? "all"}
        spec={search.spec ?? ""}
        days={search.days ?? "all"}
      />
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.cls}`}>
                <s.Icon size={20} />
              </span>
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {s.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <CoverageMap points={points} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ""} />
    </div>
  );
}
