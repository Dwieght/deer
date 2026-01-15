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

  const senderName = String(body?.senderName || "").trim();
  const referenceNumber = String(body?.referenceNumber || "").trim();
  const qrCodeId = String(body?.qrCodeId || "").trim();

  if (!senderName || !referenceNumber) {
    return NextResponse.json({ error: "Sender name and reference number are required" }, { status: 400 });
  }

  try {
    await prisma.paymentSubmission.create({
      data: {
        senderName,
        referenceNumber,
        qrCodeId: qrCodeId || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
