"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/constants/specialties";

export function SpecialtyFilter({
  filter,
  spec,
}: {
  filter: string;
  spec: string;
}) {
  const router = useRouter();
  return (
    <div className="w-52">
      <Select
        value={spec}
        onChange={(e) => {
          const params = new URLSearchParams();
          if (filter && filter !== "all") params.set("filter", filter);
          if (e.target.value) params.set("spec", e.target.value);
          const qs = params.toString();
          router.push(`/doctor${qs ? `?${qs}` : ""}`);
        }}
        className="h-10"
      >
        <option value="">All specialties</option>
        {SPECIALTIES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>
    </div>
  );
}
