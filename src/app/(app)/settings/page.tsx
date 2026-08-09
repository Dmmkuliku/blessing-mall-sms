"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ShopSettings } from "@/lib/types";

const FIELDS: { key: keyof ShopSettings; label: string; hint?: string }[] = [
  { key: "shop_name", label: "Shop name" },
  { key: "shop_location", label: "Location" },
  { key: "shop_phone", label: "Phone" },
  { key: "currency", label: "Currency" },
  { key: "vat_rate", label: "VAT rate (%)", hint: "Tanzania standard VAT is 18%" },
  { key: "receipt_footer", label: "Receipt footer" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ settings: ShopSettings }>("/api/settings")
      .then((res) => setSettings(res.settings ?? {}))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload: Record<string, string> = {};
      for (const f of FIELDS) {
        payload[f.key] = String(settings[f.key] ?? "");
      }
      const res = await api<{ settings: ShopSettings }>("/api/settings", {
        method: "PATCH",
        json: payload,
      });
      setSettings(res.settings ?? payload);
      setMessage("Settings saved.");
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-charcoal">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted">
          Shop identity, VAT, and receipt defaults for Blessing Mall.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-forest">
          {message}
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-border bg-white p-5">
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 block font-medium">{f.label}</span>
            <input
              value={settings[f.key] ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, [f.key]: e.target.value }))
              }
              className="w-full rounded-xl border border-border px-3 py-2"
            />
            {f.hint ? (
              <span className="mt-1 block text-xs text-muted">{f.hint}</span>
            ) : null}
          </label>
        ))}

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
