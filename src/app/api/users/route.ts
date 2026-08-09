import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { hashPassword, requireSession, unauthorized, forbidden } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(254),
  password: passwordSchema,
  role: z.nativeEnum(Role),
});

export async function GET() {
  const session = await requireSession(["MANAGER", "OWNER"]);
  if (!session) return unauthorized();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await requireSession(["OWNER"]);
  if (!session) {
    return forbidden("Only the store owner can create staff accounts.");
  }

  const body = await req.json().catch(() => null);
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ||
      "Please provide valid staff details and a strong password.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
