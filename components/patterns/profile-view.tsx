import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { AvatarUploader } from "@/components/patterns/avatar-uploader";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";

export function ProfileView({
  userId,
  name,
  role,
  phone,
  specialty,
  avatarUrl = null,
}: {
  userId: string;
  name: string;
  role: Role;
  phone?: string | null;
  specialty?: string | null;
  avatarUrl?: string | null;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Profile</h1>

      <Card className="overflow-hidden">
        <div className="gs-brand-gradient h-28" />
        <CardBody className="flex flex-col items-center pt-0 text-center">
          <div className="-mt-20">
            <AvatarUploader userId={userId} initialUrl={avatarUrl} />
          </div>
          <p className="mt-3 max-w-full truncate text-xl font-bold text-foreground">{name}</p>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
            <StatusPill tone="primary" dot={false}>
              {ROLE_LABEL[role]}
            </StatusPill>
            {specialty && (
              <StatusPill tone="neutral" dot={false}>
                {specialty}
              </StatusPill>
            )}
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
