import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";

const actionTone: Record<string, string> = {
  insert: "bg-success-soft text-success",
  update: "bg-info-soft text-info",
  delete: "bg-emergency-soft text-emergency",
  login: "bg-surface-2 text-muted",
};

export default async function AdminAudit() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, action, entity, entity_id, created_at, actor:profiles ( full_name )")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as {
    id: number;
    action: string;
    entity: string;
    entity_id: string | null;
    created_at: string;
    actor: { full_name: string } | null;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-1 text-[15px] text-muted">
          Every create, update, and delete across the system.
        </p>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-2">
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Entity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 tabular-nums text-muted">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-foreground">{r.actor?.full_name ?? "System"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionTone[r.action] ?? "bg-surface-2 text-muted"}`}>
                      {r.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{r.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card><CardBody className="py-12 text-center text-sm text-muted">No audit entries yet.</CardBody></Card>
      )}
    </div>
  );
}
