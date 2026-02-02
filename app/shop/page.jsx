import { prisma } from "../../lib/prisma";
import ShopClient from "./shop-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, paymentQrs] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.paymentQrCode.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const safeProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    imageUrl: product.imageUrl,
    imageUrls: product.imageUrls || [],
    sizes: product.sizes || [],
    description: product.description,
  }));

  const safeQrs = paymentQrs.map((qr) => ({
    id: qr.id,
    title: qr.title,
    note: qr.note,
    imageUrl: qr.imageUrl,
  }));

  return <ShopClient products={safeProducts} paymentQrs={safeQrs} />;
}
