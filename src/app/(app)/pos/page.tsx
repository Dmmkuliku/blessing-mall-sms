"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { Money } from "@/components/Money";
import { ReceiptModal } from "@/components/ReceiptModal";
import { api, ApiError } from "@/lib/api";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
  type Product,
  type Sale,
  type ShopSettings,
} from "@/lib/types";

type CartLine = {
  product: Product;
  qty: number;
};

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paidAmount, setPaidAmount] = useState("");
  const [customerName, setCustomerName] = useState("Walk-in customer");
  const [vatRate, setVatRate] = useState(18);
  const [settings, setSettings] = useState<ShopSettings>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const loadProducts = useCallback(async (q?: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : "";
    const data = await api<{ products: Product[] }>(`/api/products${qs}`);
    setProducts(data.products ?? []);
  }, []);

  useEffect(() => {
    loadProducts().catch(() => setError("Could not load products"));
    api<{ settings: ShopSettings } | ShopSettings>("/api/settings")
      .then((res) => {
        const s =
          "settings" in (res as object)
            ? (res as { settings: ShopSettings }).settings
            : (res as ShopSettings);
        setSettings(s ?? {});
        if (s?.vat_rate) setVatRate(Number(s.vat_rate) || 18);
      })
      .catch(() => {
        /* settings optional for POS */
      });
  }, [loadProducts]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadProducts(query.trim() || undefined).catch(() => undefined);
    }, 250);
    return () => clearTimeout(t);
  }, [query, loadProducts]);

  function addToCart(product: Product) {
    setError("");
    if (product.stockQty <= 0) {
      setError(`${product.name} is out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stockQty) {
          setError(`Only ${product.stockQty} in stock for ${product.name}.`);
          return prev;
        }
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.product.id !== productId) return l;
          const next = Math.max(0, Math.min(qty, l.product.stockQty));
          return { ...l, qty: next };
        })
        .filter((l) => l.qty > 0)
    );
  }

  const subtotal = useMemo(
    () => cart.reduce((s, l) => s + l.product.sellPrice * l.qty, 0),
    [cart]
  );
  const vatAmount = Math.round(subtotal * (vatRate / 100));
  const total = subtotal + vatAmount;
  const paid = Number(paidAmount || 0);
  const change = Math.max(0, paid - total);

  async function completeSale() {
    if (!cart.length) {
      setError("Cart is empty.");
      return;
    }
    if (paid < total && paymentMethod === "CASH") {
      setError("Tendered amount is less than total.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api<{ sale: Sale }>("/api/sales", {
        method: "POST",
        json: {
          customerName: customerName || "Walk-in customer",
          paymentMethod,
          paidAmount: paymentMethod === "CASH" ? paid || total : total,
          items: cart.map((l) => ({
            productId: l.product.id,
            qty: l.qty,
          })),
        },
      });
      setCompletedSale(res.sale);
      setCart([]);
      setPaidAmount("");
      setCustomerName("Walk-in customer");
      await loadProducts(query.trim() || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sale failed");
    } finally {
      setBusy(false);
    }
  }

  function onBarcodeKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const code = query.trim();
    if (!code) return;
    const match =
      products.find((p) => p.barcode === code || p.sku === code) ??
      products.find((p) => p.name.toLowerCase() === code.toLowerCase());
    if (match) {
      addToCart(match);
      setQuery("");
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.9fr]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-white p-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onBarcodeKey}
              placeholder="Search name, SKU, or scan barcode…"
              className="w-full rounded-xl border border-border bg-cream py-3 pl-10 pr-3 text-sm outline-none ring-forest/30 focus:ring-2"
              autoFocus
            />
          </label>
        </div>

        <div className="grid max-h-[70vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addToCart(p)}
              disabled={!p.active || p.stockQty <= 0}
              className="rounded-2xl border border-border bg-white p-4 text-left transition hover:border-forest hover:bg-mint disabled:cursor-not-allowed disabled:opacity-50"
            >
              <p className="font-semibold text-charcoal">{p.name}</p>
              <p className="text-xs text-muted">
                {p.sku}
                {p.barcode ? ` · ${p.barcode}` : ""}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <Money amount={p.sellPrice} className="font-display text-lg font-semibold text-forest" />
                <span className="text-xs text-muted">
                  In stock: {p.stockQty} {p.unit}
                </span>
              </div>
            </button>
          ))}
          {!products.length ? (
            <p className="col-span-full rounded-2xl border border-dashed border-border bg-white p-8 text-center text-sm text-muted">
              No products match your search.
            </p>
          ) : null}
        </div>
      </section>

      <aside className="flex flex-col rounded-2xl border border-border bg-white">
        <div className="border-b border-border px-4 py-4">
          <h2 className="font-display text-xl font-semibold text-charcoal">
            Sale cart
          </h2>
          <p className="text-xs text-muted">
            {cart.length} line item{cart.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {cart.map((line) => (
            <div
              key={line.product.id}
              className="rounded-xl border border-border/80 bg-cream/60 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-charcoal">{line.product.name}</p>
                  <Money
                    amount={line.product.sellPrice}
                    className="text-xs text-muted"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCart((prev) =>
                      prev.filter((l) => l.product.id !== line.product.id)
                    )
                  }
                  className="rounded-lg p-1 text-muted hover:bg-white hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-white p-1.5"
                    onClick={() => setQty(line.product.id, line.qty - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={line.product.stockQty}
                    value={line.qty}
                    onChange={(e) =>
                      setQty(line.product.id, Number(e.target.value) || 1)
                    }
                    className="w-14 rounded-lg border border-border bg-white px-2 py-1 text-center text-sm"
                  />
                  <button
                    type="button"
                    className="rounded-lg border border-border bg-white p-1.5"
                    onClick={() => setQty(line.product.id, line.qty + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Money
                  amount={line.product.sellPrice * line.qty}
                  className="font-semibold"
                />
              </div>
            </div>
          ))}
          {!cart.length ? (
            <p className="py-10 text-center text-sm text-muted">
              Scan or tap products to start a sale.
            </p>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-border bg-mint/40 px-4 py-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Customer</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Payment method</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                    paymentMethod === m.value
                      ? "bg-forest text-white"
                      : "bg-white text-charcoal ring-1 ring-border"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "CASH" ? (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Amount tendered</span>
              <input
                type="number"
                min={0}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={String(total || "")}
                className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm"
              />
            </label>
          ) : null}

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <Money amount={subtotal} />
            </div>
            <div className="flex justify-between text-muted">
              <span>VAT ({vatRate}%)</span>
              <Money amount={vatAmount} />
            </div>
            <div className="flex justify-between font-display text-lg font-semibold text-charcoal">
              <span>Total</span>
              <Money amount={total} />
            </div>
            {paymentMethod === "CASH" ? (
              <div className="flex justify-between text-forest">
                <span>Change</span>
                <Money amount={change} className="font-semibold" />
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={busy || !cart.length}
            onClick={completeSale}
            className="w-full rounded-xl bg-forest py-3 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-50"
          >
            {busy ? "Processing…" : "Complete sale · Maliza"}
          </button>
        </div>
      </aside>

      <ReceiptModal
        open={Boolean(completedSale)}
        onClose={() => setCompletedSale(null)}
        sale={completedSale}
        shopName={settings.shop_name}
        shopPhone={settings.shop_phone}
        footer={settings.receipt_footer}
      />
    </div>
  );
}
