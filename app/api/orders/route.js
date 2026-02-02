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
  const region = String(body?.region || "").trim();
  const province = String(body?.province || "").trim();
  const city = String(body?.city || "").trim();
  const barangay = String(body?.barangay || "").trim();
  const postalCode = String(body?.postalCode || "").trim();
  const streetName = String(body?.streetName || "").trim();
  const building = String(body?.building || "").trim();
  const houseNo = String(body?.houseNo || "").trim();
  const addressLabel = String(body?.addressLabel || "").trim();
  const size = String(body?.size || "").trim();
  const gcashReference = String(body?.gcashReference || "").trim();
  const productId = String(body?.productId || "").trim();
  const quantity = parseQuantity(body?.quantity);

  if (!customerName || !phone || !productId) {
    return NextResponse.json({ error: "Name, phone, and product are required" }, { status: 400 });
  }
  if (!region || !province || !city || !barangay) {
    return NextResponse.json({ error: "Complete region, province, city, and barangay." }, { status: 400 });
  }
  if (!postalCode || !streetName || !houseNo || !addressLabel) {
    return NextResponse.json({ error: "Complete address fields and label." }, { status: 400 });
  }
  if (!gcashReference) {
    return NextResponse.json({ error: "GCash reference number is required." }, { status: 400 });
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
        region,
        province,
        city,
        barangay,
        postalCode,
        streetName,
        building: building || null,
        houseNo,
        addressLabel,
        size: size || null,
        gcashReference,
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
