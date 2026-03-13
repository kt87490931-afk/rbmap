import { NextResponse } from "next/server";
import { requireAdminOrSetup } from "@/lib/admin-auth";
import { notifyTest } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST() {
  const authErr = await requireAdminOrSetup();
  if (authErr) return authErr;

  const ok = await notifyTest();
  return NextResponse.json({ ok });
}
