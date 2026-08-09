import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  sku: z.string().min(1).optional(),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  nameSw: z.string().optional().nullable(),
  categoryId: z.string().min(1).optional(),
  costPrice: z.number().nonnegative().optional(),
  sellPrice: z.number().positive().optional(),
  stockQty: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  vatRate: z.number().nonnegative().optional(),
  active: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, movements: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
