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
  emergency: "bg-emergency-soft text-emergency",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  primary: "bg-primary-soft text-primary-strong dark:text-primary",
  neutral: "bg-surface-2 text-muted",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        toneMap[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
