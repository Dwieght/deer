import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export async function POST(request: Request) {
  let body: {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } | null = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fullName = String(body?.fullName || "").trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password || "");
  const confirmPassword = String(body?.confirmPassword || "");

  if (!fullName || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Full name, email, and password are required." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: { email }
  });

  if (existingCustomer) {
    return NextResponse.json(
      { error: "This email already has a signup request." },
      { status: 409 }
    );
  }

  try {
    await prisma.customer.create({
      data: {
        fullName,
        email,
        passwordHash: hashPassword(password),
        status: "PENDING"
      }
    });
  } catch {
    return NextResponse.json(
      { error: "Could not submit your signup request." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Your signup request is pending admin approval."
    },
    { status: 201 }
  );
}
