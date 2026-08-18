import { ShieldCheck, Trash2, Server } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { Card, CardBody } from "@/components/ui/card";
import { ErasureTool } from "@/components/admin/erasure-tool";

export default async function AdminSettings() {
  await requireRole("admin");
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-[15px] text-muted">Security, privacy, and system configuration.</p>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
          <ShieldCheck size={18} className="text-primary" /> Privacy & data protection
        </h2>
        <Card>
          <CardBody className="space-y-2 text-sm text-muted">
            <p><span className="font-medium text-foreground">CNIC encryption:</span> stored encrypted at rest (AES-256-GCM); shown masked (last 4 only).</p>
            <p><span className="font-medium text-foreground">Access control:</span> enforced by Postgres Row-Level Security per role.</p>
            <p><span className="font-medium text-foreground">Audit:</span> every create/update/delete is recorded in the Audit Log.</p>
            <p><span className="font-medium text-foreground">Retention:</span> clinical records are retained while the program is active; erase on request below.</p>
          </CardBody>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
          <Trash2 size={18} className="text-emergency" /> Right to erasure
        </h2>
        <Card>
          <CardBody>
            <p className="mb-4 text-sm text-muted">
              Permanently erase a patient and all their appointments, vitals, notes,
              prescriptions, and lab records. This action is audit-logged and cannot be undone.
            </p>
            <ErasureTool />
          </CardBody>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-bold text-foreground">
          <Server size={18} className="text-info" /> Notifications & emergency
        </h2>
        <Card>
          <CardBody className="space-y-2 text-sm text-muted">
            <p><span className="font-medium text-foreground">Push (FCM) &amp; SMS fallback:</span> connect Firebase and an SMS gateway to enable app-closed push and the emergency SMS escalation chain.</p>
            <p><span className="font-medium text-foreground">Realtime:</span> in-app notifications and the live queue are active now.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
