import * as React from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "emergency"
  | "info"
  | "warning"
  | "success"
  | "neutral"
  | "primary";

const toneMap: Record<Tone, string> = {
  emergency: "bg-emergency-soft text-emergency ring-1 ring-inset ring-emergency/20",
  info: "bg-info-soft text-info ring-1 ring-inset ring-info/20",
  warning: "bg-warning-soft text-warning ring-1 ring-inset ring-warning/20",
  success: "bg-success-soft text-success ring-1 ring-inset ring-success/20",
  primary: "bg-primary-soft text-primary-strong ring-1 ring-inset ring-primary/20 dark:text-primary",
  neutral: "bg-surface-2 text-muted ring-1 ring-inset ring-border",
};

export function StatusPill({
  tone = "neutral",
  dot = true,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        toneMap[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
