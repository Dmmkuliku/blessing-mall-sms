import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@prisma/client";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { ensureDb, prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
  roleHint: z.enum(["ATTENDANT", "MANAGER", "OWNER"]).optional(),
});

const GENERIC_AUTH_ERROR = "Invalid email or password.";

export async function POST(req: Request) {
  await ensureDb();

  const ip = clientIp(req);
  const limited = rateLimit(`login:${ip}`);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error:
          "Too many sign-in attempts. Please wait a few minutes and try again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid email and password." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Avoid user enumeration timing differences without relying on invalid hashes
  if (!user || !user.active) {
    await new Promise((r) => setTimeout(r, 120));
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  if (parsed.data.roleHint && user.role !== (parsed.data.roleHint as Role)) {
    return NextResponse.json(
      {
        error:
          "This account does not match the role you selected. Choose the correct role or contact your manager.",
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
