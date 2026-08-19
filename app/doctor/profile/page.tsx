import { requireRole } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { StaffProfileEditor } from "@/components/patterns/staff-profile-editor";

export default async function DoctorProfile() {
  const { profile } = await requireRole("doctor");
  return (
    <StaffProfileEditor
      userId={profile.id}
      roleLabel={ROLE_LABEL.doctor}
      specialty={profile.specialty}
      initialName={profile.full_name || ""}
      initialPhone={profile.phone || ""}
      initialAvatar={profile.avatar_url}
    />
  );
}
