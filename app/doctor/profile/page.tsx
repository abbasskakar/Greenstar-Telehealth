import { requireRole } from "@/lib/auth/session";
import { ProfileView } from "@/components/patterns/profile-view";

export default async function DoctorProfile() {
  const { profile } = await requireRole("doctor");
  return (
    <ProfileView
      userId={profile.id}
      name={profile.full_name || "Doctor"}
      role={profile.role}
      phone={profile.phone}
      specialty={profile.specialty}
      avatarUrl={profile.avatar_url}
    />
  );
}
