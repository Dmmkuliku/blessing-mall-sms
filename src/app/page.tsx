"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import {
  defaultPathForRole,
  roleLabel,
  type AppRole,
} from "@/lib/permissions";
import type { User } from "@/lib/types";

const ROLES: {
  role: AppRole;
  title: string;
  description: string;
  email: string;
  icon: typeof UserRound;
}[] = [
  {
    role: "ATTENDANT",
    title: "Cashier",
    description: "Process sales at the till and serve customers.",
    email: "attendant@blessingmall.co.tz",
    icon: ShoppingBag,
  },
  {
    role: "MANAGER",
    title: "Store Manager",
    description: "Oversee inventory, purchases, suppliers, and reports.",
    email: "manager@blessingmall.co.tz",
    icon: Briefcase,
  },
  {
    role: "OWNER",
    title: "Store Owner",
    description: "Full access to staff, expenses, settings, and analytics.",
    email: "owner@blessingmall.co.tz",
    icon: Store,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<AppRole | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showDemoHint, setShowDemoHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await api<{ setupComplete: boolean }>("/api/setup", {
          skipAuthRedirect: true,
        });
        if (!cancelled && status.setupComplete === false) {
          router.replace("/setup");
          return;
        }
      } catch {
        /* continue to login if status check fails */
      }

      try {
        const data = await api<{ user: User }>("/api/auth/me", {
          skipAuthRedirect: true,
        });
        if (!cancelled && data.user) {
          router.replace(defaultPathForRole(data.user.role));
          return;
        }
      } catch {
        /* stay on login */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function pickRole(role: AppRole) {
    const preset = ROLES.find((r) => r.role === role);
    setSelected(role);
    setEmail(preset?.email ?? "");
    setPassword("");
    setError("");
    setShowDemoHint(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setError("Please select a role before signing in.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api<{ user: User }>("/api/auth/login", {
        method: "POST",
        json: { email, password, roleHint: selected },
        skipAuthRedirect: true,
      });
      router.replace(defaultPathForRole(data.user.role));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 leaf-pattern" />
      <div
        className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl animate-soft-pulse"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-8 lg:py-12">
        <header className="animate-fade-up flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-soft">
              Supermarket Management System
            </p>
            <p className="font-display text-2xl font-semibold sm:text-3xl">
              Blessing Mall
            </p>
          </div>
        </header>

        <div className="mt-10 grid flex-1 items-center gap-10 lg:mt-14 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="animate-fade-up text-white">
            <h1 className="font-display text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
              Blessing Mall
            </h1>
            <p className="mt-4 max-w-lg text-base text-white/85 sm:text-lg">
              A secure retail operations platform for sales, inventory, purchasing,
              and reporting — designed for Tanzanian supermarket teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/75">
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                Point of Sale
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                Inventory Control
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                Business Reports
              </span>
            </div>
          </section>

          <section className="animate-fade-up-delay rounded-3xl border border-white/20 bg-white/95 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
            {!selected ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest">
                  Choose your role
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-charcoal">
                  Sign in to continue
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Access is limited to your assigned responsibilities.
                </p>
                <div className="mt-6 space-y-3">
                  {ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.role}
                        type="button"
                        onClick={() => pickRole(role.role)}
                        className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-cream px-4 py-4 text-left transition hover:border-forest hover:bg-mint"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-white transition group-hover:scale-105">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-charcoal">
                            {role.title}
                          </span>
                          <span className="block text-xs text-muted">
                            {role.description}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-forest opacity-0 transition group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs font-medium text-forest hover:underline"
                >
                  ← Change role
                </button>
                <h2 className="mt-3 font-display text-2xl font-semibold text-charcoal">
                  Sign in as {roleLabel(selected)}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Use your authorised work email and password.
                </p>

                <form onSubmit={onSubmit} className="mt-6 space-y-4" autoComplete="on">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-charcoal">
                      Work email
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none ring-forest/30 focus:ring-2"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-charcoal">
                      Password
                    </span>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none ring-forest/30 focus:ring-2"
                    />
                  </label>

                  {error ? (
                    <p
                      className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest-dark disabled:opacity-60"
                  >
                    {loading ? "Signing in…" : "Sign in securely"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-4 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDemoHint((v) => !v)}
                    className="text-xs font-medium text-muted hover:text-forest"
                  >
                    {showDemoHint ? "Hide demo access note" : "Training / demo access"}
                  </button>
                  {showDemoHint ? (
                    <p className="mt-2 rounded-xl bg-mint px-3 py-2 text-xs text-muted">
                      Demo accounts use the sample password provided in the project
                      README. Change all passwords before live store use. Do not
                      process real customer payment data in this demonstration
                      environment.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>

        <footer className="mt-10 space-y-1 text-center text-xs text-white/65 sm:text-left">
          <p>Blessing Mall Supermarket · Dar es Salaam, Tanzania</p>
          <p>
            Authorised staff only. Sales and inventory data must be handled
            confidentially and in line with store policy.
          </p>
        </footer>
      </div>
    </div>
  );
}
