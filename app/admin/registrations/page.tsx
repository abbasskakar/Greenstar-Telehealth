import { UserRound, IdCard, CalendarClock } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export default async function PublicRegistrations() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username, is_active, created_at")
    .eq("role", "public")
    .order("created_at", { ascending: false })
    .limit(500);

  const users = (data ?? []) as {
    id: string;
    full_name: string | null;
    username: string | null;
    is_active: boolean;
    created_at: string;
  }[];

  const now = new Date().getTime();
  const dayMs = 86_400_000;
  const last7 = users.filter((u) => now - new Date(u.created_at).getTime() < 7 * dayMs).length;
  const last30 = users.filter((u) => now - new Date(u.created_at).getTime() < 30 * dayMs).length;

  const stats = [
    { label: "Total registrations", value: users.length },
    { label: "Last 7 days", value: last7 },
    { label: "Last 30 days", value: last30 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Public Registrations</h1>
        <p className="mt-1 text-[15px] text-muted">
          People who self-registered via CNIC and can book their own appointments.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                {s.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {users.length ? (
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <UserRound size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {u.full_name ?? "Unnamed"}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                      {u.username && (
                        <span className="flex items-center gap-1">
                          <IdCard size={12} /> {u.username}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <CalendarClock size={12} />
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <StatusPill tone={u.is_active ? "success" : "neutral"}>
                    {u.is_active ? "Active" : "Disabled"}
                  </StatusPill>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
              <UserRound size={22} />
            </span>
            <p className="text-[15px] font-medium text-foreground">No public registrations yet</p>
            <p className="max-w-xs text-sm text-muted">
              When people self-register via CNIC, they’ll appear here.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
