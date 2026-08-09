import { NextResponse } from "next/server";
import { requireSession, unauthorized } from "@/lib/auth";

export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();
  return NextResponse.json({ user: session });
}
