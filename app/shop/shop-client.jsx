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
    return value.includes("?")
      ? `${value}&export=view`
      : `${value}?export=view`;
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
  const [descModal, setDescModal] = useState({ open: false, product: null });
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    phone: "",
    quantity: 1,
    region: "",
    regionOther: "",
    province: "",
    city: "",
    barangay: "",
    postalCode: "",
    streetName: "",
    building: "",
    houseNo: "",
    addressLabel: "home",
    size: "",
    gcashReference: "",
  });
  const [orderMessage, setOrderMessage] = useState(null);
  const [showQrCodes, setShowQrCodes] = useState(false);

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

  const REGION_OPTIONS = [
    "Metro Manila",
    "North Luzon",
    "South Luzon",
    "Visayas",
    "Mindanao",
  ];

  const activeQr = paymentQrs[0] || null;
  const activeQrImage = activeQr?.imageUrl
    ? getQrPreviewUrl(activeQr.imageUrl)
    : "";
  const headerQrImage = activeQrImage || "/assets/deer-mark.svg";
  const headerQrFallback = activeQr?.imageUrl
    ? normalizeImageUrl(activeQr.imageUrl)
    : "";
  const orderQuantity =
    Number.isFinite(orderForm.quantity) && orderForm.quantity > 0
      ? orderForm.quantity
      : 1;

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
    if (!orderModal.open || !orderModal.product?.images?.length) {
      return undefined;
    }
    orderModal.product.images.forEach((imageUrl) => {
      const preview = getProductImageUrl(imageUrl);
      const full = normalizeImageUrl(imageUrl);
      const previewImg = new Image();
      previewImg.src = preview;
      if (full && full !== preview) {
        const fullImg = new Image();
        fullImg.src = full;
      }
    });
    return undefined;
  }, [orderModal.open, orderModal.product]);

  useEffect(() => {
    if (!descModal.open) {
      return undefined;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [descModal.open]);

  useEffect(() => {
    if (!descModal.open) {
      return undefined;
    }
    const handleKey = (event) => {
      if (event.key === "Escape") {
        setDescModal({ open: false, product: null });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [descModal.open]);

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
    setOrderForm({
      customerName: "",
      phone: "",
      quantity: 1,
      region: "",
      regionOther: "",
      province: "",
      city: "",
      barangay: "",
      postalCode: "",
      streetName: "",
      building: "",
      houseNo: "",
      addressLabel: "home",
      size: "",
      gcashReference: "",
    });
    setOrderMessage(null);
    const images = [product.imageUrl, ...(product.imageUrls || [])].filter(Boolean);
    setOrderModal({ open: true, product: { ...product, images }, imageIndex: 0 });
  };

  const handleOrderInput = (field) => (event) => {
    const value = event.target.value;
    setOrderForm((prev) => ({
      ...prev,
      [field]: field === "quantity" ? Number.parseInt(value || "1", 10) : value,
    }));
  };

  const handleRegionChange = (event) => {
    const region = event.target.value;
    setOrderForm((prev) => ({
      ...prev,
      region,
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
      region:
        orderForm.region === "Other"
          ? String(orderForm.regionOther || "").trim()
          : String(orderForm.region || "").trim(),
      province: String(orderForm.province || "").trim(),
      city: String(orderForm.city || "").trim(),
      barangay: String(orderForm.barangay || "").trim(),
      postalCode: String(orderForm.postalCode || "").trim(),
      streetName: String(orderForm.streetName || "").trim(),
      building: String(orderForm.building || "").trim(),
      houseNo: String(orderForm.houseNo || "").trim(),
      addressLabel: String(orderForm.addressLabel || "").trim(),
      size: String(orderForm.size || "").trim(),
      gcashReference: String(orderForm.gcashReference || "").trim(),
    };
    if (!payload.customerName || !payload.phone) {
      setOrderMessage({
        type: "error",
        text: "Please add your name and phone number.",
      });
      return;
    }
    if (!/^\d{11,12}$/.test(payload.phone)) {
      setOrderMessage({
        type: "error",
        text: "Phone number must be 11 or 12 digits.",
      });
      window.alert("Phone number must be 11 or 12 digits.");
      return;
    }
    if (orderModal.product?.sizes?.length && !payload.size) {
      setOrderMessage({
        type: "error",
        text: "Please select a size.",
      });
      window.alert("Please select a size.");
      return;
    }
    if (!payload.region) {
      setOrderMessage({
        type: "error",
        text: "Please select a region.",
      });
      window.alert("Please select a region.");
      return;
    }
    if (!payload.gcashReference) {
      setOrderMessage({
        type: "error",
        text: "GCash reference number is required.",
      });
      window.alert("GCash reference number is required.");
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
        setOrderMessage({
          type: "error",
          text: data?.error || "Order failed.",
        });
        return;
      }
      setOrderMessage({
        type: "success",
        text: "Order placed! We will reach out soon.",
      });
      window.alert("Order submitted! We will contact you to confirm the details.");
      setOrderForm({
        customerName: "",
        phone: "",
        quantity: 1,
        region: "",
        regionOther: "",
        province: "",
        city: "",
        barangay: "",
        postalCode: "",
        streetName: "",
        building: "",
        houseNo: "",
        addressLabel: "home",
        size: "",
        gcashReference: "",
      });
    } catch (error) {
      setOrderMessage({
        type: "error",
        text: "Order failed. Please try again.",
      });
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
          <a
            className="header-qr"
            href="/#support"
            aria-label="Support QR code"
          >
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

      <aside
        className={`mobile-menu ${mobileMenuOpen ? "is-open" : ""}`}
        aria-label="Mobile"
      >
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
            Printable stickers, cozy tees, and design packs inspired by Tommy
            &amp; Ghazel. Every purchase supports community projects.
          </p>
          {paymentQrs.length ? (
            <div className="action-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowQrCodes((prev) => !prev)}
              >
                {showQrCodes ? "Hide QR Codes" : "Show QR Codes"}
              </button>
            </div>
          ) : null}
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

        <div
          className="shop-category-row"
          role="tablist"
          aria-label="Product categories"
        >
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
                  onError={(event) =>
                    applyImageFallback(
                      event,
                      normalizeImageUrl(product.imageUrl),
                    )
                  }
                />
                <span className="product-category">{product.category}</span>
                <div className="product-content">
                  <h3 className="product-name">{product.name}</h3>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDescModal({ open: true, product });
                    }}
                  >
                    View Description
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openOrderModal(product);
                    }}
                  >
                    Buy Now
                  </button>
                </div>
                <p className="product-price">{formatAmount(product.price)}</p>
              </article>
            ))}
          </section>
        )}
        {showQrCodes && paymentQrs.length ? (
          <section className="section" id="shop-support">
            <div className="section-header">
              <div>
                <h2>Scan to Pay (GCash/QR)</h2>
                <p>Use any of the QR codes below to pay, then wait for our confirmation.</p>
              </div>
              <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
            </div>
            <div className="qr-grid">
              {paymentQrs.map((qr) => (
                <article key={qr.id} className="contact-card qr-card">
                  <h3>{qr.title || "Deer Army QR Code"}</h3>
                  {qr.note ? <p>{qr.note}</p> : null}
                  <img
                    src={getQrPreviewUrl(qr.imageUrl)}
                    alt="Deer Army payment QR code"
                    className="qr-image"
                    onError={(event) => applyImageFallback(event, normalizeImageUrl(qr.imageUrl))}
                  />
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      {descModal.open && descModal.product ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setDescModal({ open: false, product: null })}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desc-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="desc-modal-title">{descModal.product.name}</h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => setDescModal({ open: false, product: null })}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <img
                src={getProductImageUrl(descModal.product.imageUrl)}
                alt={descModal.product.name}
                className="dashboard-image"
                onError={(event) =>
                  applyImageFallback(event, normalizeImageUrl(descModal.product.imageUrl))
                }
              />
              {descModal.product.description ? (
                <p className="product-description">{descModal.product.description}</p>
              ) : (
                <p className="product-description is-empty">No description yet.</p>
              )}
              <div className="action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setDescModal({ open: false, product: null });
                    openOrderModal(descModal.product);
                  }}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
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
                  <div className="product-carousel">
                    <button
                      className="carousel-arrow"
                      type="button"
                      aria-label="Previous photo"
                      onClick={() =>
                        setOrderModal((prev) => {
                          const images = prev.product?.images || [];
                          if (!images.length) {
                            return prev;
                          }
                          const index = (prev.imageIndex || 0) - 1;
                          return { ...prev, imageIndex: (index + images.length) % images.length };
                        })
                      }
                    >
                      &larr;
                    </button>
                    <div className="product-carousel-frame">
                      <img
                        src={getProductImageUrl(
                          (orderModal.product.images || [orderModal.product.imageUrl])[
                            orderModal.imageIndex || 0
                          ]
                        )}
                        alt={orderModal.product.name}
                        className="dashboard-image"
                        onError={(event) =>
                          applyImageFallback(
                            event,
                            normalizeImageUrl(
                              (orderModal.product.images || [orderModal.product.imageUrl])[
                                orderModal.imageIndex || 0
                              ]
                            )
                          )
                        }
                      />
                    </div>
                    <button
                      className="carousel-arrow"
                      type="button"
                      aria-label="Next photo"
                      onClick={() =>
                        setOrderModal((prev) => {
                          const images = prev.product?.images || [];
                          if (!images.length) {
                            return prev;
                          }
                          const index = (prev.imageIndex || 0) + 1;
                          return { ...prev, imageIndex: index % images.length };
                        })
                      }
                    >
                      &rarr;
                    </button>
                  </div>
                  <p className="table-cell-muted">
                    Unit price: {formatAmount(orderModal.product.price)}
                  </p>
                </div>
                <form className="admin-form" onSubmit={handleOrderSubmit}>
                  <div className="form-note">
                    Note: At the moment we can only accept orders within the Philippines.
                  </div>
                  <label>
                    Full Name
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
                    <input
                      type="text"
                      value={orderModal.product.name}
                      disabled
                    />
                  </label>
                  {orderModal.product.sizes && orderModal.product.sizes.length ? (
                    <label>
                      Size
                      <select
                        name="size"
                        value={orderForm.size}
                        onChange={handleOrderInput("size")}
                        required
                      >
                        <option value="">Select size</option>
                        {orderModal.product.sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label>
                    Phone Number
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{11,12}"
                      maxLength={12}
                      name="phone"
                      value={orderForm.phone}
                      onChange={handleOrderInput("phone")}
                      required
                    />
                  </label>
                  <label>
                    Region
                    <select
                      value={orderForm.region}
                      onChange={handleRegionChange}
                      required
                    >
                      <option value="">Select region</option>
                      {REGION_OPTIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                      <option value="Other">Other (outside PH)</option>
                    </select>
                  </label>
                  {orderForm.region === "Other" ? (
                    <label>
                      Region (Other)
                      <input
                        type="text"
                        name="regionOther"
                        value={orderForm.regionOther}
                        onChange={handleOrderInput("regionOther")}
                        placeholder="Country / Region"
                        required
                      />
                    </label>
                  ) : null}
                  <label>
                    Province
                    <input
                      type="text"
                      name="province"
                      value={orderForm.province}
                      onChange={handleOrderInput("province")}
                      required
                    />
                  </label>
                  <label>
                    City
                    <input
                      type="text"
                      name="city"
                      value={orderForm.city}
                      onChange={handleOrderInput("city")}
                      required
                    />
                  </label>
                  <label>
                    Barangay
                    <input
                      type="text"
                      name="barangay"
                      value={orderForm.barangay}
                      onChange={handleOrderInput("barangay")}
                      required
                    />
                  </label>
                  <label>
                    Postal Code
                    <input
                      type="text"
                      name="postalCode"
                      value={orderForm.postalCode}
                      onChange={handleOrderInput("postalCode")}
                      required
                    />
                  </label>
                  <label>
                    Street Name
                    <input
                      type="text"
                      name="streetName"
                      value={orderForm.streetName}
                      onChange={handleOrderInput("streetName")}
                      required
                    />
                  </label>
                  <label>
                    Building (optional)
                    <input
                      type="text"
                      name="building"
                      value={orderForm.building}
                      onChange={handleOrderInput("building")}
                    />
                  </label>
                  <label>
                    House No.
                    <input
                      type="text"
                      name="houseNo"
                      value={orderForm.houseNo}
                      onChange={handleOrderInput("houseNo")}
                      required
                    />
                  </label>
                  <label>
                    Address Label
                    <select
                      name="addressLabel"
                      value={orderForm.addressLabel}
                      onChange={handleOrderInput("addressLabel")}
                      required
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                    </select>
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
                  <label>
                    GCash Reference Number
                    <input
                      type="text"
                      name="gcashReference"
                      value={orderForm.gcashReference}
                      onChange={handleOrderInput("gcashReference")}
                      required
                    />
                  </label>
                  <div className="modal-card">
                    <p className="table-cell-muted">Order Summary</p>
                    <p className="product-price">
                      {formatAmount(orderQuantity * orderModal.product.price)}
                    </p>
                  </div>
                  {paymentQrs.length ? (
                    <div className="action-row">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setShowQrCodes((prev) => !prev)}
                      >
                        {showQrCodes ? "Hide QR Codes" : "Show QR Codes"}
                      </button>
                    </div>
                  ) : null}
                  {showQrCodes && paymentQrs.length ? (
                    <div className="qr-grid">
                      <article className="contact-card qr-card">
                        <img
                          src={getQrPreviewUrl(paymentQrs[0].imageUrl)}
                          alt="Deer Army payment QR code"
                          className="qr-image"
                          onError={(event) => applyImageFallback(event, normalizeImageUrl(paymentQrs[0].imageUrl))}
                        />
                      </article>
                    </div>
                  ) : null}
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={!orderForm.gcashReference.trim()}
                  >
                    Place Order
                  </button>
                  {orderMessage ? (
                    <p
                      className="form-message"
                      style={{
                        color:
                          orderMessage.type === "error" ? "#a33" : "#2a3d31",
                      }}
                    >
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
