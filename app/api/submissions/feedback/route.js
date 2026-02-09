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

  const productId = String(body?.productId || "").trim();
  const fullName = String(body?.fullName || "").trim();
  const message = String(body?.message || "").trim();
  const rating = Number(body?.rating);

  if (!productId || !fullName || !message || !Number.isFinite(rating)) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.productFeedback.create({
      data: {
        productId,
        fullName,
        message,
        rating,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
