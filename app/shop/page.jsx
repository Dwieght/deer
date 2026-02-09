import { prisma } from "../../lib/prisma";
import ShopClient from "./shop-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }) {
  const [products, paymentQrs, feedbacks] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.paymentQrCode.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productFeedback.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const initialProductId =
    typeof searchParams?.product === "string" ? searchParams.product : "";
  const initialFeedback =
    String(searchParams?.feedback || "") === "1" ||
    String(searchParams?.feedback || "") === "true";

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

  const feedbackByProduct = feedbacks.reduce((acc, item) => {
    if (!item.productId) {
      return acc;
    }
    if (!acc[item.productId]) {
      acc[item.productId] = [];
    }
    acc[item.productId].push({
      id: item.id,
      fullName: item.fullName,
      rating: item.rating,
      message: item.message,
      createdAt: item.createdAt,
    });
    return acc;
  }, {});

  return (
    <ShopClient
      products={safeProducts}
      paymentQrs={safeQrs}
      feedbackByProduct={feedbackByProduct}
      initialProductId={initialProductId}
      initialFeedback={initialFeedback}
    />
  );
}
