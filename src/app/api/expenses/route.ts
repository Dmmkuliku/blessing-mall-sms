import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const expenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  spentAt: z.string().datetime().optional(),
});

export async function GET() {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();
  const expenses = await prisma.expense.findMany({
    orderBy: { spentAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ expenses });
}

export async function POST(req: Request) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid expense data" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      userId: session.id,
      category: parsed.data.category,
      description: parsed.data.description,
      amount: parsed.data.amount,
      spentAt: parsed.data.spentAt ? new Date(parsed.data.spentAt) : new Date(),
    },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ expense }, { status: 201 });
}
