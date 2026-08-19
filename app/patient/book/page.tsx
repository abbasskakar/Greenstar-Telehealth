import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { BookForm } from "@/components/patient/book-form";

export default async function BookPage() {
  const { profile } = await requireRole("public");
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("full_name, age, gender")
    .eq("owner_id", profile.id)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book an appointment</h1>
        <p className="mt-1 text-[15px] text-muted">Request a consultation with a doctor.</p>
      </div>
      <BookForm
        initialName={patient?.full_name ?? profile.full_name ?? ""}
        initialAge={patient?.age ?? null}
        initialGender={patient?.gender ?? ""}
      />
    </div>
  );
}
