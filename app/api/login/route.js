import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createSessionToken, verifyPassword, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  let user = null;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  let token = null;
  try {
    token = createSessionToken({ sub: user.id, email: user.email });
  } catch (error) {
    return NextResponse.json({ error: "Auth is not configured" }, { status: 500 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
