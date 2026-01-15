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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function downloadLetterPdf(letter) {
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) {
    window.alert("Popup blocked. Please allow popups to download the PDF.");
    return;
  }
  const safe = (value) => String(value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
    <p className="form-message" style={{ color: message.type === "error" ? "#a33" : "#2a3d31" }}>
      {message.text}
    </p>
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
        <div className="carousel-controls" aria-label={`${collection.title} controls`}>
          <button className="carousel-arrow" type="button" onClick={() => handleScroll(-1)} aria-label="Scroll left">
            &larr;
          </button>
          <button className="carousel-arrow" type="button" onClick={() => handleScroll(1)} aria-label="Scroll right">
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
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState("photos");
  const [lightbox, setLightbox] = useState({ open: false, src: "", caption: "" });
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [letterMessage, setLetterMessage] = useState(null);
  const [galleryMessage, setGalleryMessage] = useState(null);
  const [contactMessage, setContactMessage] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copy Link");

  const galleryLists = useMemo(
    () => ({
      photos: sortGallery(gallery.photos),
      videos: sortGallery(gallery.videos),
      art: sortGallery(gallery.art),
    }),
    [gallery]
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
      { threshold: 0.2 }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

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
      setLetterMessage({ type: "error", text: "Please include your name and an English message." });
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
        setLetterMessage({ type: "error", text: data?.error || "Submission failed." });
        return;
      }
      form.reset();
      setLetterMessage({ type: "success", text: "Letter received! It will appear after approval." });
    } catch (error) {
      setLetterMessage({ type: "error", text: "Submission failed. Please try again." });
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
      setGalleryMessage({ type: "error", text: "Please add your name and a caption." });
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
          setGalleryMessage({ type: "error", text: data?.error || "Submission failed." });
          return;
        }
        form.reset();
        setGalleryMessage({ type: "success", text: "Video received! It will appear after approval." });
        return;
      }

      if (!(file instanceof File) || file.size === 0) {
        setGalleryMessage({ type: "error", text: "Please upload an image file." });
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
        body: JSON.stringify({ name: contributor, caption, category, imageData }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGalleryMessage({ type: "error", text: data?.error || "Submission failed." });
        return;
      }
      form.reset();
      setGalleryMessage({ type: "success", text: "Upload received! It will appear after approval." });
    } catch (error) {
      setGalleryMessage({ type: "error", text: "Submission failed. Please try again." });
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
      setContactMessage({ type: "error", text: "Please fill out all required fields." });
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
        setContactMessage({ type: "error", text: data?.error || "Submission failed." });
        return;
      }
      form.reset();
      setContactMessage({ type: "success", text: "Submission received! We'll review it soon." });
    } catch (error) {
      setContactMessage({ type: "error", text: "Submission failed. Please try again." });
    }
  };

  const handleLightboxOpen = (src, caption) => {
    setLightbox({ open: true, src, caption });
  };

  const handleLightboxClose = () => {
    setLightbox({ open: false, src: "", caption: "" });
  };

  return (
    <>
      <div className="bg-texture" aria-hidden="true" />
      <header className="site-header">
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
          <a href="#letters">Fan Letters</a>
          <a href="#gifts">Gifts &amp; Surprises</a>
          <a href="#videos">Videos</a>
          <a href="#gallery">Fan Gallery</a>
          <a href="#announcements">Announcements</a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
          <a href="/login">Login</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        <div className="nav-actions">
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
        <a href="#home" onClick={() => setMobileMenuOpen(false)}>
          Home
        </a>
        <a href="#updates" onClick={() => setMobileMenuOpen(false)}>
          Updates
        </a>
        <a href="#letters" onClick={() => setMobileMenuOpen(false)}>
          Fan Letters
        </a>
        <a href="#gifts" onClick={() => setMobileMenuOpen(false)}>
          Gifts &amp; Surprises
        </a>
        <a href="#videos" onClick={() => setMobileMenuOpen(false)}>
          Videos
        </a>
        <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>
          Fan Gallery
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
        <a href="/login" onClick={() => setMobileMenuOpen(false)}>
          Login
        </a>
        <a href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
          Dashboard
        </a>
      </aside>

      <main>
        <section className="hero" id="home">
          <div className="hero-copy reveal">
            <p className="eyebrow">Welcome, Tommy &amp; Ghazel</p>
            <h1>A warm digital home for the Deer Army community 🦌</h1>
            <p className="lead">
              This is our shared space to celebrate your kindness, talent, and laughter. Together we keep the
              Deer Army glowing with love, hope, and unity.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#letters">
                Read Fan Letters
              </a>
              <a className="secondary-button" href="#gallery">
                Explore Gallery
              </a>
              <a className="ghost-button" href="#contact">
                Submit Love
              </a>
            </div>
            <div className="hero-meta">
              <div className="meta-card">
                <h3>Deer Army Heartbeat</h3>
                <p>Soft greens, warm hearts, and a community that always shows up.</p>
              </div>
              <div className="meta-card">
                <h3>Latest Love Notes</h3>
                <p>Fresh updates and announcements curated by the community team.</p>
              </div>
            </div>
          </div>
          <div className="hero-media reveal">
            <div className="carousel">
              <button
                className="carousel-control prev"
                type="button"
                aria-label="Previous slide"
                onClick={() =>
                  setCarouselIndex((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length)
                }
              >
                <span>&larr;</span>
              </button>
              <div className="carousel-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                {CAROUSEL_SLIDES.map((slide, index) => (
                  <figure
                    key={slide.src}
                    className={`carousel-slide ${index === carouselIndex ? "is-active" : ""}`}
                  >
                    <img src={slide.src} alt={slide.alt} loading="lazy" />
                    <figcaption>{slide.caption}</figcaption>
                  </figure>
                ))}
              </div>
              <button
                className="carousel-control next"
                type="button"
                aria-label="Next slide"
                onClick={() => setCarouselIndex((prev) => (prev + 1) % CAROUSEL_SLIDES.length)}
              >
                <span>&rarr;</span>
              </button>
            </div>
            <div className="share-panel">
              <p>Share the Deer Army love:</p>
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
        </section>

        <section className="section" id="updates">
          <div className="section-header reveal">
            <div>
              <h2>Latest Updates &amp; Announcements</h2>
              <p>Fresh moments, new projects, and community notes.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>
          <div className="card-grid">
            {updates.length === 0 ? <p className="empty-state">No updates yet.</p> : null}
            {updates.map((update, index) => (
              <article key={`${update.title}-${index}`} className="card">
                <span className="badge">{formatDate(update.date)}</span>
                <h3>{update.title}</h3>
                <p>{update.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="letters">
          <div className="section-header reveal">
            <div>
              <h2>Fan Letters</h2>
              <p>Every message is a hug for Tommy &amp; Ghazel. Read in English and Arabic.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>

          <div className="letters-grid">
            {letters.map((letter, index) => (
              <article key={`${letter.name}-${index}`} className="letter-card">
                <p className="letter-name">{letter.name}</p>
                <p className="letter-message">{letter.messageEn}</p>
                {letter.messageAr ? (
                  <p className="letter-message arabic" lang="ar" dir="rtl">
                    {letter.messageAr}
                  </p>
                ) : null}
                <div className="letter-actions">
                  {letter.tiktok ? (
                    <a className="letter-link" href={letter.tiktok} target="_blank" rel="noopener">
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

          <div className="form-card reveal">
            <h3>Submit a New Letter</h3>
            <form onSubmit={handleLetterSubmit}>
              <div className="form-row">
                <label htmlFor="letter-name">
                  Fan Name
                  <input id="letter-name" type="text" name="name" placeholder="Your name" required />
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
                Send Letter
              </button>
              <p className="form-note">Letters are reviewed before appearing on the homepage.</p>
              <FormMessage message={letterMessage} />
            </form>
          </div>
        </section>

        <section className="section" id="gifts">
          <div className="section-header reveal">
            <div>
              <h2>Gifts &amp; Surprises Timeline</h2>
              <p>From flowers to groceries, every surprise tells a story of love.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>

          <div className="timeline">
            {gifts.map((gift, index) => (
              <article key={`${gift.title}-${index}`} className="timeline-item">
                <div className="timeline-media">
                  {gift.image ? (
                    <img
                      src={gift.image}
                      alt={gift.title}
                      loading="lazy"
                      className="lightbox-trigger"
                      onClick={() => handleLightboxOpen(gift.image, gift.title)}
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
        </section>

        <section className="section" id="videos">
          <div className="section-header reveal">
            <div>
              <h2>Deer Army Video Library</h2>
              <p>Behind-the-scenes moments and community highlights, ready to watch.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>
          {videoCollections.length === 0 ? <p className="empty-state">No videos yet.</p> : null}
          {videoCollections.map((collection) => {
            if (collection.layout === "CAROUSEL") {
              return <VideoCarousel key={collection.id || collection.title} collection={collection} />;
            }
            return (
              <div key={collection.id || collection.title} className="video-collection reveal">
                <h3>{collection.title}</h3>
                {collection.description ? <p>{collection.description}</p> : null}
                <div className="card-grid">
                  {collection.items.map((item, index) => (
                    <article key={`${item.title}-${index}`} className="card">
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
          })}
        </section>

        <section className="section" id="gallery">
          <div className="section-header reveal">
            <div>
              <h2>Fan Gallery</h2>
              <p>Photos, edits, and fan art organized by contributor name.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>

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

          {activeGalleryTab === "photos" ? (
            <div className="gallery-panel">
              {galleryLists.photos.length === 0 ? <p className="empty-state">No photos yet.</p> : null}
              <div className="gallery-grid">
                {galleryLists.photos.map((item, index) => (
                  <article key={`photo-${item.name}-${item.caption}-${index}`} className="gallery-card">
                    <img
                      src={item.src}
                      alt={item.caption}
                      loading="lazy"
                      className="lightbox-trigger"
                      onClick={() => handleLightboxOpen(item.src, item.caption)}
                    />
                    <div className="gallery-info">
                      <h4>{item.caption}</h4>
                      <p>By {item.name}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeGalleryTab === "videos" ? (
            <div className="gallery-panel">
              {galleryLists.videos.length === 0 ? <p className="empty-state">No video edits yet.</p> : null}
              <div className="gallery-grid">
                {galleryLists.videos.map((item, index) => (
                  <article key={`video-${item.name}-${item.title}-${index}`} className="gallery-card">
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
                ))}
              </div>
            </div>
          ) : null}

          {activeGalleryTab === "art" ? (
            <div className="gallery-panel">
              {galleryLists.art.length === 0 ? <p className="empty-state">No fan art yet.</p> : null}
              <div className="gallery-grid">
                {galleryLists.art.map((item, index) => (
                  <article key={`art-${item.name}-${item.caption}-${index}`} className="gallery-card">
                    <img
                      src={item.src}
                      alt={item.caption}
                      loading="lazy"
                      className="lightbox-trigger"
                      onClick={() => handleLightboxOpen(item.src, item.caption)}
                    />
                    <div className="gallery-info">
                      <h4>{item.caption}</h4>
                      <p>By {item.name}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="form-card reveal">
            <h3>Share Your Creativity</h3>
            <form onSubmit={handleGallerySubmit}>
              <div className="form-row">
                <label htmlFor="gallery-contributor">
                  Contributor Name
                  <input id="gallery-contributor" type="text" name="contributor" placeholder="Your name" required />
                </label>
                <label htmlFor="gallery-category">
                  Category
                  <select id="gallery-category" name="category" defaultValue="photos" required>
                    <option value="photos">Photo</option>
                    <option value="videos">Video Edit</option>
                    <option value="art">Fan Art</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label htmlFor="gallery-file">
                  Photo/Fan Art Upload
                  <input id="gallery-file" type="file" name="file" accept="image/*" />
                </label>
                <label htmlFor="gallery-video">
                  Video URL (YouTube/TikTok)
                  <input id="gallery-video" type="url" name="videoUrl" placeholder="https://www.youtube.com/watch?v=..." />
                </label>
              </div>
              <label htmlFor="gallery-caption">
                Caption
                <input id="gallery-caption" type="text" name="caption" placeholder="Add a short caption" required />
              </label>
              <button className="primary-button" type="submit">
                Add to Gallery
              </button>
              <p className="form-note">Submissions are reviewed before appearing on the homepage.</p>
              <FormMessage message={galleryMessage} />
            </form>
          </div>
        </section>

        <section className="section" id="announcements">
          <div className="section-header reveal">
            <div>
              <h2>Announcements Board</h2>
              <p>Important dates, community updates, and upcoming celebrations.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>
          <div className="card-grid">
            {announcements.length === 0 ? <p className="empty-state">No announcements yet.</p> : null}
            {announcements.map((announcement, index) => (
              <article key={`${announcement.title}-${index}`} className="card">
                <span className="badge">{formatDate(announcement.date)}</span>
                <h3>{announcement.title}</h3>
                <p>{announcement.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="about">
          <div className="section-header reveal">
            <div>
              <h2>About Deer Army</h2>
              <p>How this loving fandom formed and what we stand for.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>
          <div className="about-grid">
            <div className="about-card reveal">
              <h3>Our Story</h3>
              {about?.story ? <p>{about.story}</p> : <p className="empty-state">Add your story in the dashboard.</p>}
            </div>
            <div className="about-card reveal">
              <h3>Mission Statement</h3>
              {about?.mission ? (
                <p>{about.mission}</p>
              ) : (
                <p className="empty-state">Add the mission statement in the dashboard.</p>
              )}
            </div>
            <div className="about-card reveal">
              <h3>Community Guidelines</h3>
              {about?.guidelines?.length ? (
                <ul>
                  {about.guidelines.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="empty-state">Add community guidelines in the dashboard.</p>
              )}
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="section-header reveal">
            <div>
              <h2>Contact &amp; Submit</h2>
              <p>Share letters, photos, videos, or coordination notes with the Deer Army team.</p>
            </div>
            <img className="section-icon" src="/assets/deer-mark.svg" alt="Deer icon" />
          </div>
          <div className="contact-grid">
            <div className="form-card reveal">
              <h3>General Submission</h3>
              <form onSubmit={handleContactSubmit}>
                <div className="form-row">
                  <label htmlFor="contact-name">
                    Name
                    <input id="contact-name" type="text" name="name" required />
                  </label>
                  <label htmlFor="contact-email">
                    Email
                    <input id="contact-email" type="email" name="email" placeholder="you@example.com" required />
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
                  <textarea id="contact-message" name="message" rows="4" required></textarea>
                </label>
                <button className="primary-button" type="submit">
                  Send to Deer Army
                </button>
                <p className="form-note">Submissions are saved for the team to review.</p>
                <FormMessage message={contactMessage} />
              </form>
            </div>
            <div className="contact-card reveal">
              <h3>Find Us on TikTok</h3>
              <ul className="social-list">
                {TIKTOK_LINKS.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noopener">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="contact-note">
                <p>
                  Email for coordination:{" "}
                  <a href="mailto:deerarmy@communitymail.com">deerarmy@communitymail.com</a>
                </p>
                <p>We&apos;re here to help your surprise reach Tommy &amp; Ghazel with love.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <p>Made with love by the Deer Army community.</p>
          <p>Website developed by Lavender.</p>
          <p className="arabic" lang="ar" dir="rtl">
            جيش الغزلان يحبكم دائمًا.
          </p>
        </div>
        <div className="footer-actions">
          <a href="#home">Back to top</a>
        </div>
      </footer>

      {lightbox.open ? (
        <div className="lightbox" onClick={handleLightboxClose} role="dialog" aria-modal="true">
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button className="lightbox-close" type="button" aria-label="Close" onClick={handleLightboxClose}>
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
