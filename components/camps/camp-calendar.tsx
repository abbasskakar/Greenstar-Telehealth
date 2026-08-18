"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { CAMP_TONE, campMeta } from "@/lib/constants/camps";
import { cn } from "@/lib/utils";

type CampLite = { id: string; title: string; date_start: string; type: string };

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function CampCalendar({ camps }: { camps: CampLite[] }) {
  const today = new Date();
  const [ym, setYm] = React.useState({ y: today.getFullYear(), m: today.getMonth() });

  const byDay = React.useMemo(() => {
    const map = new Map<string, CampLite[]>();
    for (const c of camps) {
      const key = c.date_start; // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [camps]);

  const first = new Date(ym.y, ym.m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthCamps = camps
    .filter((c) => {
      const d = new Date(c.date_start);
      return d.getFullYear() === ym.y && d.getMonth() === ym.m;
    })
    .sort((a, b) => a.date_start.localeCompare(b.date_start));

  function shift(delta: number) {
    setYm((p) => {
      const d = new Date(p.y, p.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const key = (day: number) =>
    `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isToday = (day: number) =>
    ym.y === today.getFullYear() && ym.m === today.getMonth() && day === today.getDate();

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">{MONTHS[ym.m]} {ym.y}</h3>
          <div className="flex gap-1">
            <button onClick={() => shift(-1)} className="rounded-lg border border-border p-1.5 text-muted hover:text-foreground" aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => shift(1)} className="rounded-lg border border-border p-1.5 text-muted hover:text-foreground" aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1 text-xs font-semibold text-muted-2">{w}</span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`p${i}`} />;
            const dayCamps = byDay.get(key(day)) ?? [];
            return (
              <div
                key={day}
                className={cn(
                  "flex min-h-[42px] flex-col items-center rounded-lg py-1 text-sm",
                  isToday(day) ? "bg-primary-soft font-bold text-primary" : "text-foreground",
                )}
              >
                {day}
                {dayCamps.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayCamps.slice(0, 3).map((c) => (
                      <span key={c.id} className={cn("h-1.5 w-1.5 rounded-full", CAMP_TONE[c.type].split(" ")[0])} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {monthCamps.length > 0 && (
          <div className="space-y-1.5 border-t border-border pt-3">
            {monthCamps.map((c) => (
              <Link key={c.id} href={`/program/camps/${c.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <span className="flex items-center gap-2 text-sm">
                  <span className={cn("h-2 w-2 rounded-full", CAMP_TONE[c.type].split(" ")[0])} />
                  {c.title}
                </span>
                <span className="text-xs text-muted-2">{campMeta(c.type).label} · {c.date_start.slice(5)}</span>
              </Link>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
