import { requireRole } from "@/lib/auth/session";
import { PatientProfileEditor } from "@/components/patient/profile-editor";

export default async function PatientProfile() {
  const { profile } = await requireRole("public");
  return (
    <PatientProfileEditor
      initialName={profile.full_name || ""}
      initialPhone={profile.phone || ""}
    />
  );
}
