import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestItem = {
  productId?: string;
  quantity?: number;
};

type OrderBody = {
  customerName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  items?: RequestItem[];
};

type OrderItemSnapshot = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

async function generateOrderCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Array.from({ length: 6 }, () => {
      return alphabet[Math.floor(Math.random() * alphabet.length)];
    }).join("");
    const orderCode = `LX-${suffix}`;
    const existing = await prisma.order.findUnique({ where: { orderCode } });
    if (!existing) {
      return orderCode;
    }
  }

  throw new Error("Could not generate a unique order code.");
}

export async function POST(request: Request) {
  let body: OrderBody | null = null;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const customerName = String(body?.customerName || "").trim();
  const email = String(body?.email || "").trim();
  const phone = String(body?.phone || "").trim();
  const addressLine1 = String(body?.addressLine1 || "").trim();
  const addressLine2 = String(body?.addressLine2 || "").trim();
  const city = String(body?.city || "").trim();
  const province = String(body?.province || "").trim();
  const postalCode = String(body?.postalCode || "").trim();
  const country = String(body?.country || "").trim() || "Philippines";
  const notes = String(body?.notes || "").trim();
  const items = Array.isArray(body?.items) ? body?.items : [];

  if (
    !customerName ||
    !phone ||
    !addressLine1 ||
    !city ||
    !province ||
    !postalCode ||
    !items.length
  ) {
    return NextResponse.json({ error: "Missing required checkout fields." }, { status: 400 });
  }

  const normalizedItems = items
    .map((item) => ({
      productId: String(item.productId || "").trim(),
      quantity: Number(item.quantity || 0)
    }))
    .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);

  if (!normalizedItems.length) {
    return NextResponse.json({ error: "No valid items were submitted." }, { status: 400 });
  }

  const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
  const products = await prisma.product
    .findMany({
      where: {
        id: { in: productIds },
        isActive: true
      }
    })
    .catch(() => null);

  if (!products) {
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderItems: OrderItemSnapshot[] = [];
  for (const item of normalizedItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: "One or more selected products no longer exist." },
        { status: 400 }
      );
    }
    if (item.quantity > product.stock) {
      return NextResponse.json(
        { error: `${product.name} does not have enough stock.` },
        { status: 400 }
      );
    }

    orderItems.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity
    });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  try {
    const orderCode = await generateOrderCode();

    await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      await tx.order.create({
        data: {
          orderCode,
          customerName,
          email: email || null,
          phone,
          addressLine1,
          addressLine2: addressLine2 || null,
          city,
          province,
          postalCode,
          country,
          notes: notes || null,
          status: "PENDING",
          statusNote: "Order received. Waiting for admin review.",
          items: orderItems,
          subtotal,
          shippingFee,
          total
        }
      });
    });

    return NextResponse.json({ ok: true, orderCode });
  } catch {
    return NextResponse.json(
      { error: "Could not create the order. Please try again." },
      { status: 500 }
    );
  }
}
