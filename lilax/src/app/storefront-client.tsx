"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import StorefrontFooter from "@/components/storefront/footer";
import FlashSaleSection from "@/components/storefront/flash-sale-section";
import HeroCarousel from "@/components/storefront/hero-carousel";
import {
  ArrowUpIcon,
  CartIcon,
  SearchIcon,
} from "@/components/storefront/icons";
import ProductCard from "@/components/storefront/product-card";
import {
  BLUR_DATA_URL,
  CATEGORY_TILES,
  PROMO_BANNERS,
} from "@/components/storefront/data";
import type { StoreProduct as Product } from "@/components/storefront/types";

type BasketItem = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  stock: number;
};

type CheckoutForm = {
  customerName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  notes: string;
};

const emptyCheckoutForm: CheckoutForm = {
  customerName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Philippines",
  notes: "",
};

type HeroCountdown = {
  initialTimeLeftMs: number;
  targetDateIso: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function StorefrontClient({
  products,
  heroCountdown,
}: {
  products: Product[];
  heroCountdown: HeroCountdown;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] =
    useState<CheckoutForm>(emptyCheckoutForm);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [quickViewImage, setQuickViewImage] = useState("");
  const [visibleCount, setVisibleCount] = useState(12);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const modalOpen = basketOpen || checkoutOpen || Boolean(quickViewProduct);
    const previous = document.body.style.overflow;

    if (modalOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previous;
    };
  }, [basketOpen, checkoutOpen, quickViewProduct]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("lilax-cart");
      if (!stored) {
        setHasLoadedCart(true);
        return;
      }

      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setBasket(parsed);
      }
    } catch {
      window.localStorage.removeItem("lilax-cart");
    } finally {
      setHasLoadedCart(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCart) {
      return;
    }
    window.localStorage.setItem("lilax-cart", JSON.stringify(basket));
  }, [basket, hasLoadedCart]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => setMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 300);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((product) => product.category))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = debouncedSearch.toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const haystack =
        `${product.name} ${product.description} ${product.category}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, debouncedSearch, products]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const flashSaleProducts = useMemo(() => {
    return products.slice(0, Math.min(8, products.length));
  }, [products]);

  const basketCount = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.quantity, 0);
  }, [basket]);

  const subtotal = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [basket]);

  useEffect(() => {
    setVisibleCount(12);
  }, [debouncedSearch, activeCategory]);

  useEffect(() => {
    if (
      !sentinelRef.current ||
      visibleProducts.length >= filteredProducts.length
    ) {
      return;
    }

    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((current) =>
              Math.min(current + 8, filteredProducts.length),
            );
          }
        });
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredProducts.length, visibleProducts.length]);

  function addToCart(
    product: Product,
    options?: { openBasket?: boolean; silent?: boolean },
  ) {
    if (product.stock <= 0) {
      setMessage({
        type: "error",
        text: `${product.name} is currently out of stock.`,
      });
      return;
    }

    setBasket((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, item.stock),
              }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });

    if (!options?.silent) {
      setMessage({
        type: "success",
        text: `${product.name} was added to your cart.`,
      });
    }

    if (options?.openBasket) {
      setBasketOpen(true);
    }
  }

  function buyNow(product: Product) {
    addToCart(product, { silent: true });
    setQuickViewProduct(null);
    setBasketOpen(false);
    setCheckoutOpen(true);
    setMessage({
      type: "success",
      text: `${product.name} added. Continue to checkout.`,
    });
  }

  function updateQuantity(productId: string, nextQuantity: number) {
    setBasket((current) =>
      current.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.max(1, Math.min(nextQuantity, item.stock)),
            }
          : item,
      ),
    );
  }

  function removeItem(productId: string) {
    setBasket((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }

  function openQuickView(product: Product) {
    setQuickViewProduct(product);
    setQuickViewImage(product.gallery[0] || product.imageUrl);
  }

  async function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!basket.length) {
      setMessage({ type: "error", text: "Your basket is empty." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...checkoutForm,
          items: basket.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data?.error || "Could not place your order.",
        });
        return;
      }

      setBasket([]);
      setCheckoutForm(emptyCheckoutForm);
      setCheckoutOpen(false);
      setBasketOpen(false);
      setMessage({
        type: "success",
        text: `Order placed successfully. Your order code is ${data.orderCode}.`,
      });
      window.localStorage.removeItem("lilax-cart");
    } catch {
      setMessage({
        type: "error",
        text: "Could not place your order. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900">
      <header className="sticky top-0 z-50 bg-[#EE4D2D] text-white shadow-lg">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 text-lg font-black backdrop-blur">
                LX
              </div>
              <div>
                <p className="text-2xl font-black leading-none">Lilax</p>
                <p className="text-xs text-white/80">
                  Shop smarter, faster, cleaner
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#EE4D2D] transition hover:bg-white/90"
              >
                Sign Up
              </Link>
              <button
                type="button"
                onClick={() => setBasketOpen(true)}
                className="relative rounded-full border border-white/20 bg-white/10 p-3 transition hover:bg-white/15"
                aria-label="Open cart"
              >
                <CartIcon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-[#EE4D2D]">
                  {basketCount}
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_auto]">
            <select
              value={activeCategory}
              onChange={(event) => setActiveCategory(event.target.value)}
              className="h-12 rounded-xl border border-white/15 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "All Categories" : category}
                </option>
              ))}
            </select>

            <label className="flex h-12 items-center overflow-hidden rounded-xl bg-white shadow-sm">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search for products, categories, or deals"
                className="h-full flex-1 border-0 px-4 text-sm text-slate-700 focus:ring-0"
              />
              <span className="mr-2 flex h-9 w-11 items-center justify-center rounded-lg bg-[#EE4D2D] text-white">
                <SearchIcon className="h-5 w-5" />
              </span>
            </label>

            <div className="flex items-center justify-between gap-3 lg:hidden">
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#EE4D2D]"
              >
                Sign Up
              </Link>
              <button
                type="button"
                onClick={() => setBasketOpen(true)}
                className="relative rounded-full border border-white/20 bg-white/10 p-3"
                aria-label="Open cart"
              >
                <CartIcon className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-[#EE4D2D]">
                  {basketCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <HeroCarousel
        initialTimeLeftMs={heroCountdown.initialTimeLeftMs}
        targetDateIso={heroCountdown.targetDateIso}
      />

      <section
        id="categories"
        className="mx-auto mt-6 max-w-[1400px] px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#EE4D2D]">
                Explore
              </p>
              <h2 className="mt-1 text-2xl font-black">Shop by Category</h2>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 sm:inline-flex">
              Tap a category to filter the product wall
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
            {CATEGORY_TILES.map((tile) => {
              const isActive = activeCategory === tile.category;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => setActiveCategory(tile.category)}
                  className={`group rounded-2xl border px-3 py-4 text-center transition ${
                    isActive
                      ? "border-[#EE4D2D] bg-[#fff4f1] shadow-card"
                      : "border-slate-100 bg-white hover:-translate-y-1 hover:shadow-card"
                  }`}
                >
                  <div className="text-2xl">{tile.icon}</div>
                  <div className="mt-3 text-xs font-bold text-slate-700">
                    {tile.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <FlashSaleSection
        products={flashSaleProducts}
        onAddToCart={(product) => addToCart(product, { openBasket: true })}
        onQuickView={openQuickView}
      />

      <section className="mx-auto mt-6 grid max-w-[1400px] gap-4 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {PROMO_BANNERS.map((banner) => (
          <Link
            key={banner.id}
            href={banner.href}
            className="group relative overflow-hidden rounded-3xl bg-white shadow-card"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
            <Image
              src={banner.image}
              alt={banner.title}
              width={1200}
              height={420}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-[220px] w-full object-cover transition duration-300 group-hover:scale-105"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                Promo Banner
              </p>
              <h3 className="mt-2 text-2xl font-black">{banner.title}</h3>
              <p className="mt-2 max-w-md text-sm text-white/85">
                {banner.description}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <main
        id="just-for-you"
        className="mx-auto mt-6 max-w-[1400px] px-4 pb-16 sm:px-6 lg:px-8"
      >
        {message ? (
          <div
            className={`mb-5 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm ${
              message.type === "success"
                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border border-rose-100 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-5 shadow-card">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#EE4D2D]">
                Personalized Feed
              </p>
              <h2 className="mt-1 text-2xl font-black">Just For You</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredProducts.length} products matched
                {debouncedSearch ? ` for "${debouncedSearch}"` : ""}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setDebouncedSearch("");
                setActiveCategory("All");
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>

          {visibleProducts.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="text-lg font-bold text-slate-800">
                No products found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another keyword or choose a different category.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    query={debouncedSearch}
                    onAddToCart={(item) =>
                      addToCart(item, { openBasket: true })
                    }
                    onBuyNow={buyNow}
                    onQuickView={openQuickView}
                  />
                ))}
              </div>

              <div
                ref={sentinelRef}
                className="flex min-h-16 items-center justify-center pt-6"
              >
                {visibleProducts.length < filteredProducts.length ? (
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
                    Loading more products...
                  </div>
                ) : (
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
                    You&apos;ve reached the end of the list.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <StorefrontFooter />

      {showBackToTop ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EE4D2D] text-white shadow-float transition hover:bg-[#d83f22]"
          aria-label="Back to top"
        >
          <ArrowUpIcon className="h-5 w-5" />
        </button>
      ) : null}

      {basketOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
          onClick={() => setBasketOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#EE4D2D]">
                  Cart
                </p>
                <h2 className="text-xl font-black text-slate-900">
                  Your Basket
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBasketOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              {basket.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                  <h3 className="text-lg font-bold text-slate-800">
                    Your basket is empty
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Add a few products to continue.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {basket.map((item) => (
                      <article
                        key={item.productId}
                        className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-3xl border border-slate-100 p-4"
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={88}
                          height={88}
                          className="h-[88px] w-[88px] rounded-2xl object-cover"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URL}
                        />
                        <div className="flex min-w-0 flex-col gap-3">
                          <div>
                            <h3 className="truncate text-sm font-bold text-slate-900">
                              {item.name}
                            </h3>
                            <p className="text-sm text-[#EE4D2D]">
                              {formatMoney(item.price)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center rounded-full bg-slate-100 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                  )
                                }
                                className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-bold text-slate-700"
                              >
                                -
                              </button>
                              <span className="min-w-[36px] text-center text-sm font-bold text-slate-700">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1,
                                  )
                                }
                                className="grid h-8 w-8 place-items-center rounded-full bg-white text-sm font-bold text-slate-700"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.productId)}
                              className="text-sm font-semibold text-rose-500"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="mt-5 rounded-3xl bg-[#fff4f1] p-5">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <strong className="text-xl text-[#EE4D2D]">
                        {formatMoney(subtotal)}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBasketOpen(false);
                        setCheckoutOpen(true);
                      }}
                      className="mt-4 w-full rounded-2xl bg-[#EE4D2D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d83f22]"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
          onClick={() => setCheckoutOpen(false)}
        >
          <div
            className="mx-auto mt-6 max-h-[calc(100vh-3rem)] w-[calc(100%-1rem)] max-w-6xl overflow-y-auto rounded-[28px] bg-white shadow-2xl sm:mt-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#EE4D2D]">
                  Checkout
                </p>
                <h2 className="text-xl font-black text-slate-900">
                  Shipping details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 p-5 lg:grid-cols-[340px_minmax(0,1fr)]">
              <aside className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-lg font-black text-slate-900">
                  Order summary
                </h3>
                <div className="mt-4 space-y-3">
                  {basket.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="text-slate-600">
                        {item.name} x {item.quantity}
                      </span>
                      <strong className="text-slate-900">
                        {formatMoney(item.price * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="mt-5 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total</span>
                    <strong className="text-2xl font-black text-[#EE4D2D]">
                      {formatMoney(subtotal)}
                    </strong>
                  </div>
                </div>
              </aside>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    Full Name
                    <input
                      type="text"
                      value={checkoutForm.customerName}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          customerName: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    Email
                    <input
                      type="email"
                      value={checkoutForm.email}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    Phone
                    <input
                      type="text"
                      value={checkoutForm.phone}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    Country
                    <input
                      type="text"
                      value={checkoutForm.country}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          country: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                    Address Line 1
                    <input
                      type="text"
                      value={checkoutForm.addressLine1}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          addressLine1: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                    Address Line 2
                    <input
                      type="text"
                      value={checkoutForm.addressLine2}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          addressLine2: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    City
                    <input
                      type="text"
                      value={checkoutForm.city}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    Province / State
                    <input
                      type="text"
                      value={checkoutForm.province}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          province: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    Postal Code
                    <input
                      type="text"
                      value={checkoutForm.postalCode}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          postalCode: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                    Notes
                    <textarea
                      rows={4}
                      value={checkoutForm.notes}
                      onChange={(event) =>
                        setCheckoutForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-[#EE4D2D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d83f22] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {quickViewProduct ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
          onClick={() => setQuickViewProduct(null)}
        >
          <div
            className="mx-auto mt-6 max-h-[calc(100vh-3rem)] w-[calc(100%-1rem)] max-w-5xl overflow-y-auto rounded-[28px] bg-white shadow-2xl sm:mt-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="overflow-hidden rounded-3xl bg-slate-100">
                  <Image
                    src={quickViewImage || quickViewProduct.imageUrl}
                    alt={quickViewProduct.name}
                    width={820}
                    height={820}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="aspect-square w-full object-cover"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {(quickViewProduct.gallery.length
                    ? quickViewProduct.gallery
                    : [quickViewProduct.imageUrl]
                  ).map((image, index) => (
                    <button
                      key={`${quickViewProduct.id}-thumb-${index}`}
                      type="button"
                      onClick={() => setQuickViewImage(image)}
                      className={`overflow-hidden rounded-2xl border ${
                        quickViewImage === image
                          ? "border-[#EE4D2D]"
                          : "border-slate-200"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${quickViewProduct.name} preview ${index + 1}`}
                        width={160}
                        height={160}
                        className="aspect-square h-auto w-full object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#EE4D2D]">
                      Quick View
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-900">
                      {quickViewProduct.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(null)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#fff4f1] px-3 py-1 text-xs font-bold text-[#EE4D2D]">
                    {quickViewProduct.category}
                  </span>
                  {quickViewProduct.featured ? (
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                      Featured
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 text-4xl font-black text-[#EE4D2D]">
                  {formatMoney(quickViewProduct.price)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {quickViewProduct.stock > 0
                    ? `${quickViewProduct.stock} items still available`
                    : "Currently out of stock"}
                </p>

                <p className="mt-6 text-sm leading-7 text-slate-600">
                  {quickViewProduct.description}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      addToCart(quickViewProduct, { openBasket: true })
                    }
                    disabled={quickViewProduct.stock <= 0}
                    className="rounded-2xl border border-[#EE4D2D]/15 bg-[#fff4f1] px-4 py-3 text-sm font-bold text-[#EE4D2D] transition hover:bg-[#ffe7e1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => buyNow(quickViewProduct)}
                    disabled={quickViewProduct.stock <= 0}
                    className="rounded-2xl bg-[#EE4D2D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d83f22] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
