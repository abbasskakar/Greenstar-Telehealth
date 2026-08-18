import { requireRole } from "@/lib/auth/session";
import { BookForm } from "@/components/patient/book-form";

export default async function BookPage() {
  await requireRole("public");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book an appointment</h1>
        <p className="mt-1 text-[15px] text-muted">Request a consultation with a doctor.</p>
      </div>
      <BookForm />
    </div>
  );
}
