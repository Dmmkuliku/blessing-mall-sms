import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const adjustSchema = z.object({
  productId: z.string(),
  qty: z.number(),
  note: z.string().optional().nullable(),
});

export async function GET() {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();
  const movements = await prisma.stockMovement.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      user: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ movements });
}

export async function POST(req: Request) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid adjustment" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const nextQty = product.stockQty + parsed.data.qty;
  if (nextQty < 0) {
    return NextResponse.json({ error: "Adjustment would make stock negative" }, { status: 400 });
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: { stockQty: nextQty },
    }),
    prisma.stockMovement.create({
      data: {
        productId: product.id,
        userId: session.id,
        type: "ADJUST",
        qty: parsed.data.qty,
        note: parsed.data.note || "Manual stock adjustment",
      },
    }),
  ]);

  return NextResponse.json({ product: updated });
}
