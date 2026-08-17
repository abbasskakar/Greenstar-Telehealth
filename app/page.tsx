import { redirect } from "next/navigation";

export default function Home() {
  // Foundation: route into the auth flow. Role-based dashboards arrive with the auth module.
  redirect("/login");
}
