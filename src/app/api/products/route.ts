import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1),
  nameSw: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  costPrice: z.number().nonnegative(),
  sellPrice: z.number().positive(),
  stockQty: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  vatRate: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const lowStock = searchParams.get("lowStock") === "1";

  const products = await prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { nameSw: { contains: q } },
            { sku: { contains: q } },
            { barcode: { contains: q } },
          ],
        }
      : undefined,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const result = lowStock ? products.filter((p) => p.stockQty <= p.reorderLevel) : products;
  return NextResponse.json({ products: result });
}

export async function POST(req: Request) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        sku: parsed.data.sku,
        barcode: parsed.data.barcode || null,
        name: parsed.data.name,
        nameSw: parsed.data.nameSw || null,
        categoryId: parsed.data.categoryId,
        costPrice: parsed.data.costPrice,
        sellPrice: parsed.data.sellPrice,
        stockQty: parsed.data.stockQty ?? 0,
        reorderLevel: parsed.data.reorderLevel ?? 10,
        unit: parsed.data.unit ?? "pcs",
        vatRate: parsed.data.vatRate ?? 18,
        active: parsed.data.active ?? true,
      },
      include: { category: true },
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create product (SKU/barcode may already exist)" }, { status: 409 });
  }
}
