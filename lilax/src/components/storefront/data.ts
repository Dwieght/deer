export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTYnIGhlaWdodD0nMTYnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzE2JyBoZWlnaHQ9JzE2JyBmaWxsPScjZmZlNGQ1Jy8+PC9zdmc+";

export const HERO_SLIDES = [
  {
    id: "slide-1",
    badge: "Mega Deals",
    title: "Score daily finds before they sell out.",
    description:
      "Fresh drops, warm essentials, and limited-time markdowns across the Lilax storefront.",
    ctaLabel: "Shop Flash Sale",
    ctaHref: "#flash-sale",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "slide-2",
    badge: "Free Shipping Push",
    title: "Build a basket that feels like a weekend reset.",
    description:
      "Desk upgrades, carry goods, and practical picks arranged in a cleaner marketplace flow.",
    ctaLabel: "Explore Categories",
    ctaHref: "#categories",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80"
  },
  {
    id: "slide-3",
    badge: "Just For You",
    title: "Browse faster with a Shopee-style product wall.",
    description:
      "Search, hover, quick-view, and add to basket without digging through multiple screens.",
    ctaLabel: "View Products",
    ctaHref: "#just-for-you",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&q=80"
  }
] as const;

export const CATEGORY_TILES = [
  { id: "fashion", label: "Fashion", icon: "👕", category: "Accessories" },
  { id: "bags", label: "Bags", icon: "👜", category: "Bags" },
  { id: "desk", label: "Desk", icon: "🖥️", category: "Desk" },
  { id: "drinkware", label: "Drinkware", icon: "🥤", category: "Drinkware" },
  { id: "paper", label: "Paper", icon: "📒", category: "Paper" },
  { id: "home", label: "Home", icon: "🏠", category: "Home" },
  { id: "lifestyle", label: "Lifestyle", icon: "✨", category: "Accessories" },
  { id: "travel", label: "Travel", icon: "🧳", category: "Bags" },
  { id: "work", label: "Workspace", icon: "💼", category: "Desk" },
  { id: "wellness", label: "Wellness", icon: "🫶", category: "Drinkware" },
  { id: "stationery", label: "Stationery", icon: "✏️", category: "Paper" },
  { id: "decor", label: "Decor", icon: "🕯️", category: "Home" }
] as const;

export const PROMO_BANNERS = [
  {
    id: "promo-1",
    title: "Basket Bonus Picks",
    description: "Layer your cart with practical bestsellers and soft daily-use items.",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    href: "#just-for-you"
  },
  {
    id: "promo-2",
    title: "Warm Workspace Refresh",
    description: "Desk goods, note tools, and simple organizers with a lighter shopping flow.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
    href: "#categories"
  }
] as const;

export const FOOTER_LINK_GROUPS = [
  {
    title: "Customer Care",
    links: ["Help Center", "How to Buy", "Shipping Guide", "Return Policy"]
  },
  {
    title: "Lilax",
    links: ["About Us", "Promotions", "Privacy Notice", "Terms of Service"]
  },
  {
    title: "Quick Links",
    links: ["Flash Sale", "Just For You", "Categories", "Basket"]
  }
] as const;

export const APP_BADGES = ["App Store", "Google Play", "AppGallery"] as const;
export const SOCIAL_BADGES = ["Facebook", "Instagram", "TikTok", "YouTube"] as const;
export const PAYMENT_BADGES = ["Visa", "Mastercard", "GCash", "Maya", "COD"] as const;

const DISCOUNT_CYCLE = [15, 22, 18, 35, 28, 12, 40, 25];
const SOLD_RATIO_CYCLE = [0.68, 0.84, 0.55, 0.91, 0.76, 0.61, 0.48, 0.88];

export function getFlashSaleMeta(index: number, stock: number, price: number) {
  const discountPercent = DISCOUNT_CYCLE[index % DISCOUNT_CYCLE.length];
  const soldRatio = SOLD_RATIO_CYCLE[index % SOLD_RATIO_CYCLE.length];
  const inferredInventory = Math.max(stock + 8, Math.round(stock / Math.max(1 - soldRatio, 0.12)));
  const soldCount = Math.max(1, Math.round(inferredInventory * soldRatio));
  const originalPrice = Number((price / (1 - discountPercent / 100)).toFixed(2));
  return {
    discountPercent,
    soldRatio,
    soldCount,
    originalPrice
  };
}
