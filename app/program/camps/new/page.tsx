import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { CampForm } from "@/components/camps/camp-form";

export default async function NewCamp() {
  await requireRole("program_manager");
  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/program/camps" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Camps
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Schedule Camp</h1>
      <CampForm />
    </div>
  );
}
