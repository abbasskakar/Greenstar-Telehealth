"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tent, MapPin } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CAMP_TYPES } from "@/lib/constants/camps";
import { createCamp } from "@/app/camps/actions";

export function CampForm() {
  const router = useRouter();
  const [type, setType] = React.useState<string>("health_camp");
  const [title, setTitle] = React.useState("");
  const [dateStart, setDateStart] = React.useState("");
  const [dateEnd, setDateEnd] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [team, setTeam] = React.useState("");
  const [expected, setExpected] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [geo, setGeo] = React.useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeo(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await createCamp({
      type,
      title,
      date_start: dateStart,
      date_end: dateEnd || null,
      location,
      team,
      expected_turnout: expected ? Number(expected) : null,
      notes,
      geo,
    });
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Could not save.");
    else router.push(`/program/camps/${res.id}`);
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="type">Camp type</Label>
            <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
              {CAMP_TYPES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Pediatric Health Camp" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ds">Start date</Label>
            <Input id="ds" type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="de">End date (optional)</Label>
            <Input id="de" type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="loc">Location</Label>
            <Input id="loc" placeholder="Village / area" value={location} onChange={(e) => setLocation(e.target.value)} />
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <MapPin size={12} className={geo ? "text-success" : "text-muted-2"} />
              {geo ? `GPS captured (${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)})` : "Auto geo-tagging location…"}
            </p>
          </div>
          <div>
            <Label htmlFor="team">Team / partner</Label>
            <Input id="team" placeholder="Organizing team or partner org" value={team} onChange={(e) => setTeam(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="exp">Expected turnout</Label>
            <Input id="exp" inputMode="numeric" placeholder="e.g. 200" value={expected} onChange={(e) => setExpected(e.target.value.replace(/\D/g, ""))} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2/60 px-3.5 py-2.5 text-[15px] text-foreground outline-none focus:border-primary focus:bg-surface"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
        )}
        <Button className="w-full" disabled={loading} onClick={submit}>
          <Tent size={18} /> {loading ? "Saving…" : "Schedule camp"}
        </Button>
      </CardBody>
    </Card>
  );
}
