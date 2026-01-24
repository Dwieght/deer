"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [orderModal, setOrderModal] = useState({ open: false, product: null });
  const [orderForm, setOrderForm] = useState({ customerName: "", phone: "", quantity: 1 });
  const [orderMessage, setOrderMessage] = useState(null);

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
  const orderQuantity = Number.isFinite(orderForm.quantity) && orderForm.quantity > 0 ? orderForm.quantity : 1;

  useEffect(() => {
    if (!orderModal.open) {
      return undefined;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [orderModal.open]);

  useEffect(() => {
    if (!orderModal.open) {
      return undefined;
    }
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOrderModal({ open: false, product: null });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [orderModal.open]);

  const openOrderModal = (product) => {
    setOrderForm({ customerName: "", phone: "", quantity: 1 });
    setOrderMessage(null);
    setOrderModal({ open: true, product });
  };

  const handleOrderInput = (field) => (event) => {
    const value = event.target.value;
    setOrderForm((prev) => ({
      ...prev,
      [field]: field === "quantity" ? Number.parseInt(value || "1", 10) : value,
    }));
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    const product = orderModal.product;
    if (!product) {
      return;
    }
    const payload = {
      customerName: String(orderForm.customerName || "").trim(),
      phone: String(orderForm.phone || "").trim(),
      productId: product.id,
      quantity: orderForm.quantity,
    };
    if (!payload.customerName || !payload.phone) {
      setOrderMessage({ type: "error", text: "Please add your name and phone number." });
      return;
    }
    if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      setOrderMessage({ type: "error", text: "Quantity must be at least 1." });
      return;
    }
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setOrderMessage({ type: "error", text: data?.error || "Order failed." });
        return;
      }
      setOrderMessage({ type: "success", text: "Order placed! We will reach out soon." });
      setOrderForm({ customerName: "", phone: "", quantity: 1 });
    } catch (error) {
      setOrderMessage({ type: "error", text: "Order failed. Please try again." });
    }
  };

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
              <article
                key={product.id}
                className="product-card is-clickable"
                role="button"
                tabIndex={0}
                onClick={() => openOrderModal(product)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openOrderModal(product);
                  }
                }}
              >
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
      {orderModal.open && orderModal.product ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setOrderModal({ open: false, product: null })}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="order-modal-title">Order {orderModal.product.name}</h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => setOrderModal({ open: false, product: null })}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-stack">
                <div>
                  <img
                    src={getProductImageUrl(orderModal.product.imageUrl)}
                    alt={orderModal.product.name}
                    className="dashboard-image"
                    onError={(event) => applyImageFallback(event, normalizeImageUrl(orderModal.product.imageUrl))}
                  />
                  <p className="table-cell-muted">Unit price: {formatAmount(orderModal.product.price)}</p>
                </div>
                <form className="admin-form" onSubmit={handleOrderSubmit}>
                  <label>
                    Customer Name
                    <input
                      type="text"
                      name="customerName"
                      value={orderForm.customerName}
                      onChange={handleOrderInput("customerName")}
                      required
                    />
                  </label>
                  <label>
                    Product
                    <input type="text" value={orderModal.product.name} disabled />
                  </label>
                  <label>
                    Customer Number
                    <input
                      type="text"
                      name="phone"
                      value={orderForm.phone}
                      onChange={handleOrderInput("phone")}
                      required
                    />
                  </label>
                  <label>
                    Quantity
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      step="1"
                      value={orderForm.quantity}
                      onChange={handleOrderInput("quantity")}
                      required
                    />
                  </label>
                  <div className="modal-card">
                    <p className="table-cell-muted">Order Summary</p>
                    <p className="product-price">
                      {formatAmount(orderQuantity * orderModal.product.price)}
                    </p>
                  </div>
                  <button className="primary-button" type="submit">
                    Place Order
                  </button>
                  {orderMessage ? (
                    <p className="form-message" style={{ color: orderMessage.type === "error" ? "#a33" : "#2a3d31" }}>
                      {orderMessage.text}
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
