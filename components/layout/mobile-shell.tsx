import { TopBar } from "./top-bar";
import { BottomNav, type MobileVariant } from "./bottom-nav";

export function MobileShell({
  variant,
  children,
}: {
  variant: MobileVariant;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TopBar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">{children}</main>
      <BottomNav variant={variant} />
    </div>
  );
}
