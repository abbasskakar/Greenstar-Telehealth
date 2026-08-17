import { cn } from "@/lib/utils";

/**
 * Greenstar mark — a rounded medical cross cradled in a soft "star" burst.
 * Distinct from the generic clinical cross: the cross sits on a pulse-ring motif.
 */
export function Logo({
  className,
  withWordmark = false,
}: {
  className?: string;
  withWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        aria-hidden="true"
        fill="none"
      >
        <rect width="40" height="40" rx="12" fill="var(--primary)" />
        {/* pulse-ring accent */}
        <circle cx="20" cy="20" r="13" stroke="var(--pulse)" strokeWidth="1.5" opacity="0.55" />
        {/* rounded cross */}
        <path
          d="M20 11.5v17M11.5 20h17"
          stroke="var(--primary-contrast)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-primary">
          Greenstar
        </span>
      )}
    </span>
  );
}
