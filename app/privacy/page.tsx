import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Privacy Policy · Greenstar Telehealth" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 className="mt-5 text-2xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted">How Greenstar Telehealth handles your information.</p>

      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-foreground">
        <section>
          <h2 className="mb-1 font-bold">1. What we collect</h2>
          <p className="text-muted">
            Your name, contact details, CNIC (stored encrypted), and the health information
            you or your provider record — vitals, complaints, prescriptions, and lab results.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">2. How it is used</h2>
          <p className="text-muted">
            Your information is used only to deliver care: routing your case to a doctor,
            keeping your medical record, and improving coverage in your area. Location is
            recorded per visit to map where field teams have reached.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">3. Who can see it</h2>
          <p className="text-muted">
            Only the providers and doctors involved in your care, and authorized program
            staff. Your CNIC is stored encrypted and shown only as the last four digits.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">4. Your rights</h2>
          <p className="text-muted">
            You may request a copy or the erasure of your record. Erasure permanently removes
            your clinical data and any linked login.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">5. Contact</h2>
          <p className="text-muted">
            To exercise these rights, contact your health worker or the program administrator.
          </p>
        </section>
      </div>
    </div>
  );
}
