"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { LowStockBadge } from "@/components/LowStockBadge";
import { Modal } from "@/components/Modal";
import { Money } from "@/components/Money";
import { api, ApiError } from "@/lib/api";
import type { Category, Product, User } from "@/lib/types";

const emptyForm = {
  sku: "",
  barcode: "",
  name: "",
  nameSw: "",
  categoryId: "",
  costPrice: "",
  sellPrice: "",
  stockQty: "0",
  reorderLevel: "10",
  unit: "pcs",
  vatRate: "18",
  active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === "MANAGER" || user?.role === "OWNER";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const [prodRes, catRes, me] = await Promise.all([
        api<{ products: Product[] }>(`/api/products${qs}`),
        api<{ categories: Category[] }>("/api/categories"),
        api<{ user: User }>("/api/auth/me"),
      ]);
      setProducts(prodRes.products ?? []);
      setCategories(catRes.categories ?? []);
      setUser(me.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => undefined);
    }, 200);
    return () => clearTimeout(t);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setError("");
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      barcode: p.barcode ?? "",
      name: p.name,
      nameSw: p.nameSw ?? "",
      categoryId: p.categoryId,
      costPrice: String(p.costPrice),
      sellPrice: String(p.sellPrice),
      stockQty: String(p.stockQty),
      reorderLevel: String(p.reorderLevel),
      unit: p.unit,
      vatRate: String(p.vatRate),
      active: p.active,
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const payload = {
      sku: form.sku.trim(),
      barcode: form.barcode.trim() || null,
      name: form.name.trim(),
      nameSw: form.nameSw.trim() || null,
      categoryId: form.categoryId,
      costPrice: Number(form.costPrice),
      sellPrice: Number(form.sellPrice),
      stockQty: Number(form.stockQty),
      reorderLevel: Number(form.reorderLevel),
      unit: form.unit.trim() || "pcs",
      vatRate: Number(form.vatRate),
      active: form.active,
    };
    try {
      if (editing) {
        await api(`/api/products/${editing.id}`, {
          method: "PATCH",
          json: payload,
        });
      } else {
        await api("/api/products", { method: "POST", json: payload });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            Inventory
          </h2>
          <p className="text-sm text-muted">
            Product catalogue with stock levels and reorder alerts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
          />
          {canEdit ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark"
            >
              <Plus className="h-4 w-4" />
              Add product
            </button>
          ) : null}
        </div>
      </div>

      <DataTable<Product>
        loading={loading}
        rows={products}
        rowKey={(r) => r.id}
        empty="No products found."
        columns={[
          {
            key: "name",
            header: "Product",
            render: (r) => (
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted">
                  {r.sku}
                  {r.nameSw ? ` · ${r.nameSw}` : ""}
                </p>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (r) => r.category?.name ?? "—",
          },
          {
            key: "stock",
            header: "Stock",
            render: (r) => (
              <span className="tabular-nums">
                {r.stockQty} {r.unit}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <LowStockBadge
                stockQty={r.stockQty}
                reorderLevel={r.reorderLevel}
              />
            ),
          },
          {
            key: "price",
            header: "Sell price",
            render: (r) => <Money amount={r.sellPrice} />,
          },
          {
            key: "actions",
            header: "",
            render: (r) =>
              canEdit ? (
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-forest hover:bg-mint"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
              ) : null,
          },
        ]}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit product" : "Add product"}
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
              disabled={saving}
              onClick={save}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", "Name", "text"],
              ["nameSw", "Kiswahili name", "text"],
              ["sku", "SKU", "text"],
              ["barcode", "Barcode", "text"],
              ["costPrice", "Cost price (TZS)", "number"],
              ["sellPrice", "Sell price (TZS)", "number"],
              ["stockQty", "Stock qty", "number"],
              ["reorderLevel", "Reorder level", "number"],
              ["unit", "Unit", "text"],
              ["vatRate", "VAT %", "number"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium">{label}</span>
              <input
                type={type}
                value={form[key] as string}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="w-full rounded-xl border border-border px-3 py-2"
              />
            </label>
          ))}
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Category</span>
            <select
              value={form.categoryId}
              onChange={(e) =>
                setForm((f) => ({ ...f, categoryId: e.target.value }))
              }
              className="w-full rounded-xl border border-border px-3 py-2"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.nameSw ? ` (${c.nameSw})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
            />
            Active product
          </label>
        </div>
        {error ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
