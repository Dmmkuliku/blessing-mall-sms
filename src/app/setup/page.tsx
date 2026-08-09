"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { api, ApiError } from "@/lib/api";

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    shopName: "Blessing Mall Supermarket",
    shopLocation: "Dar es Salaam, Tanzania",
    shopPhone: "",
    ownerName: "",
    ownerEmail: "owner@blessingmall.co.tz",
    ownerPassword: "",
    confirmPassword: "",
    vatRate: "18",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await api<{ setupComplete: boolean }>("/api/setup", {
          skipAuthRedirect: true,
        });
        if (!cancelled && status.setupComplete) {
          router.replace("/");
          return;
        }
      } catch {
        /* allow setup form if endpoint reachable with incomplete state */
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.ownerPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/setup", {
        method: "POST",
        skipAuthRedirect: true,
        json: {
          shopName: form.shopName,
          shopLocation: form.shopLocation,
          shopPhone: form.shopPhone,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPassword: form.ownerPassword,
          vatRate: form.vatRate,
        },
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Setup could not be completed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-muted">Checking installation status…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faf8_0%,#eef7f2_100%)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-white">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
              First-run setup
            </p>
            <h1 className="font-display text-2xl font-semibold text-charcoal">
              Prepare Blessing Mall for daily use
            </h1>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-3xl border border-border bg-white p-6 shadow-sm"
        >
          <p className="text-sm text-muted">
            Complete this once on the institute laptop after installation. You will
            set the shop identity and the store owner password.
          </p>

          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold text-charcoal">
              Business details
            </legend>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Business name</span>
              <input
                required
                value={form.shopName}
                onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
                className="w-full rounded-xl border border-border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Location</span>
              <input
                value={form.shopLocation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, shopLocation: e.target.value }))
                }
                className="w-full rounded-xl border border-border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Phone</span>
              <input
                value={form.shopPhone}
                onChange={(e) => setForm((f) => ({ ...f, shopPhone: e.target.value }))}
                className="w-full rounded-xl border border-border px-3 py-2.5"
                placeholder="+255 ..."
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">VAT rate (%)</span>
              <input
                value={form.vatRate}
                onChange={(e) => setForm((f) => ({ ...f, vatRate: e.target.value }))}
                className="w-full rounded-xl border border-border px-3 py-2.5"
              />
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-display text-lg font-semibold text-charcoal">
              Store owner account
            </legend>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Owner full name</span>
              <input
                required
                value={form.ownerName}
                onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                className="w-full rounded-xl border border-border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Owner email</span>
              <input
                required
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                className="w-full rounded-xl border border-border px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Owner password</span>
              <input
                required
                type="password"
                autoComplete="new-password"
                value={form.ownerPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ownerPassword: e.target.value }))
                }
                className="w-full rounded-xl border border-border px-3 py-2.5"
              />
              <span className="mt-1 block text-xs text-muted">
                At least 8 characters, including a letter and a number.
              </span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Confirm password</span>
              <input
                required
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                className="w-full rounded-xl border border-border px-3 py-2.5"
              />
            </label>
          </fieldset>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
          >
            {busy ? "Saving setup…" : "Complete setup and open dashboard"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
