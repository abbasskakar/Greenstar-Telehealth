import { requireRole } from "@/lib/auth/session";
import { CoverageView } from "@/components/map/coverage-view";

export default async function AdminMap({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; spec?: string; days?: string }>;
}) {
  await requireRole("admin");
  const search = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Field Coverage Map</h1>
        <p className="mt-1 text-[15px] text-muted">
          Where field teams have reached — pins and coverage heat map.
        </p>
      </div>
      <CoverageView search={search} />
    </div>
  );
}
