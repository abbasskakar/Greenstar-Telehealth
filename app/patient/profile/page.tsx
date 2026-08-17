import { requireRole } from "@/lib/auth/session";
import { ProfileView } from "@/components/patterns/profile-view";

export default async function PatientProfile() {
  const { profile } = await requireRole("public");
  return (
    <ProfileView
      name={profile.full_name || "Patient"}
      role={profile.role}
      phone={profile.phone}
    />
  );
}
