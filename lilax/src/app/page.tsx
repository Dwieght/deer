import type { Metadata } from "next";
import { normalizeImageList, normalizeImageUrl } from "@/lib/image-url";
import { prisma } from "@/lib/prisma";
import StorefrontClient from "./storefront-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Lilax Storefront",
  description:
    "Shopee-inspired Lilax storefront built with Next.js App Router and Prisma.",
};

async function getProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const now = new Date();
  const heroTargetDate = new Date(now.getTime() + 1000 * 60 * 60 * 72);
  const products = await getProducts();
  const safeProducts = products.map((product) => {
    const imageUrl = normalizeImageUrl(product.imageUrl);
    const gallery = normalizeImageList(
      product.gallery?.length ? product.gallery : [product.imageUrl],
    );

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl,
      gallery: gallery.length ? gallery : [imageUrl],
      featured: product.featured,
      isActive: product.isActive,
    };
  });

  return (
    <StorefrontClient
      products={safeProducts}
      heroCountdown={{
        initialTimeLeftMs: heroTargetDate.getTime() - now.getTime(),
        targetDateIso: heroTargetDate.toISOString(),
      }}
    />
  );
}
