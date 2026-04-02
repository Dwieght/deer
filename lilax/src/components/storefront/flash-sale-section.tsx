"use client";

import Image from "next/image";
import { BLUR_DATA_URL, getFlashSaleMeta } from "./data";
import type { StoreProduct } from "./types";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(value);
}

export default function FlashSaleSection({
  products,
  onAddToCart,
  onQuickView
}: {
  products: StoreProduct[];
  onAddToCart: (product: StoreProduct) => void;
  onQuickView: (product: StoreProduct) => void;
}) {
  return (
    <section id="flash-sale" className="mx-auto mt-6 max-w-[1400px] px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white shadow-card">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#EE4D2D]">Limited Offers</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Flash Sale</h2>
          </div>
          <span className="rounded-full bg-[#fff4f1] px-4 py-2 text-sm font-semibold text-[#EE4D2D]">
            Scroll sideways for more deals
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto px-5 py-5 sm:px-6">
          {products.map((product, index) => {
            const meta = getFlashSaleMeta(index, product.stock, product.price);
            return (
              <article
                key={product.id}
                className="group min-w-[220px] max-w-[220px] rounded-2xl border border-slate-100 bg-white p-3 transition hover:-translate-y-1 hover:shadow-card"
              >
                <div className="relative overflow-hidden rounded-2xl bg-[#f8f8f8]">
                  <div className="absolute left-3 top-3 z-10 rounded-lg bg-[#EE4D2D] px-2 py-1 text-xs font-bold text-white">
                    -{meta.discountPercent}%
                  </div>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={220}
                    height={220}
                    sizes="220px"
                    className="aspect-square h-[220px] w-full object-cover transition duration-300 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  className="mt-3 text-left text-sm font-semibold text-slate-800"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}
                >
                  {product.name}
                </button>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-[#EE4D2D]">{formatMoney(product.price)}</span>
                  <span className="text-xs text-slate-400 line-through">
                    {formatMoney(meta.originalPrice)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="h-4 overflow-hidden rounded-full bg-[#ffe1da]">
                    <div
                      className="flex h-full items-center justify-center rounded-full bg-[#EE4D2D] text-[10px] font-bold text-white"
                      style={{ width: `${Math.min(100, Math.round(meta.soldRatio * 100))}%` }}
                    >
                      {meta.soldCount} sold
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="mt-3 w-full rounded-xl bg-[#EE4D2D] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#d83f22]"
                  disabled={product.stock <= 0}
                >
                  Add to Cart
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
