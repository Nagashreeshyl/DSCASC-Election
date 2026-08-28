"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { signOut } from "@/lib/services/authService";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardShell({
  role,
  nav,
  children
}: {
  role: UserRole;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const { fbUser, userDoc } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const base = `/${role}`;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r-2 border-black bg-white transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center border-b-2 border-black px-5">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md border-2 border-transparent px-3 py-2.5 text-sm font-bold transition-all",
                  active ? "border-black bg-brand-yellow shadow-brutal-sm" : "hover:bg-brand-yellowMuted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b-2 border-black bg-white px-5">
          <button
            className="rounded-md border-2 border-black p-2 lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="ml-auto flex items-center gap-3">
            {fbUser?.photoURL && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fbUser.photoURL} alt="" className="h-9 w-9 rounded-full border-2 border-black" />
            )}
            <div className="text-right">
              <p className="text-sm font-bold leading-tight">{userDoc?.displayName}</p>
              <p className="text-xs uppercase text-muted-foreground">{role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>
        <main className="container max-w-6xl py-8">{children}</main>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
    </div>
  );
}
