"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CAROUSEL_SLIDES, TIKTOK_LINKS } from "./content";

const SHARE_OPTIONS = [
  { type: "copy", label: "Copy Link" },
  { type: "twitter", label: "X" },
  { type: "whatsapp", label: "WhatsApp" },
  { type: "facebook", label: "Facebook" },
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function sortGallery(items) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function toEmbedUrl(url) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = extractYouTubeId(url);
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  if (url.includes("tiktok.com")) {
    const match = url.match(/video\/(\d+)/);
    if (match) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  }
  return url;
}

function extractYouTubeId(url) {
  const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
  if (shortMatch) {
    return shortMatch[1];
  }
  const longMatch = url.match(/[?&]v=([^&]+)/);
  if (longMatch) {
    return longMatch[1];
  }
  const shortsMatch = url.match(/shorts\/([^?]+)/);
  if (shortsMatch) {
    return shortsMatch[1];
  }
  return null;
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

function normalizeQrImageUrl(url) {
  return normalizeImageUrl(url);
}

function getQrPreviewUrl(url) {
  const thumb = driveThumbnailUrl(url);
  return thumb || normalizeQrImageUrl(url);
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function truncateText(text, maxLength = 220) {
  const value = String(text || "").trim();
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength).trimEnd()}…`;
}

function downloadLetterPdf(letter) {
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) {
    window.alert("Popup blocked. Please allow popups to download the PDF.");
    return;
  }
  const safe = (value) =>
    String(value || "")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  win.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Letter from ${safe(letter.name)}</title>
        <style>
          body { font-family: 'Work Sans', sans-serif; padding: 30px; color: #223025; }
          h1 { font-family: 'Fraunces', serif; }
          .arabic { font-family: 'Noto Naskh Arabic', serif; direction: rtl; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Letter from ${safe(letter.name)}</h1>
        <p>${safe(letter.messageEn)}</p>
        ${letter.messageAr ? `<p class="arabic">${safe(letter.messageAr)}</p>` : ""}
        <p>With love, Deer Army.</p>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
}

function FormMessage({ message }) {
  if (!message) {
    return null;
  }
  return (
    <p
      className={`form-message ${message.type === "error" ? "is-error" : "is-success"}`}
    >
      {message.text}
    </p>
  );
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
  if (!focusableElements.length) {
    event.preventDefault();
    container.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function DisclosureCard({
  id,
  summary,
  renderContent,
  className = "",
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      id={id}
      className={["disclosure-card", className].filter(Boolean).join(" ")}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary>{summary}</summary>
      {isOpen ? <div className="disclosure-body">{renderContent()}</div> : null}
    </details>
  );
}

function VideoCarousel({ collection }) {
  const trackRef = useRef(null);

  const handleScroll = (direction) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const amount = track.clientWidth * 0.9;
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className="video-collection reveal">
      <div className="video-collection-header">
        <div>
          <h3>{collection.title}</h3>
          <p>{collection.description}</p>
        </div>
        <div
          className="carousel-controls"
          aria-label={`${collection.title} controls`}
        >
          <button
            className="carousel-arrow"
            type="button"
            onClick={() => handleScroll(-1)}
            aria-label="Scroll left"
          >
            &larr;
          </button>
          <button
            className="carousel-arrow"
            type="button"
            onClick={() => handleScroll(1)}
            aria-label="Scroll right"
          >
            &rarr;
          </button>
        </div>
      </div>
      <div className="video-track" ref={trackRef}>
        {collection.items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="card video-card">
            <h3>{item.title}</h3>
            <div className="timeline-video">
              <iframe
                src={item.url}
                title={item.title}
                loading="lazy"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              ></iframe>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function HomeClient({
  letters = [],
  gallery = { photos: [], videos: [], art: [] },
  updates = [],
  gifts = [],
  announcements = [],
  about = null,
  videoCollections = [],
  paymentQrs = [],
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState("photos");
  const [lightbox, setLightbox] = useState({
    open: false,
    src: "",
    caption: "",
  });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [letterMessage, setLetterMessage] = useState(null);
  const [galleryMessage, setGalleryMessage] = useState(null);
  const [contactMessage, setContactMessage] = useState(null);
  const [joinMessage, setJoinMessage] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState(null);
  const [activeQrId, setActiveQrId] = useState(paymentQrs[0]?.id || "");
  const [qrModal, setQrModal] = useState({ open: false, qr: null });
  const [copyLabel, setCopyLabel] = useState("Copy Link");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const qrModalRef = useRef(null);
  const lightboxRef = useRef(null);
  const lastFocusedElementRef = useRef(null);

  const galleryLists = useMemo(
    () => ({
      photos: sortGallery(gallery.photos),
      videos: sortGallery(gallery.videos),
      art: sortGallery(gallery.art),
    }),
    [gallery],
  );

  useEffect(() => {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) {
      return;
    }
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!qrModal.open) {
      return undefined;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [qrModal.open]);

  useEffect(() => {
    if (!qrModal.open) {
      return undefined;
    }
    const handleKey = (event) => {
      if (event.key === "Escape") {
        closeQrModal();
        return;
      }

      trapFocus(event, qrModalRef.current);
    };

    const focusTarget =
      getFocusableElements(qrModalRef.current)[0] || qrModalRef.current;
    focusTarget?.focus();

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [qrModal.open]);

  useEffect(() => {
    if (!("matchMedia" in window)) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", syncPreference);
      return () => mediaQuery.removeEventListener("change", syncPreference);
    }

    mediaQuery.addListener(syncPreference);
    return () => mediaQuery.removeListener(syncPreference);
  }, []);

  useEffect(() => {
    if (
      prefersReducedMotion ||
      isCarouselPaused ||
      CAROUSEL_SLIDES.length <= 1
    ) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [prefersReducedMotion, isCarouselPaused]);

  useEffect(() => {
    if (!moreMenuOpen) {
      return undefined;
    }

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!lightbox.open) {
      return undefined;
    }

    const handleKey = (event) => {
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }

      trapFocus(event, lightboxRef.current);
    };

    const focusTarget =
      getFocusableElements(lightboxRef.current)[0] || lightboxRef.current;
    focusTarget?.focus();

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox.open]);

  useEffect(() => {
    if (!paymentQrs.length) {
      setActiveQrId("");
      return;
    }
    if (!activeQrId || !paymentQrs.some((qr) => qr.id === activeQrId)) {
      setActiveQrId(paymentQrs[0].id);
    }
  }, [paymentQrs, activeQrId]);

  const handleShare = async (type) => {
    const url = window.location.href;
    const text = "Share the Deer Army love for Tommy & Ghazel.";

    if (type === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        setCopyLabel("Copied!");
        setTimeout(() => setCopyLabel("Copy Link"), 1500);
      } catch (error) {
        window.alert("Copy failed. Please copy the URL manually.");
      }
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "Deer Army", text, url });
        return;
      } catch (error) {
        return;
      }
    }

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };

    if (shareUrls[type]) {
      window.open(shareUrls[type], "_blank", "noopener");
    }
  };

  const handleLetterSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      messageEn: String(formData.get("messageEn") || "").trim(),
      messageAr: String(formData.get("messageAr") || "").trim(),
      tiktok: String(formData.get("tiktok") || "").trim(),
    };

    if (!payload.name || !payload.messageEn) {
      setLetterMessage({
        type: "error",
        text: "Please include your name and an English message.",
      });
      return;
    }

    try {
      const response = await fetch("/api/submissions/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setLetterMessage({
          type: "error",
          text: data?.error || "Submission failed.",
        });
        return;
      }
      form.reset();
      setLetterMessage({
        type: "success",
        text: "Letter received! It will appear after approval.",
      });
    } catch (error) {
      setLetterMessage({
        type: "error",
        text: "Submission failed. Please try again.",
      });
    }
  };

  const handleGallerySubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const category = String(formData.get("category") || "");
    const contributor = String(formData.get("contributor") || "").trim();
    const caption = String(formData.get("caption") || "").trim();
    const videoUrl = String(formData.get("videoUrl") || "").trim();
    const file = formData.get("file");

    if (!contributor || !caption) {
      setGalleryMessage({
        type: "error",
        text: "Please add your name and a caption.",
      });
      return;
    }

    try {
      if (category === "videos") {
        if (!videoUrl) {
          setGalleryMessage({ type: "error", text: "Please add a video URL." });
          return;
        }
        const embed = toEmbedUrl(videoUrl);
        const response = await fetch("/api/submissions/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: contributor, caption, category, embed }),
        });
        const data = await response.json();
        if (!response.ok) {
          setGalleryMessage({
            type: "error",
            text: data?.error || "Submission failed.",
          });
          return;
        }
        form.reset();
        setGalleryMessage({
          type: "success",
          text: "Video received! It will appear after approval.",
        });
        return;
      }

      if (!(file instanceof File) || file.size === 0) {
        setGalleryMessage({
          type: "error",
          text: "Please upload an image file.",
        });
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setGalleryMessage({
          type: "error",
          text: "Image is too large. Please upload a file under 2MB.",
        });
        return;
      }

      const imageData = await readFileAsDataUrl(file);
      const response = await fetch("/api/submissions/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contributor,
          caption,
          category,
          imageData,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGalleryMessage({
          type: "error",
          text: data?.error || "Submission failed.",
        });
        return;
      }
      form.reset();
      setGalleryMessage({
        type: "success",
        text: "Upload received! It will appear after approval.",
      });
    } catch (error) {
      setGalleryMessage({
        type: "error",
        text: "Submission failed. Please try again.",
      });
    }
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      type: String(formData.get("type") || ""),
      message: String(formData.get("message") || "").trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setContactMessage({
        type: "error",
        text: "Please fill out all required fields.",
      });
      return;
    }

    try {
      const response = await fetch("/api/submissions/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setContactMessage({
          type: "error",
          text: data?.error || "Submission failed.",
        });
        return;
      }
      form.reset();
      setContactMessage({
        type: "success",
        text: "Submission received! We'll review it soon.",
      });
    } catch (error) {
      setContactMessage({
        type: "error",
        text: "Submission failed. Please try again.",
      });
    }
  };

  const handleJoinSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    if (!payload.name || !payload.email) {
      setJoinMessage({
        type: "error",
        text: "Please add your name and email to join.",
      });
      return;
    }

    try {
      const response = await fetch("/api/submissions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setJoinMessage({
          type: "error",
          text: data?.error || "Submission failed.",
        });
        return;
      }
      form.reset();
      setJoinMessage({
        type: "success",
        text: "Thanks for joining! We will review your request soon.",
      });
    } catch (error) {
      setJoinMessage({
        type: "error",
        text: "Submission failed. Please try again.",
      });
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      senderName: String(formData.get("senderName") || "").trim(),
      referenceNumber: String(formData.get("referenceNumber") || "").trim(),
      qrCodeId: String(formData.get("qrCodeId") || "").trim(),
    };

    if (!payload.senderName || !payload.referenceNumber) {
      setPaymentMessage({
        type: "error",
        text: "Please add your name and the payment reference number.",
      });
      return;
    }

    try {
      const response = await fetch("/api/submissions/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setPaymentMessage({
          type: "error",
          text: data?.error || "Submission failed.",
        });
        return;
      }
      form.reset();
      setPaymentMessage({
        type: "success",
        text: "Reference received! Thank you for your support.",
      });
    } catch (error) {
      setPaymentMessage({
        type: "error",
        text: "Submission failed. Please try again.",
      });
    }
  };

  const activeQr =
    paymentQrs.find((qr) => qr.id === activeQrId) || paymentQrs[0] || null;
  const activeQrImage = activeQr?.imageUrl
    ? getQrPreviewUrl(activeQr.imageUrl)
    : "";
  const headerQrImage = activeQrImage || "/assets/deer-mark.svg";
  const headerQrAlt = activeQrImage ? "Support QR" : "Support icon";
  const headerQrFallback = activeQr?.imageUrl
    ? normalizeQrImageUrl(activeQr.imageUrl)
    : "";

  const restoreLastFocus = () => {
    const previousFocus = lastFocusedElementRef.current;
    if (previousFocus && typeof previousFocus.focus === "function") {
      requestAnimationFrame(() => {
        previousFocus.focus();
      });
    }
    lastFocusedElementRef.current = null;
  };

  const closeQrModal = () => {
    setQrModal({ open: false, qr: null });
    restoreLastFocus();
  };

  const openQrModal = (qr) => {
    if (!qr) {
      return;
    }
    lastFocusedElementRef.current = document.activeElement;
    setActiveQrId(qr.id);
    setQrModal({ open: true, qr });
  };

  const handleLightboxOpen = (src, caption) => {
    lastFocusedElementRef.current = document.activeElement;
    setLightbox({ open: true, src, caption });
  };

  const closeLightbox = () => {
    setLightbox({ open: false, src: "", caption: "" });
    restoreLastFocus();
  };

  const featuredUpdates = updates.slice(0, 3);
  const featuredLetters = letters.slice(0, 3);
  const featuredAnnouncements = announcements.slice(0, 3);
  const featuredGifts = gifts.slice(0, 2);
  const featuredVideoCollections = videoCollections.slice(0, 2);
  const featuredQrCards = paymentQrs.slice(0, 2);
  const previewGalleryLists = {
    photos: galleryLists.photos.slice(0, 4),
    videos: galleryLists.videos.slice(0, 3),
    art: galleryLists.art.slice(0, 4),
  };
  const activeGalleryPreview = previewGalleryLists[activeGalleryTab];
  const activeGalleryFull = galleryLists[activeGalleryTab];
  const contributorCount = new Set(
    [
      ...galleryLists.photos,
      ...galleryLists.videos,
      ...galleryLists.art,
    ].map((item) => item.name),
  ).size;
  const mediaItemCount =
    galleryLists.photos.length +
    galleryLists.videos.length +
    galleryLists.art.length;
  const videoItemCount = videoCollections.reduce(
    (total, collection) => total + collection.items.length,
    0,
  );
  const latestUpdate = featuredUpdates[0] || null;
  const latestAnnouncement = featuredAnnouncements[0] || null;
  const storyPreview = about?.story
    ? truncateText(about.story, 260)
    : "Deer Army is a fan-led home for thoughtful support, shared memories, and community-led surprises.";
  const missionPreview = about?.mission
    ? truncateText(about.mission, 180)
    : "We keep the fandom welcoming, organized, and full of genuine care for Tommy & Ghazel.";
  const aboutGuidelines = about?.guidelines?.slice(0, 3) || [];

  return (
    <>
      <div className="bg-texture" aria-hidden="true" />
      <header className="site-header landing-header">
        <a className="skip-link" href="#home">
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
          <a href="#home">Home</a>
          <a href="#updates">Updates</a>
          <a href="#letters">Letters</a>
          <a href="#gallery">Gallery</a>
          <a href="#explore">Explore</a>
          <a href="/shop">Shop</a>
          <a href="#support">Support</a>
          <details
            className="nav-dropdown"
            open={moreMenuOpen}
            onToggle={(event) => setMoreMenuOpen(event.currentTarget.open)}
          >
            <summary
              className="nav-dropdown-toggle"
              aria-controls="landing-more-nav"
            >
              More
            </summary>
            <div className="nav-dropdown-menu" id="landing-more-nav">
              <a href="#videos" onClick={() => setMoreMenuOpen(false)}>
                Storybook
              </a>
              <a href="#join" onClick={() => setMoreMenuOpen(false)}>
                Join
              </a>
              <a href="#announcements" onClick={() => setMoreMenuOpen(false)}>
                Announcements
              </a>
              <a href="#about" onClick={() => setMoreMenuOpen(false)}>
                About Us
              </a>
              <a href="#contact" onClick={() => setMoreMenuOpen(false)}>
                Contact
              </a>
              <a href="/birthday" onClick={() => setMoreMenuOpen(false)}>
                Birthday
              </a>
              <a href="/login" onClick={() => setMoreMenuOpen(false)}>
                Login
              </a>
            </div>
          </details>
        </nav>

        <div className="nav-actions">
          <a className="header-qr" href="#support" aria-label="Support QR code">
            <img
              src={headerQrImage}
              alt={headerQrAlt}
              onError={(event) => applyImageFallback(event, headerQrFallback)}
            />
            <span>Support</span>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <aside
        id="landing-mobile-menu"
        className={`mobile-menu ${mobileMenuOpen ? "is-open" : ""}`}
        aria-label="Mobile"
      >
        <a href="#home" onClick={() => setMobileMenuOpen(false)}>
          Home
        </a>
        <a href="#updates" onClick={() => setMobileMenuOpen(false)}>
          Updates
        </a>
        <a href="#letters" onClick={() => setMobileMenuOpen(false)}>
          Letters
        </a>
        <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>
          Gallery
        </a>
        <a href="#explore" onClick={() => setMobileMenuOpen(false)}>
          Explore
        </a>
        <a href="/shop" onClick={() => setMobileMenuOpen(false)}>
          Shop
        </a>
        <a href="#support" onClick={() => setMobileMenuOpen(false)}>
          Support
        </a>
        <details className="mobile-dropdown">
          <summary>More</summary>
          <div className="mobile-dropdown-links">
            <a href="#videos" onClick={() => setMobileMenuOpen(false)}>
              Storybook
            </a>
            <a href="#join" onClick={() => setMobileMenuOpen(false)}>
              Join
            </a>
            <a href="#announcements" onClick={() => setMobileMenuOpen(false)}>
              Announcements
            </a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>
              About Us
            </a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </a>
            <a href="/birthday" onClick={() => setMobileMenuOpen(false)}>
              Birthday
            </a>
            <a href="/login" onClick={() => setMobileMenuOpen(false)}>
              Login
            </a>
          </div>
        </details>
        {activeQrImage ? (
          <div className="mobile-qr-card">
            <p className="mobile-qr-title">
              {activeQr.title || "Support the Deer Army"}
            </p>
            <img src={activeQrImage} alt="Support QR code" />
            <a href="#support" onClick={() => setMobileMenuOpen(false)}>
              Go to Support
            </a>
          </div>
        ) : null}
      </aside>

      <main className="landing-shell">
        <section className="hero landing-hero" id="home">
          <div className="hero-copy landing-hero-copy reveal">
            <p className="eyebrow">Tommy &amp; Ghazel • Deer Army</p>
            <h1>A calmer, brighter front door for everyone who keeps showing up.</h1>
            <p className="lead">
              Deer Army is where updates, fan letters, gallery moments, and
              support projects stay organized in one warm community home.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#updates">
                Explore the community
              </a>
              <a className="ghost-button" href="#letters">
                Read fan letters
              </a>
              <a className="secondary-button" href="/shop">
                Visit the shop
              </a>
            </div>
            <div className="landing-signal-grid">
              <article className="landing-signal-card">
                <span className="signal-label">Approved letters</span>
                <strong>{letters.length}</strong>
                <p>Love notes already hanging on the Deer Army wall.</p>
              </article>
              <article className="landing-signal-card">
                <span className="signal-label">Community contributors</span>
                <strong>{contributorCount}</strong>
                <p>Fans who have already shared photos, edits, and art.</p>
              </article>
              <article className="landing-signal-card">
                <span className="signal-label">Storybook moments</span>
                <strong>{gifts.length + videoItemCount}</strong>
                <p>Gift highlights and clips ready for a quick catch-up.</p>
              </article>
            </div>
          </div>
          <div className="hero-media landing-hero-media reveal">
            <div className="carousel">
              <button
                className="carousel-control prev"
                type="button"
                aria-label="Previous slide"
                onClick={() =>
                  setCarouselIndex(
                    (prev) =>
                      (prev - 1 + CAROUSEL_SLIDES.length) %
                      CAROUSEL_SLIDES.length,
                  )
                }
              >
                <span>&larr;</span>
              </button>
              <div
                className="carousel-track"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {CAROUSEL_SLIDES.map((slide, index) => (
                  <figure
                    key={slide.src}
                    className={`carousel-slide ${index === carouselIndex ? "is-active" : ""}`}
                  >
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : undefined}
                      className="lightbox-trigger"
                      onClick={() =>
                        handleLightboxOpen(slide.src, slide.caption)
                      }
                    />
                    <figcaption>{slide.caption}</figcaption>
                  </figure>
                ))}
              </div>
              <button
                className="carousel-control next"
                type="button"
                aria-label="Next slide"
                onClick={() =>
                  setCarouselIndex(
                    (prev) => (prev + 1) % CAROUSEL_SLIDES.length,
                  )
                }
              >
                <span>&rarr;</span>
              </button>
              <div className="carousel-footer">
                {prefersReducedMotion ? (
                  <p className="carousel-note">
                    Autoplay is off because your device prefers reduced motion.
                  </p>
                ) : (
                  <button
                    className="light-button carousel-toggle"
                    type="button"
                    aria-pressed={isCarouselPaused}
                    onClick={() => setIsCarouselPaused((paused) => !paused)}
                  >
                    {isCarouselPaused ? "Resume autoplay" : "Pause autoplay"}
                  </button>
                )}
              </div>
            </div>
            <div className="landing-hero-sidecar">
              <article className="landing-highlight-card">
                <p className="section-kicker">Community pulse</p>
                {latestUpdate ? (
                  <>
                    <span className="badge">{formatDate(latestUpdate.date)}</span>
                    <h3>{latestUpdate.title}</h3>
                    <p>{truncateText(latestUpdate.text, 140)}</p>
                  </>
                ) : (
                  <>
                    <h3>Fresh stories will land here soon.</h3>
                    <p>
                      The homepage is ready for the next Deer Army highlight,
                      celebration, or surprise project.
                    </p>
                  </>
                )}
                <ul className="landing-highlight-list">
                  <li>
                    <strong>{updates.length}</strong>
                    <span>curated updates and notes</span>
                  </li>
                  <li>
                    <strong>{mediaItemCount}</strong>
                    <span>gallery moments archived</span>
                  </li>
                  <li>
                    <strong>{paymentQrs.length}</strong>
                    <span>support channels available</span>
                  </li>
                </ul>
              </article>
              <div className="share-panel landing-share-panel">
                <p>Share the Deer Army home:</p>
                <div className="share-buttons">
                  {SHARE_OPTIONS.map((option) => (
                    <button
                      key={option.type}
                      className="share-button"
                      type="button"
                      onClick={() => handleShare(option.type)}
                    >
                      {option.type === "copy" ? copyLabel : option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section landing-section" id="updates">
          <div className="section-header reveal landing-section-header">
            <div>
              <p className="section-kicker">Fresh from the fandom</p>
              <h2>Start with what the community is doing now</h2>
              <p>
                Catch up on the latest notes, celebrations, and project updates
                before you dive deeper.
              </p>
            </div>
            <a className="ghost-button" href="#announcements">
              Open the community board
            </a>
          </div>
          {featuredUpdates.length === 0 ? (
            <div className="landing-empty-card">
              <h3>New community updates are on the way.</h3>
              <p>
                When the next Deer Army project, celebration, or thank-you note
                goes live, it will show up here first.
              </p>
            </div>
          ) : (
            <div className="landing-updates-layout">
              <article className="landing-update-spotlight">
                <span className="badge">{formatDate(featuredUpdates[0].date)}</span>
                <h3>{featuredUpdates[0].title}</h3>
                <p>{featuredUpdates[0].text}</p>
              </article>
              <div className="landing-update-list">
                {featuredUpdates.slice(1).map((update, index) => (
                  <article
                    key={`${update.title}-${index}`}
                    className="landing-update-card"
                  >
                    <span className="badge">{formatDate(update.date)}</span>
                    <h3>{update.title}</h3>
                    <p>{truncateText(update.text, 140)}</p>
                  </article>
                ))}
                {latestAnnouncement ? (
                  <article className="landing-update-card landing-note-card">
                    <p className="section-kicker">Board note</p>
                    <h3>{latestAnnouncement.title}</h3>
                    <p>{truncateText(latestAnnouncement.text, 140)}</p>
                  </article>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="section landing-section" id="letters">
          <div className="section-header reveal landing-section-header">
            <div>
              <p className="section-kicker">Love notes</p>
              <h2>Fan letters stay at the emotional center of this home</h2>
              <p>
                A few featured messages live up front, while the full letter wall
                stays tucked behind a quieter reveal.
              </p>
            </div>
          </div>
          <div className="landing-two-column">
            <div className="letters-grid landing-preview-grid">
              {featuredLetters.length === 0 ? (
                <div className="landing-empty-card">
                  <h3>No approved letters yet.</h3>
                  <p>
                    The first fan letter will appear here once the Deer Army team
                    approves it.
                  </p>
                </div>
              ) : (
                featuredLetters.map((letter, index) => (
                  <article
                    key={`${letter.name}-${index}`}
                    className={`letter-card ${index === 0 ? "landing-featured-letter" : ""}`}
                  >
                    <p className="letter-name">{letter.name}</p>
                    <p className="letter-message">{letter.messageEn}</p>
                    {letter.messageAr ? (
                      <p className="letter-message arabic" lang="ar" dir="rtl">
                        {letter.messageAr}
                      </p>
                    ) : null}
                    <div className="letter-actions">
                      {letter.tiktok ? (
                        <a
                          className="letter-link"
                          href={letter.tiktok}
                          target="_blank"
                          rel="noopener"
                        >
                          TikTok
                        </a>
                      ) : null}
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => downloadLetterPdf(letter)}
                      >
                        Download PDF
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
            <aside className="landing-sidebar-card">
              <p className="section-kicker">Join the letter wall</p>
              <h3>Send a note that feels like home.</h3>
              <p>
                Letters are reviewed before they go live so the homepage stays
                thoughtful, safe, and easy to browse.
              </p>
              <DisclosureCard
                summary="Open the fan letter form"
                renderContent={() => (
                  <form onSubmit={handleLetterSubmit}>
                    <div className="form-row">
                      <label htmlFor="letter-name">
                        Fan Name
                        <input
                          id="letter-name"
                          type="text"
                          name="name"
                          placeholder="Your name"
                          required
                        />
                      </label>
                      <label htmlFor="letter-tiktok">
                        TikTok Link
                        <input
                          id="letter-tiktok"
                          type="url"
                          name="tiktok"
                          placeholder="https://www.tiktok.com/@yourhandle"
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label htmlFor="letter-message-en">
                        Message (English)
                        <textarea
                          id="letter-message-en"
                          name="messageEn"
                          rows="4"
                          placeholder="Write your letter in English"
                          required
                        ></textarea>
                      </label>
                      <label htmlFor="letter-message-ar">
                        Message (Arabic)
                        <textarea
                          id="letter-message-ar"
                          name="messageAr"
                          rows="4"
                          placeholder="اكتب رسالتك بالعربية"
                          className="arabic-input"
                        ></textarea>
                      </label>
                    </div>
                    <button className="primary-button" type="submit">
                      Send letter
                    </button>
                    <p className="form-note">
                      Approved letters are added to the homepage after review.
                    </p>
                    <FormMessage message={letterMessage} />
                  </form>
                )}
              />
              {letters.length > featuredLetters.length ? (
                <DisclosureCard
                  summary="Browse the full letter wall"
                  renderContent={() => (
                    <div className="letters-grid">
                      {letters.map((letter, index) => (
                        <article
                          key={`${letter.name}-full-${index}`}
                          className="letter-card"
                        >
                          <p className="letter-name">{letter.name}</p>
                          <p className="letter-message">{letter.messageEn}</p>
                          {letter.messageAr ? (
                            <p
                              className="letter-message arabic"
                              lang="ar"
                              dir="rtl"
                            >
                              {letter.messageAr}
                            </p>
                          ) : null}
                          <div className="letter-actions">
                            {letter.tiktok ? (
                              <a
                                className="letter-link"
                                href={letter.tiktok}
                                target="_blank"
                                rel="noopener"
                              >
                                TikTok
                              </a>
                            ) : null}
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => downloadLetterPdf(letter)}
                            >
                              Download PDF
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                />
              ) : null}
            </aside>
          </div>
        </section>

        <section className="section landing-section" id="gallery">
          <div className="section-header reveal landing-section-header">
            <div>
              <p className="section-kicker">Visual archive</p>
              <h2>Fan gallery previews stay playful without taking over the page</h2>
              <p>
                Browse the latest photos, edits, and art first, then expand the
                full collection only when you want it.
              </p>
            </div>
          </div>
          <div className="landing-gallery-layout">
            <div>
              <div className="gallery-controls">
                <button
                  className={`tab-button ${activeGalleryTab === "photos" ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setActiveGalleryTab("photos")}
                >
                  Photos
                </button>
                <button
                  className={`tab-button ${activeGalleryTab === "videos" ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setActiveGalleryTab("videos")}
                >
                  Video Edits
                </button>
                <button
                  className={`tab-button ${activeGalleryTab === "art" ? "is-active" : ""}`}
                  type="button"
                  onClick={() => setActiveGalleryTab("art")}
                >
                  Fan Art
                </button>
              </div>

              {activeGalleryPreview.length === 0 ? (
                <div className="landing-empty-card">
                  <h3>No gallery items yet.</h3>
                  <p>
                    This space will fill with community visuals after the first
                    approved uploads come in.
                  </p>
                </div>
              ) : (
                <div className="gallery-grid landing-gallery-preview-grid">
                  {activeGalleryTab === "videos"
                    ? activeGalleryPreview.map((item, index) => (
                        <article
                          key={`gallery-video-preview-${item.name}-${item.title}-${index}`}
                          className="gallery-card"
                        >
                          <iframe
                            src={item.embed}
                            title={item.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                          <div className="gallery-info">
                            <h4>{item.title}</h4>
                            <p>By {item.name}</p>
                          </div>
                        </article>
                      ))
                    : activeGalleryPreview.map((item, index) => (
                        <article
                          key={`gallery-preview-${item.name}-${item.caption}-${index}`}
                          className="gallery-card"
                        >
                          <img
                            src={normalizeImageUrl(item.src)}
                            alt={item.caption}
                            loading="lazy"
                            className="lightbox-trigger"
                            onClick={() =>
                              handleLightboxOpen(
                                normalizeImageUrl(item.src),
                                item.caption,
                              )
                            }
                          />
                          <div className="gallery-info">
                            <h4>{item.caption}</h4>
                            <p>By {item.name}</p>
                          </div>
                        </article>
                      ))}
                </div>
              )}

              {activeGalleryFull.length > activeGalleryPreview.length ? (
                <DisclosureCard
                  summary={`Open the full ${
                    activeGalleryTab === "photos"
                      ? "photo"
                      : activeGalleryTab === "videos"
                        ? "video edit"
                        : "fan art"
                  } gallery`}
                  renderContent={() => (
                    <div className="gallery-grid">
                      {activeGalleryTab === "videos"
                        ? activeGalleryFull.map((item, index) => (
                            <article
                              key={`gallery-video-full-${item.name}-${item.title}-${index}`}
                              className="gallery-card"
                            >
                              <iframe
                                src={item.embed}
                                title={item.title}
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                              <div className="gallery-info">
                                <h4>{item.title}</h4>
                                <p>By {item.name}</p>
                              </div>
                            </article>
                          ))
                        : activeGalleryFull.map((item, index) => (
                            <article
                              key={`gallery-full-${item.name}-${item.caption}-${index}`}
                              className="gallery-card"
                            >
                              <img
                                src={normalizeImageUrl(item.src)}
                                alt={item.caption}
                                loading="lazy"
                                className="lightbox-trigger"
                                onClick={() =>
                                  handleLightboxOpen(
                                    normalizeImageUrl(item.src),
                                    item.caption,
                                  )
                                }
                              />
                              <div className="gallery-info">
                                <h4>{item.caption}</h4>
                                <p>By {item.name}</p>
                              </div>
                            </article>
                          ))}
                    </div>
                  )}
                />
              ) : null}
            </div>

            <aside className="landing-sidebar-card landing-gallery-side">
              <p className="section-kicker">Community archive</p>
              <h3>Every approved upload becomes part of the Deer Army storybook.</h3>
              <div className="landing-count-grid">
                <article className="landing-count-card">
                  <span>Photos</span>
                  <strong>{galleryLists.photos.length}</strong>
                </article>
                <article className="landing-count-card">
                  <span>Video edits</span>
                  <strong>{galleryLists.videos.length}</strong>
                </article>
                <article className="landing-count-card">
                  <span>Fan art</span>
                  <strong>{galleryLists.art.length}</strong>
                </article>
              </div>
              <DisclosureCard
                summary="Share to the gallery"
                renderContent={() => (
                  <form onSubmit={handleGallerySubmit}>
                    <div className="form-row">
                      <label htmlFor="gallery-contributor">
                        Contributor Name
                        <input
                          id="gallery-contributor"
                          type="text"
                          name="contributor"
                          placeholder="Your name"
                          required
                        />
                      </label>
                      <label htmlFor="gallery-category">
                        Category
                        <select
                          id="gallery-category"
                          name="category"
                          defaultValue="photos"
                          required
                        >
                          <option value="photos">Photo</option>
                          <option value="videos">Video Edit</option>
                          <option value="art">Fan Art</option>
                        </select>
                      </label>
                    </div>
                    <div className="form-row">
                      <label htmlFor="gallery-file">
                        Photo/Fan Art Upload
                        <input
                          id="gallery-file"
                          type="file"
                          name="file"
                          accept="image/*"
                        />
                      </label>
                      <label htmlFor="gallery-video">
                        Video URL (YouTube/TikTok)
                        <input
                          id="gallery-video"
                          type="url"
                          name="videoUrl"
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </label>
                    </div>
                    <label htmlFor="gallery-caption">
                      Caption
                      <input
                        id="gallery-caption"
                        type="text"
                        name="caption"
                        placeholder="Add a short caption"
                        required
                      />
                    </label>
                    <button className="primary-button" type="submit">
                      Add to gallery
                    </button>
                    <p className="form-note">
                      Submissions are reviewed before appearing on the homepage.
                    </p>
                    <FormMessage message={galleryMessage} />
                  </form>
                )}
              />
            </aside>
          </div>
        </section>

        <section className="section landing-section" id="explore">
          <div className="section-header reveal landing-section-header">
            <div>
              <p className="section-kicker">Choose your next stop</p>
              <h2>From here, the homepage hands you off to the deeper Deer Army spaces</h2>
              <p>
                Explore merch, revisit the storybook, support the next project,
                or catch up on how the community works behind the scenes.
              </p>
            </div>
          </div>
          <div className="landing-pathways-grid">
            <article className="pathway-card">
              <p className="pathway-kicker">Merch</p>
              <h3>Shop the latest community pieces</h3>
              <p>
                Printable stickers, tees, and future drops all live in the shop
                with its own browsing flow.
              </p>
              <div className="pathway-actions">
                <a className="primary-button" href="/shop">
                  Open shop
                </a>
              </div>
            </article>

            <article className="pathway-card">
              <p className="pathway-kicker">Videos &amp; moments</p>
              <h3>Catch the community storybook in motion</h3>
              {featuredVideoCollections.length ? (
                <ul className="pathway-list">
                  {featuredVideoCollections.map((collection) => (
                    <li key={collection.id || collection.title}>
                      <strong>{collection.title}</strong>
                      <span>{collection.items.length} clips archived</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  Behind-the-scenes edits and archived gift-day clips will appear
                  here as soon as the next batch is approved.
                </p>
              )}
              <div className="pathway-actions">
                <a className="ghost-button" href="#videos">
                  Go to the storybook
                </a>
              </div>
            </article>

            <article className="pathway-card" id="about">
              <p className="pathway-kicker">About Deer Army</p>
              <h3>How the fandom holds its shape</h3>
              <p>{storyPreview}</p>
              {aboutGuidelines.length ? (
                <ul className="pathway-list">
                  {aboutGuidelines.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>{missionPreview}</p>
              )}
            </article>

            <article className="pathway-card">
              <p className="pathway-kicker">Support</p>
              <h3>Back the next care project without losing the thread</h3>
              <p>
                The support hub keeps QR access, reference matching, and follow-up
                in one place.
              </p>
              {featuredQrCards[0] ? (
                <img
                  src={getQrPreviewUrl(featuredQrCards[0].imageUrl)}
                  alt="Featured Deer Army support QR"
                  className="pathway-thumb"
                  onError={(event) =>
                    applyImageFallback(
                      event,
                      normalizeQrImageUrl(featuredQrCards[0].imageUrl),
                    )
                  }
                />
              ) : null}
              <div className="pathway-actions">
                <a className="secondary-button" href="#support">
                  Open support hub
                </a>
                {featuredQrCards[0] ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => openQrModal(featuredQrCards[0])}
                  >
                    Preview QR
                  </button>
                ) : null}
              </div>
            </article>
          </div>
        </section>

        <section className="section landing-section landing-storybook" id="videos">
          <div className="section-header reveal landing-section-header">
            <div>
              <p className="section-kicker">Community storybook</p>
              <h2>Gift moments and video highlights live together here</h2>
              <p>
                This keeps the homepage emotional and visual without dropping you
                into a long unfiltered archive.
              </p>
            </div>
          </div>
          <div className="landing-story-grid">
            <div className="landing-story-panel">
              <div className="landing-story-heading">
                <div>
                  <p className="section-kicker" id="gifts">
                    Gift timeline
                  </p>
                  <h3>Care projects we keep remembering</h3>
                </div>
                <span className="badge">{gifts.length} moments</span>
              </div>
              {featuredGifts.length === 0 ? (
                <p className="empty-state">
                  Gift highlights will appear here after the next project is
                  added.
                </p>
              ) : (
                <div className="landing-gift-list">
                  {featuredGifts.map((gift, index) => (
                    <article
                      key={`${gift.title}-${index}`}
                      className="landing-gift-card"
                    >
                      {gift.image ? (
                        <img
                          src={normalizeImageUrl(gift.image)}
                          alt={gift.title}
                          loading="lazy"
                          className="lightbox-trigger"
                          onClick={() =>
                            handleLightboxOpen(
                              normalizeImageUrl(gift.image),
                              gift.title,
                            )
                          }
                        />
                      ) : null}
                      <div>
                        <span className="badge">{formatDate(gift.date)}</span>
                        <h4>{gift.title}</h4>
                        <p>{truncateText(gift.text, 120)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {gifts.length > featuredGifts.length ? (
                <DisclosureCard
                  summary="Open the full gifts timeline"
                  renderContent={() => (
                    <div className="timeline">
                      {gifts.map((gift, index) => (
                        <article
                          key={`${gift.title}-full-${index}`}
                          className="timeline-item"
                        >
                          <div className="timeline-media">
                            {gift.image ? (
                              <img
                                src={normalizeImageUrl(gift.image)}
                                alt={gift.title}
                                loading="lazy"
                                className="lightbox-trigger"
                                onClick={() =>
                                  handleLightboxOpen(
                                    normalizeImageUrl(gift.image),
                                    gift.title,
                                  )
                                }
                              />
                            ) : null}
                          </div>
                          <div className="timeline-content">
                            <span className="badge">{formatDate(gift.date)}</span>
                            <h3>{gift.title}</h3>
                            <p>{gift.text}</p>
                            {gift.video ? (
                              <div className="timeline-video">
                                <iframe
                                  src={gift.video}
                                  title={`${gift.title} video`}
                                  loading="lazy"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                />
              ) : null}
            </div>

            <div className="landing-story-panel">
              <div className="landing-story-heading">
                <div>
                  <p className="section-kicker">Video library</p>
                  <h3>Behind-the-scenes highlights that still feel current</h3>
                </div>
                <span className="badge">{videoItemCount} clips</span>
              </div>
              {featuredVideoCollections.length === 0 ? (
                <p className="empty-state">
                  Video collections will appear here after the next upload is
                  approved.
                </p>
              ) : (
                <div className="landing-collection-list">
                  {featuredVideoCollections.map((collection) => (
                    <article
                      key={collection.id || collection.title}
                      className="landing-video-collection"
                    >
                      <div className="landing-video-copy">
                        <h4>{collection.title}</h4>
                        {collection.description ? (
                          <p>{truncateText(collection.description, 110)}</p>
                        ) : null}
                      </div>
                      {collection.items[0] ? (
                        <div className="timeline-video">
                          <iframe
                            src={collection.items[0].url}
                            title={collection.items[0].title}
                            loading="lazy"
                            allow="autoplay; encrypted-media; fullscreen"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
              {videoCollections.length > featuredVideoCollections.length ? (
                <DisclosureCard
                  summary="Open the full video library"
                  renderContent={() =>
                    videoCollections.map((collection) => {
                      if (collection.layout === "CAROUSEL") {
                        return (
                          <VideoCarousel
                            key={collection.id || collection.title}
                            collection={collection}
                          />
                        );
                      }
                      return (
                        <div
                          key={collection.id || collection.title}
                          className="video-collection"
                        >
                          <h3>{collection.title}</h3>
                          {collection.description ? (
                            <p>{collection.description}</p>
                          ) : null}
                          <div className="card-grid">
                            {collection.items.map((item, index) => (
                              <article
                                key={`${item.title}-${index}`}
                                className="card"
                              >
                                <h3>{item.title}</h3>
                                <div className="timeline-video">
                                  <iframe
                                    src={item.url}
                                    title={item.title}
                                    loading="lazy"
                                    allow="autoplay; encrypted-media; fullscreen"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  }
                />
              ) : null}
            </div>
          </div>
        </section>

        <section className="section landing-section landing-community-hub" id="support">
          <div className="section-header reveal landing-section-header">
            <div>
              <p className="section-kicker">Support and participation</p>
              <h2>When someone wants to help, join, or submit something, the path stays clear</h2>
              <p>
                The homepage stays calm, but the practical actions are still here
                when the community needs them.
              </p>
            </div>
          </div>
          <div className="landing-community-grid">
            <div className="landing-community-main">
              <div className="support-grid landing-support-grid">
                <div className="qr-grid">
                  {paymentQrs.length === 0 ? (
                    <div className="contact-card qr-card">
                      <h3>Support the Deer Army</h3>
                      <p className="empty-state">
                        QR code is not available yet. Please check back soon.
                      </p>
                    </div>
                  ) : (
                    paymentQrs.map((qr) => (
                      <article
                        key={qr.id}
                        className={`contact-card qr-card ${qr.id === activeQrId ? "is-selected" : ""}`}
                      >
                        <h3>{qr.title || "Deer Army QR Code"}</h3>
                        {qr.note ? <p>{qr.note}</p> : null}
                        <img
                          src={getQrPreviewUrl(qr.imageUrl)}
                          alt="Deer Army payment QR code"
                          className="qr-image"
                          onError={(event) =>
                            applyImageFallback(
                              event,
                              normalizeQrImageUrl(qr.imageUrl),
                            )
                          }
                        />
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => openQrModal(qr)}
                        >
                          Use this QR
                        </button>
                      </article>
                    ))
                  )}
                </div>
                <div className="form-card">
                  <h3>Share Your Payment Reference</h3>
                  <form onSubmit={handlePaymentSubmit}>
                    {paymentQrs.length > 1 ? (
                      <label htmlFor="payment-qr-select">
                        Select QR
                        <select
                          id="payment-qr-select"
                          name="qrCodeId"
                          value={activeQrId}
                          onChange={(event) => setActiveQrId(event.target.value)}
                          required
                        >
                          {paymentQrs.map((qr) => (
                            <option key={qr.id} value={qr.id}>
                              {qr.title || "Deer Army QR Code"}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <input type="hidden" name="qrCodeId" value={activeQrId} />
                    )}
                    <div className="form-row">
                      <label htmlFor="payment-sender">
                        Sender Name
                        <input
                          id="payment-sender"
                          type="text"
                          name="senderName"
                          required
                        />
                      </label>
                      <label htmlFor="payment-reference">
                        Reference Number
                        <input
                          id="payment-reference"
                          type="text"
                          name="referenceNumber"
                          required
                        />
                      </label>
                    </div>
                    <button className="primary-button" type="submit">
                      Submit reference
                    </button>
                    <p className="form-note">
                      We use this to match your support with our records.
                    </p>
                    <FormMessage message={paymentMessage} />
                  </form>
                </div>
              </div>
            </div>

            <div className="landing-community-side">
              <article className="contact-card" id="announcements">
                <p className="section-kicker">Community board</p>
                <h3>Important dates and notes stay visible without taking over the page.</h3>
                {featuredAnnouncements.length === 0 ? (
                  <p className="empty-state">
                    Community board notes will appear here once the next
                    announcement is published.
                  </p>
                ) : (
                  <div className="landing-board-list">
                    {featuredAnnouncements.map((announcement, index) => (
                      <article
                        key={`${announcement.title}-${index}`}
                        className="landing-board-card"
                      >
                        <span className="badge">{formatDate(announcement.date)}</span>
                        <h4>{announcement.title}</h4>
                        <p>{truncateText(announcement.text, 120)}</p>
                      </article>
                    ))}
                  </div>
                )}
              </article>

              <DisclosureCard
                id="join"
                summary="Open the join request form"
                renderContent={() => (
                  <form onSubmit={handleJoinSubmit}>
                    <div className="form-row">
                      <label htmlFor="join-name">
                        Name
                        <input id="join-name" type="text" name="name" required />
                      </label>
                      <label htmlFor="join-email">
                        Email
                        <input id="join-email" type="email" name="email" required />
                      </label>
                    </div>
                    <label htmlFor="join-location">
                      Location (optional)
                      <input
                        id="join-location"
                        type="text"
                        name="location"
                        placeholder="City, Country"
                      />
                    </label>
                    <label htmlFor="join-message">
                      Message (optional)
                      <textarea
                        id="join-message"
                        name="message"
                        rows="3"
                      ></textarea>
                    </label>
                    <button className="primary-button" type="submit">
                      Submit join request
                    </button>
                    <p className="form-note">
                      Requests are reviewed before we add you to the community list.
                    </p>
                    <FormMessage message={joinMessage} />
                  </form>
                )}
              />

              <DisclosureCard
                id="contact"
                summary="Contact the Deer Army team"
                renderContent={() => (
                  <>
                    <form onSubmit={handleContactSubmit}>
                      <div className="form-row">
                        <label htmlFor="contact-name">
                          Name
                          <input id="contact-name" type="text" name="name" required />
                        </label>
                        <label htmlFor="contact-email">
                          Email
                          <input
                            id="contact-email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            required
                          />
                        </label>
                      </div>
                      <label htmlFor="contact-type">
                        Submission Type
                        <select id="contact-type" name="type" required>
                          <option value="letter">Letter</option>
                          <option value="photo">Photo</option>
                          <option value="video">Video</option>
                          <option value="announcement">Announcement</option>
                          <option value="other">Other</option>
                        </select>
                      </label>
                      <label htmlFor="contact-message">
                        Message
                        <textarea
                          id="contact-message"
                          name="message"
                          rows="4"
                          required
                        ></textarea>
                      </label>
                      <button className="primary-button" type="submit">
                        Send to Deer Army
                      </button>
                      <p className="form-note">
                        Submissions are saved for the team to review.
                      </p>
                      <FormMessage message={contactMessage} />
                    </form>
                    <div className="landing-contact-meta">
                      <h4>Find us on TikTok</h4>
                      <ul className="social-list">
                        {TIKTOK_LINKS.map((link) => (
                          <li key={link.url}>
                            <a href={link.url} target="_blank" rel="noopener">
                              {link.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <p>
                        Email for coordination:{" "}
                        <a href="mailto:deerarmy@communitymail.com">
                          deerarmy@communitymail.com
                        </a>
                      </p>
                    </div>
                  </>
                )}
              />
            </div>
          </div>
        </section>
      </main>

      {qrModal.open && qrModal.qr ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={closeQrModal}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-modal-title"
            ref={qrModalRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="qr-modal-title">
                {qrModal.qr.title || "Deer Army QR Code"}
              </h3>
              <button
                type="button"
                className="light-button modal-close"
                onClick={closeQrModal}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              <img
                src={normalizeQrImageUrl(qrModal.qr.imageUrl)}
                alt="Deer Army payment QR code"
                className="dashboard-image"
                onError={(event) =>
                  applyImageFallback(
                    event,
                    driveThumbnailUrl(qrModal.qr.imageUrl),
                  )
                }
              />
              {qrModal.qr.note ? <p>{qrModal.qr.note}</p> : null}
              <div className="action-row">
                <button
                  type="button"
                  className="primary-button"
                  onClick={closeQrModal}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="site-footer landing-footer">
        <div className="landing-footer-copy">
          <p>Deer Army is built to help the community explore, remember, and keep showing up.</p>
          <p>Website developed by Lavender.</p>
          <p className="arabic" lang="ar" dir="rtl">
            جيش الغزلان يحبكم دائمًا.
          </p>
        </div>
        <div className="landing-footer-links">
          <a href="#updates">Updates</a>
          <a href="#letters">Letters</a>
          <a href="#gallery">Gallery</a>
          <a href="/shop">Shop</a>
          <a href="#home">Back to top</a>
        </div>
      </footer>

      {lightbox.open ? (
        <div
          className="lightbox"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.caption || "Expanded image view"}
        >
          <div
            className="lightbox-content"
            ref={lightboxRef}
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="lightbox-close"
              type="button"
              aria-label="Close"
              onClick={closeLightbox}
            >
              &times;
            </button>
            <img src={lightbox.src} alt="Expanded view" />
            <p>{lightbox.caption}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
