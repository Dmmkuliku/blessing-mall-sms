"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import {
  canAccess,
  defaultPathForRole,
  roleLabel,
  type AppRole,
} from "@/lib/permissions";
import type { User } from "@/lib/types";
import { RoleBadge } from "@/components/RoleBadge";

type NavItem = {
  href: string;
  label: string;
  hint?: string;
  icon: ReactNode;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    hint: "Daily overview",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/pos",
    label: "Point of Sale",
    hint: "Checkout & receipts",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    href: "/products",
    label: "Inventory",
    hint: "Products & stock",
    icon: <Package className="h-4 w-4" />,
  },
  {
    href: "/purchases",
    label: "Purchases",
    hint: "Goods received",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    href: "/suppliers",
    label: "Suppliers",
    hint: "Vendor records",
    icon: <Truck className="h-4 w-4" />,
  },
  {
    href: "/expenses",
    label: "Expenses",
    hint: "Operating costs",
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    href: "/reports",
    label: "Reports",
    hint: "Sales & cash flow",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    href: "/staff",
    label: "Staff",
    hint: "User accounts",
    icon: <Users className="h-4 w-4" />,
  },
  {
    href: "/settings",
    label: "Settings",
    hint: "Shop preferences",
    icon: <Settings className="h-4 w-4" />,
  },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<{ user: User }>("/api/auth/me");
        if (cancelled) return;
        setUser(data.user);
        if (!canAccess(data.user.role, pathname)) {
          router.replace(defaultPathForRole(data.user.role));
        }
      } catch {
        if (!cancelled) router.replace("/");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const items = useMemo(() => {
    if (!user) return [];
    return NAV.filter((item) => canAccess(user.role as AppRole, item.href));
  }, [user]);

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-soft-pulse rounded-full bg-forest/20" />
          <p className="mt-3 text-sm text-muted">Loading Blessing Mall…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const pageTitle =
    NAV.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
      ?.label ?? "Blessing Mall";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faf8_0%,#eef7f2_100%)]">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-white transition-transform lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3 border-b border-border px-5 py-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-white shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold leading-tight text-forest">
                Blessing Mall
              </p>
              <p className="truncate text-xs text-muted">Operations · Tanzania</p>
            </div>
            <button
              type="button"
              className="ml-auto rounded-lg p-1.5 text-muted hover:bg-mint lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {items.map((item, index) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`animate-slide-in flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-forest text-white shadow-sm"
                      : "text-charcoal hover:bg-mint"
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className={active ? "text-gold-soft" : "text-forest"}>
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    {item.hint ? (
                      <span
                        className={`block text-[11px] ${
                          active ? "text-white/70" : "text-muted"
                        }`}
                      >
                        {item.hint}
                      </span>
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="rounded-xl bg-mint/70 p-3">
              <p className="truncate text-sm font-semibold text-charcoal">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <div className="mt-2">
                <RoleBadge role={user.role} />
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-charcoal hover:bg-mint"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-charcoal/40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <button
              type="button"
              className="rounded-lg border border-border p-2 text-charcoal hover:bg-mint lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold text-charcoal">
                {pageTitle}
              </h1>
              <p className="truncate text-xs text-muted">
                Signed in as {roleLabel(user.role)}
              </p>
            </div>
            <div className="ml-auto hidden items-center gap-2 sm:flex">
              <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-charcoal">
                Currency: TZS
              </span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
