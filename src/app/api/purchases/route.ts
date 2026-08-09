import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/format";
import { z } from "zod";

const purchaseSchema = z.object({
  supplierId: z.string(),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        qty: z.number().positive(),
        unitCost: z.number().nonnegative(),
      })
    )
    .min(1),
});

export async function GET() {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      supplier: true,
      user: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  });
  return NextResponse.json({ purchases });
}

export async function POST(req: Request) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid purchase data" }, { status: 400 });
  }

  const totalCost = roundMoney(
    parsed.data.items.reduce((s, i) => s + i.qty * i.unitCost, 0)
  );
  const count = await prisma.purchase.count();
  const reference = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const purchase = await prisma.$transaction(async (tx) => {
    for (const item of parsed.data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQty: { increment: item.qty },
          costPrice: item.unitCost,
        },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          userId: session.id,
          type: "PURCHASE",
          qty: item.qty,
          note: `Purchase ${reference}`,
        },
      });
    }

    return tx.purchase.create({
      data: {
        reference,
        supplierId: parsed.data.supplierId,
        userId: session.id,
        status: "RECEIVED",
        totalCost,
        notes: parsed.data.notes || null,
        items: {
          create: parsed.data.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitCost: i.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        user: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
    });
  });

  return NextResponse.json({ purchase }, { status: 201 });
}
