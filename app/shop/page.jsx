import { prisma } from "../../lib/prisma";
import ShopClient from "./shop-client";
import { buildFeedbackPayload } from "./shop-data.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }) {
  const [products, paymentQrs, feedbacks] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        imageUrl: true,
        imageUrls: true,
        sizes: true,
        description: true,
      },
    }),
    prisma.paymentQrCode.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        note: true,
        imageUrl: true,
      },
    }),
    prisma.productFeedback.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        productId: true,
        fullName: true,
        rating: true,
        message: true,
        createdAt: true,
      },
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

  const { feedbackSummaryByProduct, feedbackPreviewByProduct } =
    buildFeedbackPayload(feedbacks);

  return (
    <ShopClient
      products={safeProducts}
      paymentQrs={safeQrs}
      feedbackSummaryByProduct={feedbackSummaryByProduct}
      feedbackPreviewByProduct={feedbackPreviewByProduct}
      initialProductId={initialProductId}
      initialFeedback={initialFeedback}
    />
  );
}
