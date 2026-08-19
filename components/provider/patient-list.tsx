"use client";

import * as React from "react";
import Link from "next/link";
import { Search, UserRound, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type PatientRow = {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  mrn: string | null;
  contact: string | null;
};

export function PatientList({ patients }: { patients: PatientRow[] }) {
  const [q, setQ] = React.useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? patients.filter((p) =>
        [p.full_name, p.mrn, p.contact]
          .filter(Boolean)
          .some((f) => f!.toLowerCase().includes(query)),
      )
    : patients;

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name, MRN, or phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        icon={<Search size={18} />}
      />
      {filtered.length ? (
        <div className="space-y-2.5">
          {filtered.map((p) => (
            <Link key={p.id} href={`/provider/patients/${p.id}`} className="block">
              <Card interactive>
                <CardBody className="flex items-center gap-3 py-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <UserRound size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{p.full_name}</p>
                    <p className="text-sm text-muted">
                      {[p.mrn, p.age != null ? `${p.age} yrs` : null, p.gender]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-muted-2" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted">No patients match “{q}”.</p>
      )}
    </div>
  );
}
