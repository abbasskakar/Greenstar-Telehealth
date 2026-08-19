"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarDays,
  Settings,
  Tent,
  BarChart3,
  Map,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { SignOutButton } from "./sign-out-button";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

export type SidebarVariant = "admin" | "program";

const NAVS: Record<SidebarVariant, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/registrations", label: "Registrations", icon: UserPlus },
    { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/admin/map", label: "Coverage Map", icon: Map },
    { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ],
  program: [
    { href: "/program", label: "Dashboard", icon: LayoutDashboard },
    { href: "/program/camps", label: "Camps & Events", icon: Tent },
    { href: "/program/map", label: "Coverage Map", icon: Map },
    { href: "/program/reports", label: "Reports", icon: BarChart3 },
  ],
};

export function Sidebar({
  variant,
  name,
  roleLabel,
}: {
  variant: SidebarVariant;
  name: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const items = NAVS[variant];
  return (
    <aside className="sticky top-0 flex h-dvh w-[264px] shrink-0 flex-col border-r border-border bg-surface px-4 py-5">
      <div className="flex items-center justify-between px-2">
        <Logo withWordmark />
        <ThemeToggle />
      </div>

      <nav className="mt-8 flex-1">
        <ul className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-all",
                    active
                      ? "bg-primary text-primary-contrast shadow-brand"
                      : "text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  <Icon size={19} strokeWidth={active ? 2.3 : 1.9} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="mb-2.5 text-xs text-muted-2">{roleLabel}</p>
        <SignOutButton />
      </div>
    </aside>
  );
}
