"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTable } from "@/components/DataTable";
import { Money } from "@/components/Money";
import { api } from "@/lib/api";
import { formatDate, formatTZS } from "@/lib/format";
import type { Sale } from "@/lib/types";

type Tab = "sales" | "products" | "cashflow";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("sales");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [salesData, setSalesData] = useState<{
    summary?: { count: number; gross: number; vat: number; subtotal: number };
    sales?: Sale[];
  }>({});
  const [productRows, setProductRows] = useState<
    { name: string; sku: string; qty: number; revenue: number; profit: number }[]
  >([]);
  const [cashflow, setCashflow] = useState<{
    salesTotal: number;
    expenseTotal: number;
    net: number;
    byMethod: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const qs = new URLSearchParams({ type: tab, from, to });
    (async () => {
      try {
        if (tab === "sales") {
          const data = await api<{
            summary: { count: number; gross: number; vat: number; subtotal: number };
            sales: Sale[];
          }>(`/api/reports?${qs}`);
          if (!cancelled) setSalesData(data);
        } else if (tab === "products") {
          const data = await api<{
            rows: {
              name: string;
              sku: string;
              qty: number;
              revenue: number;
              profit: number;
            }[];
          }>(`/api/reports?${qs}`);
          if (!cancelled) setProductRows(data.rows ?? []);
        } else {
          const data = await api<{
            salesTotal: number;
            expenseTotal: number;
            net: number;
            byMethod: Record<string, number>;
          }>(`/api/reports?${qs}`);
          if (!cancelled) setCashflow(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load report");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, from, to]);

  const methodChart = Object.entries(cashflow?.byMethod ?? {}).map(
    ([method, total]) => ({ method, total })
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-charcoal">
          Reports
        </h2>
        <p className="mt-1 text-sm text-muted">
          Sales, product performance, and cash flow for the selected period.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["sales", "Sales"],
              ["products", "Products"],
              ["cashflow", "Cash flow"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                tab === id
                  ? "bg-forest text-white"
                  : "border border-border bg-white text-charcoal hover:bg-mint"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-muted">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-border bg-white px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-border bg-white px-3 py-2"
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {tab === "sales" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs uppercase text-muted">Transactions</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {salesData.summary?.count ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs uppercase text-muted">Gross sales</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                <Money amount={salesData.summary?.gross ?? 0} />
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs uppercase text-muted">VAT collected</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                <Money amount={salesData.summary?.vat ?? 0} />
              </p>
            </div>
          </div>
          <DataTable
            loading={loading}
            rows={salesData.sales ?? []}
            rowKey={(r) => r.id}
            columns={[
              { key: "r", header: "Receipt", render: (r) => r.receiptNo },
              {
                key: "t",
                header: "Total",
                render: (r) => <Money amount={r.total} />,
              },
              { key: "p", header: "Payment", render: (r) => r.paymentMethod },
              {
                key: "d",
                header: "Date",
                render: (r) => formatDate(r.createdAt, "dd MMM yyyy HH:mm"),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "products" ? (
        <DataTable
          loading={loading}
          rows={productRows}
          rowKey={(r) => r.sku}
          empty="No product sales in this period."
          columns={[
            { key: "n", header: "Product", render: (r) => r.name },
            { key: "s", header: "SKU", render: (r) => r.sku },
            { key: "q", header: "Qty sold", render: (r) => r.qty },
            {
              key: "rev",
              header: "Revenue",
              render: (r) => <Money amount={r.revenue} />,
            },
            {
              key: "pf",
              header: "Profit",
              render: (r) => <Money amount={r.profit} />,
            },
          ]}
        />
      ) : null}

      {tab === "cashflow" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs uppercase text-muted">Sales in</p>
              <p className="mt-1 font-display text-2xl">
                <Money amount={cashflow?.salesTotal ?? 0} />
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs uppercase text-muted">Expenses out</p>
              <p className="mt-1 font-display text-2xl">
                <Money amount={cashflow?.expenseTotal ?? 0} />
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-xs uppercase text-muted">Net</p>
              <p className="mt-1 font-display text-2xl">
                <Money amount={cashflow?.net ?? 0} />
              </p>
            </div>
          </div>
          <div className="h-72 rounded-2xl border border-border bg-white p-4">
            {loading ? (
              <p className="text-sm text-muted">Loading chart…</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c9ddd3" />
                  <XAxis dataKey="method" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatTZS(Number(v))} />
                  <Bar dataKey="total" fill="#0B6E4F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
