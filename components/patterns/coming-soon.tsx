import { Sparkles } from "lucide-react";

export function ComingSoon({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-2/50 px-6 py-16 text-center">
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Sparkles size={22} />
      </span>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        {note ?? "This section is being built and arrives in an upcoming module."}
      </p>
    </div>
  );
}
