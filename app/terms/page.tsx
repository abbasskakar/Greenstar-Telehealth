import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Terms of Service · Greenstar Telehealth" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 className="mt-5 text-2xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-1 text-sm text-muted">Greenstar Telehealth — community health services.</p>

      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-foreground">
        <section>
          <h2 className="mb-1 font-bold">1. Purpose</h2>
          <p className="text-muted">
            Greenstar Telehealth connects patients in the field with health providers and
            doctors for consultations, referrals, and follow-up. It supports, but does not
            replace, in-person emergency care.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">2. Using the service</h2>
          <p className="text-muted">
            You agree to provide accurate information and to use the service only for
            legitimate health purposes. Accounts are personal and must not be shared.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">3. Medical disclaimer</h2>
          <p className="text-muted">
            Advice given through the platform is based on the information you provide. In an
            emergency, seek the nearest physical medical facility immediately.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">4. Your data</h2>
          <p className="text-muted">
            Your health records are handled as described in our{" "}
            <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-bold">5. Contact</h2>
          <p className="text-muted">
            Questions about these terms can be raised with your health worker or the program
            administrator.
          </p>
        </section>
      </div>
    </div>
  );
}
