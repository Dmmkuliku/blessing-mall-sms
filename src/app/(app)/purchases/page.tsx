"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Modal } from "@/components/Modal";
import { Money } from "@/components/Money";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Product, Purchase, Supplier } from "@/lib/types";

type LineDraft = { productId: string; qty: string; unitCost: string };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([
    { productId: "", qty: "1", unitCost: "0" },
  ]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [p, s, pr] = await Promise.all([
      api<{ purchases: Purchase[] }>("/api/purchases"),
      api<{ suppliers: Supplier[] }>("/api/suppliers"),
      api<{ products: Product[] }>("/api/products"),
    ]);
    setPurchases(p.purchases ?? []);
    setSuppliers(s.suppliers ?? []);
    setProducts(pr.products ?? []);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [load]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const items = lines
        .filter((l) => l.productId && Number(l.qty) > 0)
        .map((l) => ({
          productId: l.productId,
          qty: Number(l.qty),
          unitCost: Number(l.unitCost),
        }));
      if (!supplierId || !items.length) {
        throw new Error("Select a supplier and at least one product line");
      }
      await api("/api/purchases", {
        method: "POST",
        json: { supplierId, notes: notes || null, items },
      });
      setOpen(false);
      setNotes("");
      setLines([{ productId: "", qty: "1", unitCost: "0" }]);
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
            Purchases
          </h2>
          <p className="mt-1 text-sm text-muted">
            Record goods received from suppliers. Stock quantities update automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark"
        >
          <Plus className="h-4 w-4" /> Receive stock
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <DataTable
        loading={loading}
        rows={purchases}
        rowKey={(r) => r.id}
        empty="No purchases yet."
        columns={[
          { key: "ref", header: "Reference", render: (r) => r.reference },
          {
            key: "supplier",
            header: "Supplier",
            render: (r) => r.supplier?.name ?? "—",
          },
          {
            key: "total",
            header: "Total cost",
            render: (r) => <Money amount={r.totalCost} />,
          },
          {
            key: "by",
            header: "Received by",
            render: (r) => r.user?.name ?? "—",
          },
          {
            key: "when",
            header: "Date",
            render: (r) => formatDateTime(r.createdAt),
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Receive purchase"
        wide
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
              {busy ? "Saving…" : "Post purchase"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Supplier</span>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2"
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-3">
                <select
                  value={line.productId}
                  onChange={(e) => {
                    const productId = e.target.value;
                    const product = products.find((p) => p.id === productId);
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx
                          ? {
                              productId,
                              qty: l.qty,
                              unitCost: String(product?.costPrice ?? l.unitCost),
                            }
                          : l
                      )
                    );
                  }}
                  className="rounded-xl border border-border px-3 py-2 sm:col-span-1"
                >
                  <option value="">Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={line.qty}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, qty: e.target.value } : l
                      )
                    )
                  }
                  placeholder="Qty"
                  className="rounded-xl border border-border px-3 py-2"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={line.unitCost}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l, i) =>
                        i === idx ? { ...l, unitCost: e.target.value } : l
                      )
                    )
                  }
                  placeholder="Unit cost (TZS)"
                  className="rounded-xl border border-border px-3 py-2"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setLines((prev) => [
                  ...prev,
                  { productId: "", qty: "1", unitCost: "0" },
                ])
              }
              className="text-sm font-medium text-forest"
            >
              + Add line
            </button>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border px-3 py-2"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
