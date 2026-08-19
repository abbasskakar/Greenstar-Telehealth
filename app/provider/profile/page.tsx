import { requireRole } from "@/lib/auth/session";
import { ProfileView } from "@/components/patterns/profile-view";

export default async function ProviderProfile() {
  const { profile } = await requireRole("provider");
  return (
    <ProfileView
      userId={profile.id}
      name={profile.full_name || "Provider"}
      role={profile.role}
      phone={profile.phone}
      specialty={profile.specialty}
      avatarUrl={profile.avatar_url}
    />
  );
}
