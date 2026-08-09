import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const setupSchema = z.object({
  shopName: z.string().min(2).max(120),
  shopLocation: z.string().max(160).optional().default(""),
  shopPhone: z.string().max(40).optional().default(""),
  ownerName: z.string().min(2).max(100),
  ownerEmail: z.string().email().max(254),
  ownerPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a number"),
  vatRate: z.string().optional().default("18"),
});

async function isSetupComplete() {
  const flag = await prisma.setting.findUnique({ where: { key: "setup_complete" } });
  return flag?.value === "1";
}

export async function GET() {
  try {
    const complete = await isSetupComplete();
    return NextResponse.json({ setupComplete: complete });
  } catch {
    // Fresh install before DB ready
    return NextResponse.json({ setupComplete: false });
  }
}

export async function POST(req: Request) {
  const limited = rateLimit(`setup:${clientIp(req)}`, 5, 30 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many setup attempts. Please wait and try again." },
      { status: 429 }
    );
  }

  if (await isSetupComplete()) {
    return NextResponse.json(
      { error: "Initial setup is already complete. Sign in with an existing account." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ||
          "Please provide valid shop and owner details.",
      },
      { status: 400 }
    );
  }

  const email = parsed.data.ownerEmail.toLowerCase().trim();
  const passwordHash = await hashPassword(parsed.data.ownerPassword);

  try {
    await prisma.$transaction(async (tx) => {
      const settings: Record<string, string> = {
        shop_name: parsed.data.shopName.trim(),
        shop_location: parsed.data.shopLocation.trim(),
        shop_phone: parsed.data.shopPhone.trim(),
        vat_rate: parsed.data.vatRate || "18",
        currency: "TZS",
        receipt_footer: `Thank you for shopping at ${parsed.data.shopName.trim()}.`,
        setup_complete: "1",
      };

      for (const [key, value] of Object.entries(settings)) {
        await tx.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }

      const existingOwner = await tx.user.findFirst({
        where: { role: "OWNER" },
        orderBy: { createdAt: "asc" },
      });

      if (existingOwner) {
        const emailTaken = await tx.user.findFirst({
          where: { email, NOT: { id: existingOwner.id } },
        });
        if (emailTaken) {
          throw new Error("EMAIL_TAKEN");
        }
        await tx.user.update({
          where: { id: existingOwner.id },
          data: {
            name: parsed.data.ownerName.trim(),
            email,
            passwordHash,
            active: true,
          },
        });
      } else {
        const clash = await tx.user.findUnique({ where: { email } });
        if (clash) throw new Error("EMAIL_TAKEN");
        await tx.user.create({
          data: {
            name: parsed.data.ownerName.trim(),
            email,
            passwordHash,
            role: "OWNER",
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "That email is already used by another staff account." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Setup could not be saved. Please try again." },
      { status: 500 }
    );
  }

  const owner = await prisma.user.findUnique({ where: { email } });
  if (!owner) {
    return NextResponse.json(
      { error: "Setup finished but owner account was not found." },
      { status: 500 }
    );
  }

  const session = {
    id: owner.id,
    name: owner.name,
    email: owner.email,
    role: owner.role,
  };
  await setSessionCookie(await createSessionToken(session));

  return NextResponse.json({
    ok: true,
    user: session,
    message: "Setup complete. You are signed in as the store owner.",
  });
}
