import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";

export default async function Home() {
  const session = await getSessionProfile();
  if (session?.profile) redirect(ROLE_HOME[session.profile.role]);
  redirect("/login");
}
