import { requireRole } from "@/lib/auth/session";
import { ProfileView } from "@/components/patterns/profile-view";

export default async function DoctorProfile() {
  const { profile } = await requireRole("doctor");
  return (
    <ProfileView
      name={profile.full_name || "Doctor"}
      role={profile.role}
      phone={profile.phone}
      specialty={profile.specialty}
    />
  );
}
