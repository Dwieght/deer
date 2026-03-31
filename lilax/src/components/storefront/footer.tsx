import Link from "next/link";
import { APP_BADGES, FOOTER_LINK_GROUPS, PAYMENT_BADGES, SOCIAL_BADGES } from "./data";

const LINK_TARGETS: Record<string, string> = {
  "Help Center": "/login",
  "How to Buy": "#just-for-you",
  "Shipping Guide": "#flash-sale",
  "Return Policy": "/signup",
  "About Us": "/",
  Promotions: "#flash-sale",
  "Privacy Notice": "/signup",
  "Terms of Service": "/signup",
  "Quick Links": "/",
  "Flash Sale": "#flash-sale",
  "Just For You": "#just-for-you",
  Categories: "#categories",
  Basket: "#"
};

export default function StorefrontFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-500">
                {group.links.map((link) => (
                  <li key={link}>
                    <Link href={LINK_TARGETS[link] || "/"} className="transition hover:text-[#EE4D2D]">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="grid gap-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
              Download the App
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {APP_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
              Follow Us
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {SOCIAL_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-900">
              Payment Methods
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {PAYMENT_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-4 text-center text-sm text-slate-500">
        © 2026 Lilax. Built for a cleaner, marketplace-first shopping flow.
      </div>
    </footer>
  );
}
