import Link from "next/link";
import { Pill, Printer, CalendarClock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { RxItem } from "@/app/rx/actions";

export type Prescription = {
  id: string;
  doctor_name: string | null;
  items: RxItem[];
  advice: string | null;
  follow_up_date: string | null;
  created_at: string;
};

export function PrescriptionView({ rx }: { rx: Prescription }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple">
            <Pill size={18} />
            <span className="font-semibold text-foreground">Prescription</span>
          </div>
          <Link
            href={`/prescription/${rx.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Printer size={15} /> Print
          </Link>
        </div>

        <ul className="divide-y divide-border">
          {rx.items.map((it, i) => (
            <li key={i} className="py-2.5">
              <p className="font-semibold text-foreground">{it.drug}</p>
              <p className="text-sm text-muted">
                {[it.dose, it.frequency, it.duration].filter(Boolean).join(" · ")}
              </p>
              {it.instructions && (
                <p className="mt-0.5 text-sm text-muted-2">{it.instructions}</p>
              )}
            </li>
          ))}
        </ul>

        {rx.advice && (
          <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-foreground">
            <span className="font-semibold">Advice: </span>
            {rx.advice}
          </p>
        )}
        {rx.follow_up_date && (
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <CalendarClock size={14} /> Follow-up: {rx.follow_up_date}
          </p>
        )}
        {rx.doctor_name && (
          <p className="text-xs text-muted-2">By {rx.doctor_name}</p>
        )}
      </CardBody>
    </Card>
  );
}
