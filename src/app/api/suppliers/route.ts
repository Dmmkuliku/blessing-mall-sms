import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function GET() {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ suppliers });
}

export async function POST(req: Request) {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid supplier data" }, { status: 400 });
  }

  const supplier = await prisma.supplier.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      active: parsed.data.active ?? true,
    },
  });
  return NextResponse.json({ supplier }, { status: 201 });
}
