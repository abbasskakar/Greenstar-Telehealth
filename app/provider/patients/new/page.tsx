import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { AddPatientForm } from "@/components/provider/add-patient-form";

export default async function AddPatientPage() {
  await requireRole("provider");
  return (
    <div className="space-y-5">
      <Link href="/provider/patients" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Patients
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Register patient</h1>
        <p className="mt-1 text-[15px] text-muted">Add a patient to your list without booking an appointment.</p>
      </div>
      <AddPatientForm />
    </div>
  );
}
