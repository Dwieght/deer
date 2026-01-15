import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const messageEn = String(body?.messageEn || "").trim();
  const messageAr = String(body?.messageAr || "").trim();
  const tiktok = String(body?.tiktok || "").trim();

  if (!name || !messageEn) {
    return NextResponse.json({ error: "Name and English message are required" }, { status: 400 });
  }

  try {
    await prisma.letterSubmission.create({
      data: {
        name,
        messageEn,
        messageAr: messageAr || null,
        tiktok: tiktok || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
