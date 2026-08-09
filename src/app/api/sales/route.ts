import { NextResponse } from "next/server";
import { PaymentMethod } from "@prisma/client";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcVatInclusive, roundMoney } from "@/lib/format";
import { z } from "zod";

const saleSchema = z.object({
  customerName: z.string().max(120).optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paidAmount: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().positive().max(10000),
      })
    )
    .min(1)
    .max(100),
});

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

  const sales = await prisma.sale.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });

  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sale payload" }, { status: 400 });
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  const map = new Map(products.map((p) => [p.id, p]));

  for (const item of parsed.data.items) {
    const p = map.get(item.productId);
    if (!p) return NextResponse.json({ error: "Product not found" }, { status: 400 });
    if (p.stockQty < item.qty) {
      return NextResponse.json({ error: `Insufficient stock for ${p.name}` }, { status: 400 });
    }
  }

  const lineRows = parsed.data.items.map((item) => {
    const p = map.get(item.productId)!;
    const lineTotal = roundMoney(p.sellPrice * item.qty);
    return {
      productId: p.id,
      qty: item.qty,
      unitPrice: p.sellPrice,
      costPrice: p.costPrice,
      vatRate: p.vatRate,
      lineTotal,
    };
  });

  const subtotalEx = roundMoney(lineRows.reduce((s, r) => s + r.lineTotal, 0));
  // Tanzanian retail: prices often VAT-inclusive on shelf; we treat sellPrice as ex-VAT + show VAT line (18%)
  const { subtotal, vatAmount, total } = calcVatInclusive(subtotalEx, 18);

  if (parsed.data.paidAmount + 0.001 < total) {
    return NextResponse.json({ error: "Paid amount is less than total" }, { status: 400 });
  }

  const count = await prisma.sale.count();
  const receiptNo = `RCP-${10000 + count + 1}`;

  try {
    const sale = await prisma.$transaction(async (tx) => {
      for (const row of lineRows) {
        const updated = await tx.product.updateMany({
          where: { id: row.productId, stockQty: { gte: row.qty } },
          data: { stockQty: { decrement: row.qty } },
        });
        if (updated.count !== 1) {
          throw new Error("STOCK");
        }
        await tx.stockMovement.create({
          data: {
            productId: row.productId,
            userId: session.id,
            type: "SALE",
            qty: -row.qty,
            note: `Sale ${receiptNo}`,
          },
        });
      }

      return tx.sale.create({
        data: {
          receiptNo,
          userId: session.id,
          customerName: parsed.data.customerName || "Walk-in customer",
          paymentMethod: parsed.data.paymentMethod,
          subtotal,
          vatAmount,
          total,
          paidAmount: parsed.data.paidAmount,
          changeAmount: roundMoney(parsed.data.paidAmount - total),
          items: { create: lineRows },
        },
        include: {
          user: { select: { id: true, name: true } },
          items: { include: { product: true } },
        },
      });
    });

    return NextResponse.json({
      sale: {
        ...sale,
        items: sale.items.map((item) => {
          const product =
            session.role === "ATTENDANT" && item.product
              ? (({ costPrice: _c, ...rest }) => rest)(item.product)
              : item.product;
          if (session.role === "ATTENDANT") {
            const { costPrice: _cost, ...safeItem } = item;
            return { ...safeItem, product };
          }
          return { ...item, product };
        }),
      },
    }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK") {
      return NextResponse.json(
        { error: "Stock levels changed during checkout. Please review the cart and try again." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Checkout could not be completed. Please try again." },
      { status: 500 }
    );
  }
}
