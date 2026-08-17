import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await getSessionProfile();
  if (session?.profile) redirect(ROLE_HOME[session.profile.role]);
  return <LoginForm />;
}
