import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { SignUpForm } from "@/components/auth/signup-form";

export default async function SignUpPage() {
  const session = await getSessionProfile();
  if (session?.profile) redirect(ROLE_HOME[session.profile.role]);
  return <SignUpForm />;
}
