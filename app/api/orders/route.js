import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

function parseQuantity(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const quantity = Number.parseInt(raw, 10);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NaN;
  }
  return quantity;
}

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const customerName = String(body?.customerName || "").trim();
  const phone = String(body?.phone || "").trim();
  const productId = String(body?.productId || "").trim();
  const quantity = parseQuantity(body?.quantity);

  if (!customerName || !phone || !productId) {
    return NextResponse.json({ error: "Name, phone, and product are required" }, { status: 400 });
  }
  if (quantity === null || Number.isNaN(quantity)) {
    return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const total = product.price * quantity;
    const order = await prisma.order.create({
      data: {
        customerName,
        phone,
        productId,
        quantity,
        total,
        status: "PENDING",
      },
    });
    return NextResponse.json({ ok: true, id: order.id });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
