import { TopBar } from "./top-bar";
import { BottomNav, type MobileVariant } from "./bottom-nav";
import { OnboardingTour } from "@/components/onboarding-tour";
import { PushRegister } from "@/components/push-register";

export function MobileShell({
  variant,
  children,
}: {
  variant: MobileVariant;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <TopBar />
      <main id="main-content" className="gs-rise mx-auto w-full min-h-0 max-w-lg flex-1 overflow-y-auto px-4 py-5">
        {children}
      </main>
      <BottomNav variant={variant} />
      {/* Field-worker setup tour for staff; patients get their own PatientTour. */}
      {variant !== "patient" && <OnboardingTour />}
      <PushRegister />
    </div>
  );
}
