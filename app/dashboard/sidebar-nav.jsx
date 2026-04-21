"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    label: "Community",
    items: [
      { href: "/dashboard/letters", label: "Fan Letters" },
      { href: "/dashboard/announcements", label: "Announcements" },
      { href: "/dashboard/gallery", label: "Fan Gallery" },
      { href: "/dashboard/videos", label: "Video Library" },
      { href: "/dashboard/join", label: "Join Requests" },
      { href: "/dashboard/pending", label: "Pending Submissions" },
      { href: "/dashboard/about", label: "About Deer Army" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/dashboard/payments", label: "Payment QR" },
      { href: "/dashboard/products", label: "Products" },
      { href: "/dashboard/orders", label: "Orders" },
      { href: "/dashboard/feedbacks", label: "Product Feedback" },
    ],
  },
  {
    label: "Access",
    items: [{ href: "/dashboard/users", label: "Admin Users" }],
  },
];

export default function SidebarNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="dashboard-nav" aria-label="Admin sections">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="dashboard-nav-group">
          <p className="dashboard-nav-label">{group.label}</p>
          {group.items.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
