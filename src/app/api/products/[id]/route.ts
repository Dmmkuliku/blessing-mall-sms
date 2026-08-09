import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  sku: z.string().min(1).max(64).optional(),
  barcode: z.string().max(64).optional().nullable(),
  name: z.string().min(1).max(160).optional(),
  nameSw: z.string().max(160).optional().nullable(),
  categoryId: z.string().min(1).optional(),
  costPrice: z.number().nonnegative().optional(),
  sellPrice: z.number().positive().optional(),
  stockQty: z.number().nonnegative().optional(),
  reorderLevel: z.number().nonnegative().optional(),
  unit: z.string().max(32).optional(),
  vatRate: z.number().nonnegative().max(100).optional(),
  active: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

function forRole<T extends Record<string, unknown>>(data: T, role: string) {
  if (role !== "ATTENDANT") return data;
  const { costPrice: _c, movements, ...rest } = data as T & {
    costPrice?: number;
    movements?: unknown;
  };
  return rest;
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      movements:
        session.role === "ATTENDANT"
          ? false
          : { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
  return NextResponse.json({
    product: forRole(product as unknown as Record<string, unknown>, session.role),
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) {
    return unauthorized("You do not have permission to update products.");
  }
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product details." }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Could not update product. Please check the details and try again." },
      { status: 400 }
    );
  }
}
