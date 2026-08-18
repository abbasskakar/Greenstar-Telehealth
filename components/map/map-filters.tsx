"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/constants/specialties";

export function MapFilters({
  type,
  spec,
  days,
}: {
  type: string;
  spec: string;
  days: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(next: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { type, spec, days, ...next };
    if (merged.type && merged.type !== "all") params.set("type", merged.type);
    if (merged.spec) params.set("spec", merged.spec);
    if (merged.days && merged.days !== "all") params.set("days", merged.days);
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="w-40">
        <Select value={type || "all"} onChange={(e) => update({ type: e.target.value })} className="h-10">
          <option value="all">All types</option>
          <option value="emergency">Emergency</option>
          <option value="regular">Regular</option>
        </Select>
      </div>
      <div className="w-48">
        <Select value={spec} onChange={(e) => update({ spec: e.target.value })} className="h-10">
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>
      <div className="w-40">
        <Select value={days || "all"} onChange={(e) => update({ days: e.target.value })} className="h-10">
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>
      </div>
    </div>
  );
}
