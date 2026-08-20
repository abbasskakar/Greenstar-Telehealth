import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Circle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { DeleteUserButton } from "@/components/admin/delete-user";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";

const statusTone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  pending: "warning",
  claimed: "info",
  in_consult: "info",
  completed: "success",
  cancelled: "neutral",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile: me } = await requireRole("admin");
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("profiles")
    .select("id, full_name, role, specialty, phone, duty, is_active, avatar_url, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!user) notFound();

  const staff = user.role === "doctor" || user.role === "provider";
  const isDoctor = user.role === "doctor";

  // Their activity: created (provider/public) or assigned (doctor)
  const { data: appts } = await admin
    .from("appointments")
    .select("id, type, status, specialty, created_at, assigned_doctor_name")
    .or(isDoctor ? `assigned_doctor_id.eq.${id}` : `created_by.eq.${id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  const on = user.duty === "on_duty";

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Users
      </Link>

      {/* Profile */}
      <Card className="overflow-hidden">
        <div className="gs-brand-gradient h-20" />
        <CardBody className="pt-0">
          <div className="-mt-12">
            <Avatar url={user.avatar_url} name={user.full_name} size={80} className="border-4 border-surface" />
          </div>
          <p className="mt-3 text-xl font-bold text-foreground">{user.full_name || "Unnamed"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <StatusPill tone="primary" dot={false}>{ROLE_LABEL[user.role as Role]}</StatusPill>
            {user.specialty && <StatusPill tone="neutral" dot={false}>{user.specialty}</StatusPill>}
            <StatusPill tone={user.is_active ? "success" : "neutral"}>{user.is_active ? "Active" : "Disabled"}</StatusPill>
          </div>

          <div className="mt-4 space-y-2.5 border-t border-border pt-4">
            <Row label="Role" value={ROLE_LABEL[user.role as Role]} />
            {user.specialty && <Row label="Specialty" value={user.specialty} />}
            {user.phone && <Row label="Phone" value={user.phone} />}
            {staff && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted">Duty</span>
                <span className={`flex items-center gap-1.5 font-medium ${on ? "text-success" : "text-muted"}`}>
                  <Circle size={9} className={on ? "fill-success text-success" : "fill-muted-2 text-muted-2"} />
                  {on ? "On Duty" : "Off Duty"}
                </span>
              </div>
            )}
            <Row label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
          </div>
        </CardBody>
      </Card>

      {/* Activity */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <CalendarDays size={18} className="text-primary" />
          {isDoctor ? "Handled cases" : "Created appointments"} ({appts?.length ?? 0})
        </h2>
        {appts?.length ? (
          <div className="space-y-2">
            {appts.map((a) => (
              <Card key={a.id}>
                <CardBody className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {a.specialty} {a.type === "emergency" && <span className="text-xs font-bold text-emergency">· EMERGENCY</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {new Date(a.created_at).toLocaleDateString()}
                      {a.assigned_doctor_name ? ` · ${a.assigned_doctor_name}` : ""}
                    </p>
                  </div>
                  <StatusPill tone={statusTone[a.status] ?? "neutral"}>{a.status}</StatusPill>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No appointments.</p>
        )}
      </section>

      {/* Delete — not for admins or yourself */}
      {user.role !== "admin" && user.id !== me.id && (
        <div className="border-t border-border pt-5">
          <DeleteUserButton userId={user.id} name={user.full_name || "this user"} />
        </div>
      )}
    </div>
  );
}
