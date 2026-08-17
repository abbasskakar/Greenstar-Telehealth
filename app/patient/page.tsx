import Link from "next/link";
import { Plus, CalendarHeart } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { Card, CardBody } from "@/components/ui/card";

export default async function PatientHome() {
  const { profile } = await requireRole("public");
  const firstName = (profile.full_name || "there").split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted">Welcome</p>
        <h1 className="text-2xl font-bold text-foreground">{firstName}</h1>
        <p className="mt-1 text-[15px] text-muted">
          Here is your care overview for today.
        </p>
      </div>

      <Link href="/patient/appointments">
        <Card className="transition-colors hover:border-primary">
          <CardBody className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-contrast">
              <Plus size={22} />
            </span>
            <span className="text-[15px] font-semibold text-foreground">
              Book an appointment
            </span>
          </CardBody>
        </Card>
      </Link>

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          My Appointments
        </h2>
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
              <CalendarHeart size={22} />
            </span>
            <p className="text-[15px] font-medium text-foreground">
              No appointments yet
            </p>
            <p className="max-w-xs text-sm text-muted">
              Booking a consultation with a doctor arrives in the appointments
              module. Your account is ready.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
