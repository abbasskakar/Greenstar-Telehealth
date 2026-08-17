import { UserRound } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";

export function ProfileView({
  name,
  role,
  phone,
  specialty,
}: {
  name: string;
  role: Role;
  phone?: string | null;
  specialty?: string | null;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card>
        <CardBody className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserRound size={28} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-foreground">{name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill tone="primary" dot={false}>
                {ROLE_LABEL[role]}
              </StatusPill>
              {specialty && (
                <StatusPill tone="neutral" dot={false}>
                  {specialty}
                </StatusPill>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3 text-sm">
          <Row label="Full name" value={name} />
          <Row label="Role" value={ROLE_LABEL[role]} />
          {phone && <Row label="Phone" value={phone} />}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <SignOutButton className="text-[15px]" />
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
