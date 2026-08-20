import { ShieldCheck, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { Card, CardBody } from "@/components/ui/card";
import { ErasureTool } from "@/components/admin/erasure-tool";

export default async function AdminSettings() {
  await requireRole("admin");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-[15px] text-muted">Privacy and data controls.</p>
      </div>

      {/* Right to erasure — the one destructive data control */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
          <Trash2 size={18} className="text-emergency" /> Right to erasure
        </h2>
        <Card>
          <CardBody>
            <p className="mb-4 text-sm text-muted">
              Permanently erase a patient and all their appointments, vitals, notes,
              prescriptions, and lab records. Audit-logged and cannot be undone.
            </p>
            <ErasureTool />
          </CardBody>
        </Card>
      </div>

      {/* Compact security reference */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-foreground">
          <ShieldCheck size={18} className="text-primary" /> Security
        </h2>
        <Card>
          <CardBody className="space-y-2 text-sm text-muted">
            <p><span className="font-medium text-foreground">CNIC:</span> encrypted at rest (AES-256-GCM), shown masked.</p>
            <p><span className="font-medium text-foreground">Access:</span> Row-Level Security enforced per role.</p>
            <p><span className="font-medium text-foreground">Audit:</span> user, patient, and clinical changes are recorded in the Audit Log.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
