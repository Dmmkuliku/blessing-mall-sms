import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "sales";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  if (type === "products") {
    const items = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: fromDate, lte: toDate } } },
      include: { product: true },
    });

    const map = new Map<
      string,
      { productId: string; name: string; sku: string; qty: number; revenue: number; cost: number }
    >();

    for (const item of items) {
      const cur = map.get(item.productId) || {
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        qty: 0,
        revenue: 0,
        cost: 0,
      };
      cur.qty += item.qty;
      cur.revenue += item.lineTotal;
      cur.cost += item.costPrice * item.qty;
      map.set(item.productId, cur);
    }

    const rows = [...map.values()]
      .map((r) => ({ ...r, profit: r.revenue - r.cost }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ type, from: fromDate, to: toDate, rows });
  }

  if (type === "cashflow") {
    const [sales, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        select: { total: true, paymentMethod: true, createdAt: true },
      }),
      prisma.expense.findMany({
        where: { spentAt: { gte: fromDate, lte: toDate } },
        select: { amount: true, category: true, spentAt: true, description: true },
      }),
    ]);

    const salesTotal = sales.reduce((s, x) => s + x.total, 0);
    const expenseTotal = expenses.reduce((s, x) => s + x.amount, 0);
    const byMethod: Record<string, number> = {};
    for (const s of sales) {
      byMethod[s.paymentMethod] = (byMethod[s.paymentMethod] || 0) + s.total;
    }

    return NextResponse.json({
      type,
      from: fromDate,
      to: toDate,
      salesTotal,
      expenseTotal,
      net: salesTotal - expenseTotal,
      byMethod,
      expenses,
    });
  }

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      items: true,
    },
  });

  const summary = {
    count: sales.length,
    gross: sales.reduce((s, x) => s + x.total, 0),
    vat: sales.reduce((s, x) => s + x.vatAmount, 0),
    subtotal: sales.reduce((s, x) => s + x.subtotal, 0),
  };

  return NextResponse.json({ type: "sales", from: fromDate, to: toDate, summary, sales });
}
