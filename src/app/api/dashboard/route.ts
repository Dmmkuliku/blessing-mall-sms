import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();

  const today = startOfDay();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todaySales, products, recentSales, expensesToday, expensesMonth, weekSales] =
    await Promise.all([
      prisma.sale.findMany({ where: { createdAt: { gte: today } } }),
      prisma.product.findMany({
        where: { active: true },
        include: { category: true },
      }),
      prisma.sale.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.expense.findMany({ where: { spentAt: { gte: today } } }),
      prisma.expense.findMany({ where: { spentAt: { gte: monthStart } } }),
      prisma.sale.findMany({
        where: { createdAt: { gte: weekAgo } },
        select: { createdAt: true, total: true },
      }),
    ]);

  const lowStockProducts = products.filter((p) => p.stockQty <= p.reorderLevel);
  const byDay: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const sale of weekSales) {
    const key = sale.createdAt.toISOString().slice(0, 10);
    if (key in byDay) byDay[key] += sale.total;
  }

  return NextResponse.json({
    todaySales: todaySales.reduce((s, x) => s + x.total, 0),
    todayTransactions: todaySales.length,
    lowStockCount: lowStockProducts.length,
    todayExpenses: expensesToday.reduce((s, x) => s + x.amount, 0),
    monthExpenses: expensesMonth.reduce((s, x) => s + x.amount, 0),
    salesLast7Days: Object.entries(byDay).map(([date, total]) => ({ date, total })),
    lowStockProducts: lowStockProducts.slice(0, 10),
    recentSales,
  });
}
