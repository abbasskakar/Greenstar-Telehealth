import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Circular avatar: shows the photo, else initials, else a person icon. */
export function Avatar({
  url,
  name,
  size = 40,
  className,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const ini = initials(name);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-contrast",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? "User"} className="h-full w-full object-cover" />
      ) : ini ? (
        <span>{ini}</span>
      ) : (
        <UserRound size={Math.round(size * 0.55)} />
      )}
    </span>
  );
}
