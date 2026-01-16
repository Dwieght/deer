"use client";

import { useMemo, useState } from "react";

function formatAmount(amount) {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function extractDriveFileId(url) {
  if (!url || !url.includes("drive.google.com")) {
    return "";
  }
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return idMatch[1];
  }
  return "";
}

function driveThumbnailUrl(url) {
  const id = extractDriveFileId(url);
  if (!id) {
    return "";
  }
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

function normalizeImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }
  if (!value.includes("drive.google.com")) {
    return value;
  }
  const fileMatch = value.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }
  const idMatch = value.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }
  if (value.includes("/uc?")) {
    if (value.includes("export=")) {
      return value.replace("export=download", "export=view");
    }
    return value.includes("?") ? `${value}&export=view` : `${value}?export=view`;
  }
  return value;
}

function getQrPreviewUrl(url) {
  return driveThumbnailUrl(url) || normalizeImageUrl(url);
}

function getProductImageUrl(url) {
  return driveThumbnailUrl(url) || normalizeImageUrl(url);
}

function applyImageFallback(event, fallback) {
  const target = event.currentTarget;
  if (fallback && target.src !== fallback) {
    target.src = fallback;
    return;
  }
  if (!target.src.includes("/assets/deer-mark.svg")) {
    target.src = "/assets/deer-mark.svg";
  }
}

export default function ShopClient({ products = [], paymentQrs = [] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const unique = new Set();
    products.forEach((product) => {
      if (product.category) {
        unique.add(product.category);
      }
    });
    return ["All", ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      if (activeCategory !== "All" && product.category !== activeCategory) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [product.name, product.category, product.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query));
    });
  }, [products, searchQuery, activeCategory]);

  const activeQr = paymentQrs[0] || null;
  const activeQrImage = activeQr?.imageUrl ? getQrPreviewUrl(activeQr.imageUrl) : "";
  const headerQrImage = activeQrImage || "/assets/deer-mark.svg";
  const headerQrFallback = activeQr?.imageUrl ? normalizeImageUrl(activeQr.imageUrl) : "";

  return (
    <>
      <div className="bg-texture" aria-hidden="true" />
      <header className="site-header">
        <a className="skip-link" href="#shop">
          Skip to content
        </a>
        <div className="logo">
          <img
            src="/assets/logo_no_bg.png"
            alt="Deer Army logo"
            onError={(event) => {
              event.currentTarget.src = "/assets/deer-mark.svg";
            }}
          />
          <span>Deer Army</span>
        </div>
        <nav className="site-nav" aria-label="Primary">
          <a href="/#home">Home</a>
          <a href="/#updates">Updates</a>
          <a href="/#letters">Fan Letters</a>
          <a href="/#gifts">Gifts &amp; Surprises</a>
          <a href="/#videos">Videos</a>
          <a href="/#gallery">Fan Gallery</a>
          <a href="/shop" aria-current="page">
            Shop
          </a>
          <a href="/#support">Support</a>
          <a href="/#join">Join</a>
          <a href="/#announcements">Announcements</a>
          <a href="/#about">About Us</a>
          <a href="/#contact">Contact</a>
          <a href="/login">Login</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        <div className="nav-actions">
          <a className="header-qr" href="/#support" aria-label="Support QR code">
            <img
              src={headerQrImage}
              alt="Support QR"
              onError={(event) => applyImageFallback(event, headerQrFallback)}
            />
            <span>Support</span>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <aside className={`mobile-menu ${mobileMenuOpen ? "is-open" : ""}`} aria-label="Mobile">
        <a href="/#home" onClick={() => setMobileMenuOpen(false)}>
          Home
        </a>
        <a href="/#updates" onClick={() => setMobileMenuOpen(false)}>
          Updates
        </a>
        <a href="/#letters" onClick={() => setMobileMenuOpen(false)}>
          Fan Letters
        </a>
        <a href="/#gifts" onClick={() => setMobileMenuOpen(false)}>
          Gifts &amp; Surprises
        </a>
        <a href="/#videos" onClick={() => setMobileMenuOpen(false)}>
          Videos
        </a>
        <a href="/#gallery" onClick={() => setMobileMenuOpen(false)}>
          Fan Gallery
        </a>
        <a href="/shop" onClick={() => setMobileMenuOpen(false)}>
          Shop
        </a>
        <a href="/#support" onClick={() => setMobileMenuOpen(false)}>
          Support
        </a>
        <a href="/#join" onClick={() => setMobileMenuOpen(false)}>
          Join
        </a>
        <a href="/#announcements" onClick={() => setMobileMenuOpen(false)}>
          Announcements
        </a>
        <a href="/#about" onClick={() => setMobileMenuOpen(false)}>
          About Us
        </a>
        <a href="/#contact" onClick={() => setMobileMenuOpen(false)}>
          Contact
        </a>
        <a href="/login" onClick={() => setMobileMenuOpen(false)}>
          Login
        </a>
        <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
          Dashboard
        </a>
        {activeQrImage ? (
          <div className="mobile-qr-card">
            <p className="mobile-qr-title">Support the Deer Army</p>
            <img src={activeQrImage} alt="Support QR code" />
            <a href="/#support" onClick={() => setMobileMenuOpen(false)}>
              Go to Support
            </a>
          </div>
        ) : null}
      </aside>

      <main>
        <section className="shop-hero" id="shop">
          <p className="eyebrow">Deer Army Merch</p>
          <h1>Shop with heart</h1>
          <p className="lead">
            Printable stickers, cozy tees, and design packs inspired by Tommy &amp; Ghazel. Every purchase
            supports community projects.
          </p>
          <div className="shop-controls">
            <div className="shop-search">
              <label htmlFor="shop-search" className="table-cell-muted">
                Search
              </label>
              <input
                id="shop-search"
                type="search"
                placeholder="Search merch"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="shop-category-row" role="tablist" aria-label="Product categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`shop-category-button ${activeCategory === category ? "is-active" : ""}`}
              onClick={() => setActiveCategory(category)}
              aria-pressed={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <section className="shop-grid" aria-live="polite">
            <p className="empty-state">No products match your search yet.</p>
          </section>
        ) : (
          <section className="shop-grid" aria-live="polite">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <img
                  src={getProductImageUrl(product.imageUrl)}
                  alt={product.name}
                  className="product-image"
                  onError={(event) => applyImageFallback(event, normalizeImageUrl(product.imageUrl))}
                />
                <span className="product-category">{product.category}</span>
                <div>
                  <h3 className="product-name">{product.name}</h3>
                  {product.description ? <p>{product.description}</p> : null}
                </div>
                <p className="product-price">{formatAmount(product.price)}</p>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
