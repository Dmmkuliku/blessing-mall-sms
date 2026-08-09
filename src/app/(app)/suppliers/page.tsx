"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { api, ApiError } from "@/lib/api";
import type { Supplier } from "@/lib/types";

const empty = { name: "", phone: "", email: "", address: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ suppliers: Supplier[] }>("/api/suppliers");
    setSuppliers(data.suppliers ?? []);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [load]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api("/api/suppliers", { method: "POST", json: form });
      setOpen(false);
      setForm(empty);
      await load();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            Suppliers
          </h2>
          <p className="mt-1 text-sm text-muted">
            Maintain vendor contacts used for purchasing and stock replenishment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark"
        >
          <Plus className="h-4 w-4" /> Add supplier
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <DataTable
        loading={loading}
        rows={suppliers}
        rowKey={(r) => r.id}
        empty="No suppliers yet."
        columns={[
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
          { key: "email", header: "Email", render: (r) => r.email || "—" },
          { key: "address", header: "Address", render: (r) => r.address || "—" },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New supplier"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !form.name.trim()}
              onClick={submit}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {(
            [
              ["name", "Name"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["address", "Address"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl border border-border px-3 py-2"
              />
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
