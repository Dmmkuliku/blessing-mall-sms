import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();
  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json({ settings: map });
}

const patchSchema = z.record(z.string(), z.string());

export async function PATCH(req: Request) {
  const session = await requireSession(["OWNER"]);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  await prisma.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );

  const settings = await prisma.setting.findMany();
  return NextResponse.json({ settings: Object.fromEntries(settings.map((s) => [s.key, s.value])) });
}
