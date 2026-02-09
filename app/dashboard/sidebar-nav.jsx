"use client";

import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/letters", label: "Fan Letters" },
  { href: "/dashboard/announcements", label: "Announcements" },
  { href: "/dashboard/gallery", label: "Fan Gallery" },
  { href: "/dashboard/videos", label: "Video Library" },
  { href: "/dashboard/payments", label: "Payment QR" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/feedbacks", label: "Product Feedback" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/join", label: "Join Requests" },
  { href: "/dashboard/about", label: "About Deer Army" },
  { href: "/dashboard/users", label: "Admin Users" },
  { href: "/dashboard/pending", label: "Pending Submissions" },
];

export default function SidebarNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="dashboard-nav" aria-label="Admin sections">
      <a href="/">Home</a>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            className={isActive ? "is-active" : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
