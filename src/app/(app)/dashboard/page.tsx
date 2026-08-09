"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  PackageX,
  Receipt,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DataTable } from "@/components/DataTable";
import { LowStockBadge } from "@/components/LowStockBadge";
import { Money } from "@/components/Money";
import { StatCard } from "@/components/StatCard";
import { api } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import type { DashboardData, Product, Sale } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api<DashboardData>("/api/dashboard");
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-danger">
        {error || "Dashboard data unavailable."}
      </div>
    );
  }

  const chartData = (data.salesLast7Days ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date, "EEE"),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-charcoal">
          Operations overview
        </h2>
        <p className="mt-1 text-sm text-muted">
          Today&apos;s sales, stock alerts, and spending at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's sales"
          value={<Money amount={data.todaySales} />}
          hint="Gross sales today"
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          label="Transactions"
          value={data.todayTransactions}
          hint="Completed checkouts"
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          label="Low stock"
          value={data.lowStockCount}
          hint="Items below reorder level"
          icon={<PackageX className="h-5 w-5" />}
        />
        <StatCard
          label="Expenses"
          value={
            <Money amount={data.todayExpenses ?? data.monthExpenses ?? 0} />
          }
          hint="Operating costs today"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-white p-5">
          <h3 className="font-display text-lg font-semibold text-charcoal">
            Sales · last 7 days
          </h3>
          <p className="mb-4 text-sm text-muted">Daily sales trend</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0B6E4F" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0B6E4F" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#c9ddd3" />
                <XAxis dataKey="label" tick={{ fill: "#5c6b63", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#5c6b63", fontSize: 12 }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value) => [
                    typeof value === "number"
                      ? `TZS ${Math.round(value).toLocaleString("en-TZ")}`
                      : String(value ?? ""),
                    "Sales",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0B6E4F"
                  fill="url(#salesFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section>
          <h3 className="mb-3 font-display text-lg font-semibold text-charcoal">
            Low stock alerts
          </h3>
          <DataTable<Product>
            rows={data.lowStockProducts ?? []}
            rowKey={(r) => r.id}
            empty="All stock levels look healthy."
            columns={[
              {
                key: "name",
                header: "Product",
                render: (r) => (
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted">{r.sku}</p>
                  </div>
                ),
              },
              {
                key: "qty",
                header: "Qty",
                render: (r) => (
                  <span className="tabular-nums">
                    {r.stockQty} / {r.reorderLevel}
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
            ]}
          />
        </section>
      </div>

      <section>
        <h3 className="mb-3 font-display text-lg font-semibold text-charcoal">
          Recent sales
        </h3>
        <DataTable<Sale>
          rows={data.recentSales ?? []}
          rowKey={(r) => r.id}
          empty="No sales yet today."
          columns={[
            {
              key: "receipt",
              header: "Receipt",
              render: (r) => r.receiptNo,
            },
            {
              key: "time",
              header: "Time",
              render: (r) => formatDateTime(r.createdAt),
            },
            {
              key: "cashier",
              header: "Cashier",
              render: (r) => r.user?.name ?? "—",
            },
            {
              key: "method",
              header: "Payment",
              render: (r) => r.paymentMethod.replaceAll("_", " "),
            },
            {
              key: "total",
              header: "Total",
              render: (r) => <Money amount={r.total} className="font-medium" />,
            },
          ]}
        />
      </section>
    </div>
  );
}
