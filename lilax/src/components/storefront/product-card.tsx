"use client";

import Image from "next/image";
import HighlightText from "./highlight-text";
import { BLUR_DATA_URL } from "./data";
import type { StoreProduct } from "./types";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(value);
}

export default function ProductCard({
  product,
  query,
  onAddToCart,
  onBuyNow,
  onQuickView
}: {
  product: StoreProduct;
  query: string;
  onAddToCart: (product: StoreProduct) => void;
  onBuyNow: (product: StoreProduct) => void;
  onQuickView: (product: StoreProduct) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-card">
      <button type="button" onClick={() => onQuickView(product)} className="relative block w-full text-left">
        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
            {product.category}
          </span>
          {product.featured ? (
            <span className="rounded-full bg-[#EE4D2D] px-3 py-1 text-[11px] font-semibold text-white">
              Featured
            </span>
          ) : null}
        </div>
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={320}
          height={320}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="aspect-square h-auto w-full object-cover transition duration-300 group-hover:scale-105"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3 opacity-0 transition duration-200 group-hover:opacity-100">
          <div className="grid gap-2 sm:grid-cols-2">
            <span className="rounded-xl bg-white/95 px-3 py-2 text-center text-xs font-bold text-slate-900">
              Quick View
            </span>
            <span className="rounded-xl bg-[#EE4D2D] px-3 py-2 text-center text-xs font-bold text-white">
              Hover Actions
            </span>
          </div>
        </div>
      </button>

      <div className="space-y-3 p-4">
        <div className="min-h-[52px]">
          <h3 className="text-sm font-semibold leading-5 text-slate-800">
            <HighlightText text={product.name} query={query} />
          </h3>
          <p
            className="mt-1 text-xs leading-5 text-slate-500"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}
          >
            {product.description}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-lg font-black text-[#EE4D2D]">{formatMoney(product.price)}</p>
            <p className="text-xs text-slate-400">{product.stock > 0 ? `${product.stock} left` : "Out of stock"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
            className="rounded-xl border border-[#EE4D2D]/15 bg-[#fff4f1] px-3 py-2 text-sm font-bold text-[#EE4D2D] transition hover:bg-[#ffe7e1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={() => onBuyNow(product)}
            disabled={product.stock <= 0}
            className="rounded-xl bg-[#EE4D2D] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#d83f22] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
