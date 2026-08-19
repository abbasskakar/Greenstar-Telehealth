import { requireRole } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { StaffProfileEditor } from "@/components/patterns/staff-profile-editor";

export default async function ProviderProfile() {
  const { profile } = await requireRole("provider");
  return (
    <StaffProfileEditor
      userId={profile.id}
      roleLabel={ROLE_LABEL.provider}
      specialty={profile.specialty}
      initialName={profile.full_name || ""}
      initialPhone={profile.phone || ""}
      initialAvatar={profile.avatar_url}
    />
  );
}
