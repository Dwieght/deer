import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import StorefrontClient from "./storefront-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Lilax Storefront",
  description: "Shopee-inspired Lilax storefront built with Next.js App Router and Prisma."
};

async function getProducts() {
  try {
    return await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();
  const safeProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl,
    gallery: product.gallery?.length ? product.gallery : [product.imageUrl],
    featured: product.featured,
    isActive: product.isActive
  }));

  return <StorefrontClient products={safeProducts} />;
}
