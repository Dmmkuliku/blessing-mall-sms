"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Money } from "@/components/Money";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Expense } from "@/lib/types";

const empty = { category: "Utilities", description: "", amount: "" };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await api<{ expenses: Expense[] }>("/api/expenses");
    setExpenses(data.expenses ?? []);
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
      await api("/api/expenses", {
        method: "POST",
        json: {
          category: form.category,
          description: form.description,
          amount: Number(form.amount),
        },
      });
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
            Expenses
          </h2>
          <p className="mt-1 text-sm text-muted">
            Track rent, utilities, transport, and other cash outflows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark"
        >
          <Plus className="h-4 w-4" /> Add expense
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <DataTable
        loading={loading}
        rows={expenses}
        rowKey={(r) => r.id}
        empty="No expenses recorded."
        columns={[
          { key: "cat", header: "Category", render: (r) => r.category },
          { key: "desc", header: "Description", render: (r) => r.description },
          {
            key: "amount",
            header: "Amount",
            render: (r) => <Money amount={r.amount} />,
          },
          { key: "by", header: "By", render: (r) => r.user?.name ?? "—" },
          {
            key: "when",
            header: "Date",
            render: (r) => formatDateTime(r.spentAt),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record expense"
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
              disabled={busy}
              onClick={submit}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border border-border px-3 py-2"
            >
              {["Utilities", "Rent", "Transport", "Salaries", "Supplies", "Other"].map(
                (c) => (
                  <option key={c}>{c}</option>
                )
              )}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Amount (TZS)</span>
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
