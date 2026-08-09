import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { ensureDb, prisma } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  roleHint: z.enum(["ATTENDANT", "MANAGER", "OWNER"]).optional(),
});

export async function POST(req: Request) {
  await ensureDb();
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login details" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (parsed.data.roleHint && user.role !== (parsed.data.roleHint as Role)) {
    return NextResponse.json(
      {
        error: `This account is a ${user.role.toLowerCase()}, not the selected role.`,
      },
      { status: 403 }
    );
  }

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const token = await createSessionToken(session);
  await setSessionCookie(token);

  return NextResponse.json({ user: session });
}
