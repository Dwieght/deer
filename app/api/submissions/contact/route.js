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
  const email = String(body?.email || "").trim().toLowerCase();
  const type = String(body?.type || "").trim();
  const message = String(body?.message || "").trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
  }

  try {
    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        type: type || "other",
        message,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
