"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addProductToCart,
  removeCartItemByKey,
  updateCartItemInCart,
} from "./cart-utils.mjs";
import { getNextFocusIndex } from "./modal-focus-utils.mjs";

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

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

const FILLED_STAR = "\u2605";
const EMPTY_STAR = "\u2606";

function renderStars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return FILLED_STAR.repeat(value) + EMPTY_STAR.repeat(5 - value);
}

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

function trapFocus(event, container) {
  if (event.key !== "Tab" || !container) {
    return;
  }

  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.indexOf(document.activeElement);
  const nextIndex = getNextFocusIndex(
    currentIndex,
    focusableElements.length,
    event.shiftKey,
  );

  if (nextIndex === -1) {
    event.preventDefault();
    container.focus();
    return;
  }

  const isBoundaryTransition =
    currentIndex === -1 ||
    (event.shiftKey && currentIndex === 0) ||
    (!event.shiftKey && currentIndex === focusableElements.length - 1);

  if (isBoundaryTransition) {
    event.preventDefault();
    focusableElements[nextIndex].focus();
  }
}

export default function ShopClient({
  products = [],
  paymentQrs = [],
  feedbackSummaryByProduct = {},
  feedbackPreviewByProduct = {},
  initialProductId = "",
  initialFeedback = false,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [orderModal, setOrderModal] = useState({ open: false, product: null });
  const [descModal, setDescModal] = useState({ open: false, product: null });
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    product: null,
  });
  const [feedbackForm, setFeedbackForm] = useState({
    fullName: "",
    rating: 0,
    message: "",
  });
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: "",
    phone: "",
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
    gcashReference: "",
  });
  const [checkoutMessage, setCheckoutMessage] = useState(null);
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
  const [copiedProductId, setCopiedProductId] = useState("");
  const hasOpenedRef = useRef(false);
  const [trackModal, setTrackModal] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [trackMessage, setTrackMessage] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const descDialogRef = useRef(null);
  const orderDialogRef = useRef(null);
  const cartDialogRef = useRef(null);
  const checkoutDialogRef = useRef(null);
  const feedbackDialogRef = useRef(null);
  const trackDialogRef = useRef(null);
  const focusReturnStackRef = useRef([]);

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
  const activeDialogKey = trackModal
    ? "track"
    : feedbackModal.open
      ? "feedback"
      : checkoutOpen
        ? "checkout"
        : cartOpen
          ? "cart"
          : orderModal.open
            ? "order"
            : descModal.open
              ? "desc"
              : null;

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
    if (!activeDialogKey) {
      return undefined;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialogRefMap = {
      desc: descDialogRef,
      order: orderDialogRef,
      cart: cartDialogRef,
      checkout: checkoutDialogRef,
      feedback: feedbackDialogRef,
      track: trackDialogRef,
    };
    const dialog = dialogRefMap[activeDialogKey]?.current;
    let rafId = 0;

    const closeDialogByKey = (key) => {
      if (key === "desc") {
        closeDescModal();
        return;
      }
      if (key === "order") {
        closeOrderModal();
        return;
      }
      if (key === "cart") {
        closeCart();
        return;
      }
      if (key === "checkout") {
        closeCheckout();
        return;
      }
      if (key === "feedback") {
        closeFeedbackModal();
        return;
      }
      if (key === "track") {
        closeTrackModal();
      }
    };

    if (dialog) {
      rafId = window.requestAnimationFrame(() => {
        const focusableElements = getFocusableElements(dialog);
        (focusableElements[0] || dialog).focus();
      });

      const handleDialogKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeDialogByKey(activeDialogKey);
          return;
        }

        trapFocus(event, dialog);
      };

      dialog.addEventListener("keydown", handleDialogKeyDown);

      return () => {
        window.cancelAnimationFrame(rafId);
        dialog.removeEventListener("keydown", handleDialogKeyDown);
        document.body.style.overflow = previous;
      };
    }

    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeDialogKey]);

  const rememberFocusTarget = () => {
    if (typeof document === "undefined") {
      return;
    }

    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!activeElement || activeElement === document.body) {
      return;
    }

    focusReturnStackRef.current.push(activeElement);
  };

  const restoreFocusTarget = () => {
    while (focusReturnStackRef.current.length) {
      const target = focusReturnStackRef.current.pop();
      if (target && target.isConnected && typeof target.focus === "function") {
        target.focus();
        return;
      }
    }
  };

  const closeDescModal = (restoreFocus = true) => {
    setDescModal({ open: false, product: null });
    if (restoreFocus) {
      restoreFocusTarget();
    }
  };

  const closeOrderModal = (restoreFocus = true) => {
    setOrderModal({ open: false, product: null });
    if (restoreFocus) {
      restoreFocusTarget();
    }
  };

  const closeFeedbackModal = (restoreFocus = true) => {
    setFeedbackModal({ open: false, product: null });
    if (restoreFocus) {
      restoreFocusTarget();
    }
  };

  const openCart = () => {
    rememberFocusTarget();
    setCartOpen(true);
  };

  const closeCart = (restoreFocus = true) => {
    setCartOpen(false);
    if (restoreFocus) {
      restoreFocusTarget();
    }
  };

  const openCheckout = () => {
    rememberFocusTarget();
    setCheckoutOpen(true);
  };

  const closeCheckout = (restoreFocus = true) => {
    setCheckoutOpen(false);
    if (restoreFocus) {
      restoreFocusTarget();
    }
  };

  const openTrackModal = () => {
    rememberFocusTarget();
    setTrackId("");
    setTrackResult(null);
    setTrackMessage(null);
    setTrackModal(true);
  };

  const closeTrackModal = (restoreFocus = true) => {
    setTrackModal(false);
    if (restoreFocus) {
      restoreFocusTarget();
    }
  };

  const openOrderModal = (product) => {
    rememberFocusTarget();
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
    const images = [product.imageUrl, ...(product.imageUrls || [])].filter(
      Boolean,
    );
    setOrderModal({
      open: true,
      product: { ...product, images },
      imageIndex: 0,
    });
  };

  const addToCart = (product) => {
    setCartItems((prev) => addProductToCart(prev, product));
    openCart();
  };

  const updateCartItem = (itemKey, updates) => {
    setCartItems((prev) => updateCartItemInCart(prev, itemKey, updates));
  };

  const removeCartItem = (itemKey) => {
    setCartItems((prev) => removeCartItemByKey(prev, itemKey));
  };

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + item.price * Math.max(1, item.quantity || 1),
        0,
      ),
    [cartItems],
  );

  const openDescModal = (product) => {
    rememberFocusTarget();
    setDescModal({ open: true, product });
    setFeedbackForm({ fullName: "", rating: 0, message: "" });
    setFeedbackHover(0);
    setFeedbackMessage(null);
  };

  const openFeedbackModal = (product) => {
    rememberFocusTarget();
    setFeedbackModal({ open: true, product });
    setFeedbackForm({ fullName: "", rating: 0, message: "" });
    setFeedbackHover(0);
    setFeedbackMessage(null);
  };

  useEffect(() => {
    if (!initialProductId || hasOpenedRef.current) {
      return;
    }
    const match = products.find((product) => product.id === initialProductId);
    if (!match) {
      return;
    }
    hasOpenedRef.current = true;
    if (initialFeedback) {
      openFeedbackModal(match);
    } else {
      openDescModal(match);
    }
    const element = document.getElementById(`product-${match.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [initialProductId, initialFeedback, products]);

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
      window.alert(
        "Order submitted! We will contact you to confirm the details.",
      );
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

  const handleCopyLink = async (productId, mode = "feedback") => {
    const base = `${window.location.origin}/shop?product=${encodeURIComponent(
      productId,
    )}`;
    const url = mode === "feedback" ? `${base}&feedback=1` : base;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedProductId(productId);
      window.setTimeout(() => setCopiedProductId(""), 1500);
    } catch (error) {
      window.prompt("Copy this link:", url);
    }
  };

  const handleTrackSubmit = async (event) => {
    event.preventDefault();
    const value = String(trackId || "").trim();
    if (!value) {
      setTrackMessage({ type: "error", text: "Please enter your Order ID." });
      setTrackResult(null);
      return;
    }
    setTrackLoading(true);
    setTrackMessage(null);
    setTrackResult(null);
    try {
      const response = await fetch(
        `/api/orders?orderId=${encodeURIComponent(value)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        setTrackMessage({
          type: "error",
          text: data?.error || "Order not found.",
        });
        setTrackLoading(false);
        return;
      }
      setTrackResult(data.order);
      setTrackLoading(false);
    } catch (error) {
      setTrackMessage({
        type: "error",
        text: "Lookup failed. Please try again.",
      });
      setTrackLoading(false);
    }
  };

  const handleCheckoutSubmit = async (event) => {
    event.preventDefault();
    if (!cartItems.length) {
      setCheckoutMessage({ type: "error", text: "Your cart is empty." });
      return;
    }
    const payloadBase = {
      customerName: String(checkoutForm.customerName || "").trim(),
      phone: String(checkoutForm.phone || "").trim(),
      region:
        checkoutForm.region === "Other"
          ? String(checkoutForm.regionOther || "").trim()
          : String(checkoutForm.region || "").trim(),
      province: String(checkoutForm.province || "").trim(),
      city: String(checkoutForm.city || "").trim(),
      barangay: String(checkoutForm.barangay || "").trim(),
      postalCode: String(checkoutForm.postalCode || "").trim(),
      streetName: String(checkoutForm.streetName || "").trim(),
      building: String(checkoutForm.building || "").trim(),
      houseNo: String(checkoutForm.houseNo || "").trim(),
      addressLabel: String(checkoutForm.addressLabel || "").trim(),
      gcashReference: String(checkoutForm.gcashReference || "").trim(),
    };

    if (!payloadBase.customerName || !payloadBase.phone) {
      setCheckoutMessage({
        type: "error",
        text: "Please add your name and phone number.",
      });
      return;
    }
    if (!/^\d{11,12}$/.test(payloadBase.phone)) {
      setCheckoutMessage({
        type: "error",
        text: "Phone number must be 11 or 12 digits.",
      });
      return;
    }
    if (!payloadBase.region) {
      setCheckoutMessage({
        type: "error",
        text: "Please select a region.",
      });
      return;
    }
    if (!payloadBase.province || !payloadBase.city || !payloadBase.barangay) {
      setCheckoutMessage({
        type: "error",
        text: "Please complete the address fields.",
      });
      return;
    }
    if (
      !payloadBase.postalCode ||
      !payloadBase.streetName ||
      !payloadBase.houseNo ||
      !payloadBase.addressLabel
    ) {
      setCheckoutMessage({
        type: "error",
        text: "Please complete the address fields.",
      });
      return;
    }
    if (!payloadBase.gcashReference) {
      setCheckoutMessage({
        type: "error",
        text: "GCash reference number is required.",
      });
      return;
    }

    setCheckoutMessage(null);
    try {
      for (const item of cartItems) {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payloadBase,
            productId: item.productId,
            quantity: item.quantity,
            size: item.size || "",
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Order failed.");
        }
      }
      setCheckoutMessage({
        type: "success",
        text: "Order submitted! We will confirm shortly.",
      });
      window.alert("Order submitted! We will contact you to confirm.");
      setCartItems([]);
      focusReturnStackRef.current = [];
      closeCheckout(false);
      closeCart(false);
      setCheckoutForm({
        customerName: "",
        phone: "",
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
        gcashReference: "",
      });
    } catch (error) {
      setCheckoutMessage({
        type: "error",
        text: error?.message || "Order failed. Please try again.",
      });
    }
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!feedbackModal.product) {
      return;
    }
    const payload = {
      productId: feedbackModal.product.id,
      fullName: String(feedbackForm.fullName || "").trim(),
      rating: Number(feedbackForm.rating),
      message: String(feedbackForm.message || "").trim(),
    };

    if (!payload.fullName || !payload.message || !payload.rating) {
      setFeedbackMessage({
        type: "error",
        text: "Please add your name, rating, and feedback.",
      });
      return;
    }

    try {
      const response = await fetch("/api/submissions/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setFeedbackMessage({
          type: "error",
          text: data?.error || "Submission failed.",
        });
        return;
      }
      setFeedbackForm({ fullName: "", rating: 0, message: "" });
      setFeedbackHover(0);
      setFeedbackMessage({
        type: "success",
        text: "Thanks! Your feedback will appear after approval.",
      });
      window.alert("Feedback submitted! Thank you.");
      window.setTimeout(() => {
        closeFeedbackModal();
        setFeedbackMessage(null);
      }, 900);
    } catch (error) {
      setFeedbackMessage({
        type: "error",
        text: "Submission failed. Please try again.",
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
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="shop-mobile-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <aside
        id="shop-mobile-menu"
        className={`mobile-menu ${mobileMenuOpen ? "is-open" : ""}`}
        aria-label="Mobile"
        hidden={!mobileMenuOpen}
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
              <button
                className="ghost-button"
                type="button"
                onClick={openTrackModal}
              >
                📦 Track Order
              </button>
            </div>
          ) : (
            <div className="action-row">
              <button
                className="ghost-button"
                type="button"
                onClick={openTrackModal}
              >
                📦 Track Order
              </button>
            </div>
          )}
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

        <div className="shop-category-row" role="group" aria-label="Product categories">
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
            {filteredProducts.map((product, index) => (
              <article
                key={product.id}
                id={`product-${product.id}`}
                className={`product-card ${
                  initialProductId === product.id ? "is-highlight" : ""
                }`}
              >
                <img
                  src={getProductImageUrl(product.imageUrl)}
                  alt={product.name}
                  className="product-image"
                  loading={index < 4 ? "eager" : "lazy"}
                  decoding="async"
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
                  {feedbackSummaryByProduct[product.id]?.count ? (
                    <div className="rating-summary">
                      <span className="rating-stars">
                        {renderStars(
                          Math.round(
                            feedbackSummaryByProduct[product.id].avg,
                          ),
                        )}
                      </span>
                      <span className="rating-count">
                        {feedbackSummaryByProduct[product.id].avg.toFixed(1)} (
                        {feedbackSummaryByProduct[product.id].count})
                      </span>
                    </div>
                  ) : (
                    <div className="rating-summary is-empty">
                      No reviews yet
                    </div>
                  )}
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDescModal(product);
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
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      addToCart(product);
                    }}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="light-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openFeedbackModal(product);
                    }}
                  >
                    Add Feedback
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
                <p>
                  Use any of the QR codes below to pay, then wait for our
                  confirmation.
                </p>
              </div>
              <img
                className="section-icon"
                src="/assets/deer-mark.svg"
                alt="Deer icon"
              />
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
                    onError={(event) =>
                      applyImageFallback(event, normalizeImageUrl(qr.imageUrl))
                    }
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
          onClick={() => closeDescModal()}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desc-modal-title"
            ref={descDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="desc-modal-title">{descModal.product.name}</h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => closeDescModal()}
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
                  applyImageFallback(
                    event,
                    normalizeImageUrl(descModal.product.imageUrl),
                  )
                }
              />
              {descModal.product.description ? (
                <p className="product-description">
                  {descModal.product.description}
                </p>
              ) : (
                <p className="product-description is-empty">
                  No description yet.
                </p>
              )}
              <div className="action-row">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    closeDescModal(false);
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
          onClick={() => closeOrderModal()}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            ref={orderDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="order-modal-title">Order {orderModal.product.name}</h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => closeOrderModal()}
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
                          return {
                            ...prev,
                            imageIndex: (index + images.length) % images.length,
                          };
                        })
                      }
                    >
                      &larr;
                    </button>
                    <div className="product-carousel-frame">
                      <img
                        src={getProductImageUrl(
                          (orderModal.product.images || [
                            orderModal.product.imageUrl,
                          ])[orderModal.imageIndex || 0],
                        )}
                        alt={orderModal.product.name}
                        className="dashboard-image"
                        onError={(event) =>
                          applyImageFallback(
                            event,
                            normalizeImageUrl(
                              (orderModal.product.images || [
                                orderModal.product.imageUrl,
                              ])[orderModal.imageIndex || 0],
                            ),
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
                    Note: At the moment we can only accept orders within the
                    Philippines.
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
                  {orderModal.product.sizes &&
                  orderModal.product.sizes.length ? (
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
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={openCart}
                      >
                        Cart ({cartItems.length})
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
                          onError={(event) =>
                            applyImageFallback(
                              event,
                              normalizeImageUrl(paymentQrs[0].imageUrl),
                            )
                          }
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
                      className={`form-message ${
                        orderMessage.type === "error"
                          ? "is-error"
                          : "is-success"
                      }`}
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
      {cartOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => closeCart()}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-modal-title"
            ref={cartDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="cart-modal-title">Your Cart</h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => closeCart()}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              {cartItems.length === 0 ? (
                <p className="empty-state">Your cart is empty.</p>
              ) : (
                <>
                  <div className="cart-list">
                    {cartItems.map((item) => (
                      <div key={item.itemKey} className="cart-item">
                        <img
                          src={getProductImageUrl(item.imageUrl)}
                          alt={item.name}
                          className="cart-image"
                        />
                        <div className="cart-info">
                          <h4>{item.name}</h4>
                          <p className="table-cell-muted">
                            {formatAmount(item.price)}
                          </p>
                          {item.sizes?.length ? (
                            <select
                              value={item.size}
                              onChange={(event) =>
                                updateCartItem(item.itemKey, {
                                  size: event.target.value,
                                })
                              }
                            >
                              {item.sizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          ) : null}
                          <div className="cart-qty">
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() =>
                                updateCartItem(item.itemKey, {
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              }
                            >
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              className="ghost-button"
                              onClick={() =>
                                updateCartItem(item.itemKey, {
                                  quantity: item.quantity + 1,
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => removeCartItem(item.itemKey)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="cart-summary">
                    <span>Total</span>
                    <strong>{formatAmount(cartTotal)}</strong>
                  </div>
                  <div className="action-row">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        closeCart(false);
                        openCheckout();
                      }}
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {checkoutOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => closeCheckout()}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-modal-title"
            ref={checkoutDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="checkout-modal-title">Checkout</h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => closeCheckout()}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="checkout-summary">
                {cartItems.map((item) => (
                  <div key={item.productId} className="checkout-line">
                    <span>
                      {item.name} {item.size ? `(${item.size})` : ""} x
                      {item.quantity}
                    </span>
                    <span>{formatAmount(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="checkout-total">
                  <span>Total</span>
                  <strong>{formatAmount(cartTotal)}</strong>
                </div>
              </div>
              <form className="admin-form" onSubmit={handleCheckoutSubmit}>
                <div className="form-note">
                  Note: At the moment we can only accept orders within the
                  Philippines.
                </div>
                <label>
                  Full Name
                  <input
                    type="text"
                    value={checkoutForm.customerName}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        customerName: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="text"
                    value={checkoutForm.phone}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Region
                  <select
                    value={checkoutForm.region}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        region: event.target.value,
                      }))
                    }
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
                {checkoutForm.region === "Other" ? (
                  <label>
                    Region (Other)
                    <input
                      type="text"
                      value={checkoutForm.regionOther}
                      onChange={(event) =>
                        setCheckoutForm((prev) => ({
                          ...prev,
                          regionOther: event.target.value,
                        }))
                      }
                    />
                  </label>
                ) : null}
                <label>
                  Province
                  <input
                    type="text"
                    value={checkoutForm.province}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        province: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  City
                  <input
                    type="text"
                    value={checkoutForm.city}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        city: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Barangay
                  <input
                    type="text"
                    value={checkoutForm.barangay}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        barangay: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Postal Code
                  <input
                    type="text"
                    value={checkoutForm.postalCode}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        postalCode: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Street Name
                  <input
                    type="text"
                    value={checkoutForm.streetName}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        streetName: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Building
                  <input
                    type="text"
                    value={checkoutForm.building}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        building: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  House No.
                  <input
                    type="text"
                    value={checkoutForm.houseNo}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        houseNo: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Address Label
                  <select
                    value={checkoutForm.addressLabel}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        addressLabel: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                  </select>
                </label>
                <label>
                  GCash Reference
                  <input
                    type="text"
                    value={checkoutForm.gcashReference}
                    onChange={(event) =>
                      setCheckoutForm((prev) => ({
                        ...prev,
                        gcashReference: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <button className="primary-button" type="submit">
                  Place Order
                </button>
                {checkoutMessage ? (
                  <p
                    className={`form-message ${
                      checkoutMessage.type === "error"
                        ? "is-error"
                        : "is-success"
                    }`}
                  >
                    {checkoutMessage.text}
                  </p>
                ) : null}
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {feedbackModal.open && feedbackModal.product ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => closeFeedbackModal()}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            ref={feedbackDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="feedback-modal-title">
                Feedback for {feedbackModal.product.name}
              </h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => closeFeedbackModal()}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="feedback-section">
                <h4>Customer Feedback</h4>
                <div className="feedback-link-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      handleCopyLink(feedbackModal.product.id, "feedback")
                    }
                  >
                    {copiedProductId === feedbackModal.product.id
                      ? "Copied"
                      : "Copy Feedback Link"}
                  </button>
                </div>
                {(feedbackPreviewByProduct[feedbackModal.product.id] || [])
                  .length ? (
                  <div className="feedback-list">
                    {(feedbackPreviewByProduct[feedbackModal.product.id] || [])
                      .map((item) => (
                        <article key={item.id} className="feedback-card">
                          <div className="feedback-header">
                            <span className="rating-stars">
                              {renderStars(item.rating)}
                            </span>
                            <span className="table-cell-muted">
                              {item.fullName}
                            </span>
                          </div>
                          <p>{item.message}</p>
                        </article>
                      ))}
                  </div>
                ) : (
                  <p className="empty-state">No feedback yet.</p>
                )}
                <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                  <label>
                    Rating
                    <div className="rating-input">
                      {[1, 2, 3, 4, 5].map((value) => {
                        const active =
                          (feedbackHover || feedbackForm.rating) >= value;
                        return (
                          <button
                            key={value}
                            type="button"
                            className={active ? "is-active" : ""}
                            onMouseEnter={() => setFeedbackHover(value)}
                            onMouseLeave={() => setFeedbackHover(0)}
                            onClick={() =>
                              setFeedbackForm((prev) => ({
                                ...prev,
                                rating: value,
                              }))
                            }
                            aria-label={`${value} star${value > 1 ? "s" : ""}`}
                          >
                            {FILLED_STAR}
                          </button>
                        );
                      })}
                    </div>
                  </label>
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={feedbackForm.fullName}
                      onChange={(event) =>
                        setFeedbackForm((prev) => ({
                          ...prev,
                          fullName: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Feedback
                    <textarea
                      rows="3"
                      value={feedbackForm.message}
                      onChange={(event) =>
                        setFeedbackForm((prev) => ({
                          ...prev,
                          message: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={
                      !feedbackForm.fullName.trim() ||
                      !feedbackForm.message.trim() ||
                      !feedbackForm.rating
                    }
                  >
                    Submit Feedback
                  </button>
                  {feedbackMessage ? (
                    <p
                      className={`feedback-message ${
                        feedbackMessage.type === "error"
                          ? "is-error"
                          : "is-success"
                      }`}
                    >
                      {feedbackMessage.text}
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {trackModal && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => closeTrackModal()}
        >
          <div
            className="modal track-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-modal-title"
            ref={trackDialogRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="track-modal-title">Track Your Order</h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={() => closeTrackModal()}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <form className="track-form" onSubmit={handleTrackSubmit}>
                <input
                  type="text"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="Order ID (e.g. 21bd4)"
                  aria-label="Order ID"
                />
                <button
                  className="secondary-button"
                  type="submit"
                  disabled={trackLoading}
                >
                  {trackLoading ? "…" : "Track"}
                </button>
              </form>

              {trackMessage && (
                <p
                  className={`form-message track-message ${
                    trackMessage.type === "error" ? "is-error" : "is-success"
                  }`}
                >
                  {trackMessage.text}
                </p>
              )}

              {trackResult && (
                <div className="modal-card track-result-card">
                  {[
                    [
                      "Order ID",
                      <span className="order-id-chip">
                        {trackResult.id.slice(-5)}
                      </span>,
                    ],
                    [
                      "Status",
                      <span className="badge">{trackResult.status}</span>,
                    ],
                    ["Update", trackResult.statusNote || "No update yet."],
                    ["Product", trackResult.productName || "—"],
                    ["Qty", trackResult.quantity],
                    // ["Total", formatAmount(trackResult.total)],
                    ["Placed", formatDate(trackResult.createdAt)],
                  ].map(([label, value], i) => (
                    <div key={label} className="track-result-row">
                      <span className="table-cell-muted track-result-label">
                        {label}
                      </span>
                      <span className="track-result-value">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
