import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card, CardBody } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary-soft to-transparent" />
      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <Logo withWordmark />
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <KeyRound size={26} />
          </span>
          <h1 className="text-[26px] font-bold text-foreground">Reset your password</h1>
          <p className="mt-1.5 text-[15px] text-muted">Choose your account type</p>
        </div>

        <div className="space-y-3">
          <Card>
            <CardBody className="space-y-1.5">
              <p className="font-semibold text-foreground">Staff (Provider / Doctor / Program Manager)</p>
              <p className="text-sm text-muted">
                Ask your <span className="font-medium text-foreground">administrator</span> to reset your password from the Users panel. You&apos;ll receive new credentials to sign in.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-1.5">
              <p className="font-semibold text-foreground">Public patients</p>
              <p className="text-sm text-muted">
                A secure OTP reset to your registered phone number is enabled once the SMS gateway is connected. For now, please contact the health worker who registered you.
              </p>
            </CardBody>
          </Card>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-xs text-muted">
            <ShieldCheck size={15} className="text-primary" />
            Passwords are stored hashed (Bcrypt); no one can view your existing password.
          </div>
        </div>

        <Link href="/login" className="mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Back to login
        </Link>
      </main>
    </div>
  );
}
