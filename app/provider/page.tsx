import Link from "next/link";
import { Plus, History, Users, Stethoscope } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { Card, CardBody } from "@/components/ui/card";

export default async function ProviderHome() {
  const { profile } = await requireRole("provider");
  const firstName = (profile.full_name || "Provider").split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted">Welcome back</p>
        <h1 className="text-2xl font-bold text-foreground">{firstName}</h1>
        <p className="mt-1 text-[15px] text-muted">
          Here is your patient overview for today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/provider/patients">
          <Card className="h-full transition-colors hover:border-primary">
            <CardBody className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-contrast">
                <Plus size={22} />
              </span>
              <span className="font-semibold text-foreground">
                New Appointment
              </span>
            </CardBody>
          </Card>
        </Link>
        <Link href="/provider/patients">
          <Card className="h-full transition-colors hover:border-primary">
            <CardBody className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-primary">
                <Users size={22} />
              </span>
              <span className="font-semibold text-foreground">Patients</span>
            </CardBody>
          </Card>
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Recent Appointments
          </h2>
          <Link
            href="/provider/patients"
            className="text-sm font-semibold text-primary"
          >
            View all
          </Link>
        </div>
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
              <History size={22} />
            </span>
            <p className="text-[15px] font-medium text-foreground">
              No appointments yet
            </p>
            <p className="max-w-xs text-sm text-muted">
              Appointment creation with vitals arrives in the next module. Your
              account is ready.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm text-muted">
        <Stethoscope size={16} className="text-primary" />
        Signed in as a field provider.
      </div>
    </div>
  );
}
