const STORAGE_KEY = "deerArmyData-v1";
const SUBMISSION_KEY = "deerArmySubmissions-v1";

const DEFAULT_DATA = {
  updates: [
    {
      title: "January 13 Gift Day Recap",
      date: "2026-01-14",
      text: "Flowers, groceries, and letters were delivered with so much care. Thank you for making the day glow.",
    },
    {
      title: "New Fan Edit Challenge",
      date: "2026-01-25",
      text: "Share a 30-second edit celebrating a Tommy & Ghazel moment. Tag #DeerArmyEdits.",
    },
    {
      title: "Letter Drop Week",
      date: "2026-02-01",
      text: "We are collecting bilingual letters all week. Every note will be shared in the next community post.",
    },
  ],
  letters: [
    {
      name: "Amina (Lipgloss ni Ghazel)",
      messageEn: "Tommy & Ghazel, your kindness feels like a warm blanket. Thank you for being light in our days.",
      messageAr: "تومي وغزال، لطفكم مثل بطانية دافئة. شكراً لأنكم نور في أيامنا.",
      tiktok: "https://www.tiktok.com/@lipglossnighazel",
    },
    {
      name: "Kira (Kuko ni Ghazel)",
      messageEn: "Your laughter is healing. The Deer Army is proud to stand beside you, always.",
      messageAr: "ضحكاتكم شفاء. جيش الغزلان فخور أن يقف بجانبكم دائماً.",
      tiktok: "https://www.tiktok.com/@kuko.nighazel",
    },
    {
      name: "Hadi (Guard ni Ghazel)",
      messageEn: "We see how hard you work and we admire your heart. Please keep shining.",
      messageAr: "نرى كم تعملون بجد ونُعجب بقلوبكم. استمروا في التألق.",
      tiktok: "https://www.tiktok.com/@guard.nighazel",
    },
    {
      name: "Noor",
      messageEn: "Your streams feel like home. Thank you for making space for all of us.",
      messageAr: "بثوثكم تشبه البيت. شكراً لأنكم تفتحون لنا مساحة دافئة.",
      tiktok: "https://www.tiktok.com/@noor.deerarmy",
    },
    {
      name: "Mae",
      messageEn: "Every gift is a small thank you for the big love you give us.",
      messageAr: "كل هدية هي شكر صغير على الحب الكبير الذي تمنحوننا إياه.",
      tiktok: "https://www.tiktok.com/@maedeerarmy",
    },
    {
      name: "Samir",
      messageEn: "I hope the Deer Army makes you feel safe and supported. We are always here.",
      messageAr: "أتمنى أن يجعلكم جيش الغزلان تشعرون بالأمان والدعم. نحن هنا دائماً.",
      tiktok: "https://www.tiktok.com/@samirdeerarmy",
    },
    {
      name: "Riya",
      messageEn: "Your creativity inspires my own art. Thank you for the gentle motivation.",
      messageAr: "إبداعكم يلهم فني. شكراً على الدافع اللطيف.",
      tiktok: "https://www.tiktok.com/@riya.deerarmy",
    },
    {
      name: "Yousef",
      messageEn: "May the Deer Army always wrap you in peace and encouragement.",
      messageAr: "أتمنى أن يحيطكم جيش الغزلان دائماً بالسلام والتشجيع.",
      tiktok: "https://www.tiktok.com/@yousef.deerarmy",
    },
    {
      name: "Luna",
      messageEn: "You both make the world softer. Thank you for every smile you share.",
      messageAr: "أنتم تجعلون العالم ألطف. شكراً على كل ابتسامة تشاركونها.",
      tiktok: "https://www.tiktok.com/@luna.deerarmy",
    },
    {
      name: "Army Heart",
      messageEn: "We love you endlessly. Keep dreaming big and resting often.",
      messageAr: "نحبكم بلا نهاية. استمروا في الحلم الكبير وخذوا وقتاً للراحة.",
      tiktok: "https://www.tiktok.com/@deerarmy",
    },
  ],
  gifts: [
    {
      date: "2026-01-13",
      title: "Sunrise Flowers",
      text: "Bouquets wrapped in soft green ribbons, sent with handwritten notes of gratitude.",
      image: "assets/jan13-flowers.svg",
      video: "https://www.youtube.com/embed/ScMzIvxBSi4",
    },
    {
      date: "2026-01-13",
      title: "Groceries of Care",
      text: "Pantry staples and cozy snacks so Tommy & Ghazel can rest between busy schedules.",
      image: "assets/jan13-groceries.svg",
    },
    {
      date: "2026-01-13",
      title: "Letters Bundle",
      text: "A stack of bilingual letters, each one a reminder of how loved they are.",
      image: "assets/jan13-letters.svg",
    },
    {
      date: "2026-01-20",
      title: "Surprise Comfort Kit",
      text: "Warm blankets, tea, and calming notes delivered with the Deer Army seal.",
      image: "assets/gift-surprise.svg",
    },
  ],
  gallery: {
    photos: [
      {
        name: "Rina",
        caption: "Blue hour stream watch party.",
        src: "assets/fanphoto-1.svg",
      },
      {
        name: "Kai",
        caption: "Community meetup memory wall.",
        src: "assets/fanphoto-2.svg",
      },
      {
        name: "Mira",
        caption: "Handmade deer charms from fans.",
        src: "assets/fanphoto-3.svg",
      },
    ],
    videos: [
      {
        name: "Tala",
        title: "Golden hour edit for Tommy & Ghazel",
        embed: "https://www.youtube.com/embed/5qap5aO4i9A",
      },
      {
        name: "Jude",
        title: "January 13 recap edit",
        embed: "https://www.youtube.com/embed/Zi_XLOBDo_Y",
      },
    ],
    art: [
      {
        name: "Aya",
        caption: "Soft watercolor deer crest.",
        src: "assets/fanart-1.svg",
      },
      {
        name: "Nash",
        caption: "Tommy & Ghazel illustrated portrait.",
        src: "assets/fanart-2.svg",
      },
    ],
  },
  announcements: [
    {
      title: "PK Night Celebration",
      date: "2026-02-10",
      text: "Join the Deer Army for a cozy PK night with supportive comments and gifts.",
    },
    {
      title: "Community Letter Week",
      date: "2026-02-17",
      text: "Submit letters by Feb 15 so we can compile a bilingual bundle for the creators.",
    },
    {
      title: "Surprise Project: Hope Kit",
      date: "2026-03-02",
      text: "We are preparing a new support kit with music, snacks, and handwritten notes.",
    },
  ],
};

const state = {
  data: loadData(),
};

const updatesList = document.getElementById("updates-list");
const lettersGrid = document.getElementById("letters-grid");
const giftsTimeline = document.getElementById("gifts-timeline");
const announcementsGrid = document.getElementById("announcements-grid");
const galleryPhotos = document.getElementById("gallery-photos");
const galleryVideos = document.getElementById("gallery-videos");
const galleryArt = document.getElementById("gallery-art");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");

renderAll();
initCarousel();
initGalleryTabs();
initLightbox();
initReveal();
initMenu();
initShareButtons();

function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function renderAll() {
  renderUpdates();
  renderLetters();
  renderGifts();
  renderGallery();
  renderAnnouncements();
}

function renderUpdates() {
  updatesList.innerHTML = "";
  state.data.updates.forEach((update) => {
    const card = createCard(update.title, update.text, update.date);
    updatesList.appendChild(card);
  });
}

function renderLetters() {
  lettersGrid.innerHTML = "";
  state.data.letters.forEach((letter, index) => {
    const card = document.createElement("article");
    card.className = "letter-card";

    const name = document.createElement("p");
    name.className = "letter-name";
    name.textContent = letter.name;

    const english = document.createElement("p");
    english.className = "letter-message";
    english.textContent = letter.messageEn;

    const arabic = document.createElement("p");
    arabic.className = "letter-message arabic";
    arabic.textContent = letter.messageAr || "";
    arabic.setAttribute("lang", "ar");
    arabic.setAttribute("dir", "rtl");

    const actions = document.createElement("div");
    actions.className = "letter-actions";

    if (letter.tiktok) {
      const link = document.createElement("a");
      link.className = "letter-link";
      link.href = letter.tiktok;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "TikTok";
      actions.appendChild(link);
    }

    const download = document.createElement("button");
    download.className = "secondary-button";
    download.type = "button";
    download.textContent = "Download PDF";
    download.dataset.action = "download-letter";
    download.dataset.index = index;
    actions.appendChild(download);

    card.appendChild(name);
    card.appendChild(english);
    if (letter.messageAr) {
      card.appendChild(arabic);
    }
    card.appendChild(actions);
    lettersGrid.appendChild(card);
  });
}

function renderGifts() {
  giftsTimeline.innerHTML = "";
  state.data.gifts.forEach((gift) => {
    const item = document.createElement("article");
    item.className = "timeline-item";

    const media = document.createElement("div");
    media.className = "timeline-media";
    if (gift.image) {
      const img = document.createElement("img");
      img.src = gift.image;
      img.alt = gift.title;
      img.loading = "lazy";
      img.dataset.lightbox = "true";
      img.dataset.caption = gift.title;
      media.appendChild(img);
    }

    const content = document.createElement("div");
    content.className = "timeline-content";

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = formatDate(gift.date);

    const title = document.createElement("h3");
    title.textContent = gift.title;

    const text = document.createElement("p");
    text.textContent = gift.text;

    content.appendChild(badge);
    content.appendChild(title);
    content.appendChild(text);

    if (gift.video) {
      const videoWrap = document.createElement("div");
      videoWrap.className = "timeline-video";
      const iframe = document.createElement("iframe");
      iframe.src = gift.video;
      iframe.title = gift.title + " video";
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      videoWrap.appendChild(iframe);
      content.appendChild(videoWrap);
    }

    item.appendChild(media);
    item.appendChild(content);
    giftsTimeline.appendChild(item);
  });
}

function renderGallery() {
  galleryPhotos.innerHTML = "";
  galleryVideos.innerHTML = "";
  galleryArt.innerHTML = "";

  const sortedPhotos = sortByName(state.data.gallery.photos);
  const sortedVideos = sortByName(state.data.gallery.videos);
  const sortedArt = sortByName(state.data.gallery.art);

  sortedPhotos.forEach((item) => {
    const card = createGalleryCard(item, "photos");
    galleryPhotos.appendChild(card);
  });

  sortedVideos.forEach((item) => {
    const card = createGalleryCard(item, "videos");
    galleryVideos.appendChild(card);
  });

  sortedArt.forEach((item) => {
    const card = createGalleryCard(item, "art");
    galleryArt.appendChild(card);
  });
}

function renderAnnouncements() {
  announcementsGrid.innerHTML = "";
  state.data.announcements.forEach((announcement) => {
    const card = createCard(announcement.title, announcement.text, announcement.date);
    announcementsGrid.appendChild(card);
  });
}

function createCard(titleText, bodyText, dateValue) {
  const card = document.createElement("article");
  card.className = "card";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = formatDate(dateValue);

  const title = document.createElement("h3");
  title.textContent = titleText;

  const body = document.createElement("p");
  body.textContent = bodyText;

  card.appendChild(badge);
  card.appendChild(title);
  card.appendChild(body);
  return card;
}

function createGalleryCard(item, category) {
  const card = document.createElement("article");
  card.className = "gallery-card";

  if (category === "videos") {
    const iframe = document.createElement("iframe");
    iframe.src = item.embed;
    iframe.title = item.title;
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    card.appendChild(iframe);
  } else {
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.caption;
    img.loading = "lazy";
    img.dataset.lightbox = "true";
    img.dataset.caption = item.caption;
    card.appendChild(img);
  }

  const info = document.createElement("div");
  info.className = "gallery-info";

  const title = document.createElement("h4");
  title.textContent = item.caption || item.title;

  const name = document.createElement("p");
  name.textContent = "By " + item.name;

  info.appendChild(title);
  info.appendChild(name);
  card.appendChild(info);

  return card;
}

function initCarousel() {
  const carousel = document.querySelector("[data-carousel]");
  if (!carousel) {
    return;
  }
  const track = carousel.querySelector("[data-carousel-track]");
  const slides = Array.from(track.children);
  const prev = carousel.querySelector(".prev");
  const next = carousel.querySelector(".next");
  let index = 0;

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, idx) => {
      slide.classList.toggle("is-active", idx === index);
    });
  }

  function go(direction) {
    index = (index + direction + slides.length) % slides.length;
    update();
  }

  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));

  setInterval(() => {
    go(1);
  }, 7000);
}

function initGalleryTabs() {
  const tabButtons = document.querySelectorAll("[data-gallery-tab]");
  const panels = document.querySelectorAll("[data-gallery-panel]");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.galleryTab;
      tabButtons.forEach((tab) => tab.classList.remove("is-active"));
      button.classList.add("is-active");

      panels.forEach((panel) => {
        panel.hidden = panel.dataset.galleryPanel !== target;
      });
    });
  });
}

function initLightbox() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("img[data-lightbox]");
    if (!trigger) {
      return;
    }
    lightboxImage.src = trigger.src;
    lightboxCaption.textContent = trigger.dataset.caption || "";
    lightbox.hidden = false;
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.classList.contains("lightbox-close")) {
      lightbox.hidden = true;
      lightboxImage.src = "";
      lightboxCaption.textContent = "";
    }
  });
}

function initReveal() {
  const revealItems = document.querySelectorAll(".reveal");
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

  revealItems.forEach((item) => observer.observe(item));
}

function initMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("is-open");
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      mobileMenu.classList.remove("is-open");
    }
  });
}

function initShareButtons() {
  const shareButtons = document.querySelectorAll(".share-button");
  shareButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const url = window.location.href;
      const text = "Share the Deer Army love for Tommy & Ghazel.";
      const type = button.dataset.share;

      if (type === "copy") {
        try {
          await navigator.clipboard.writeText(url);
          button.textContent = "Copied!";
          setTimeout(() => {
            button.textContent = "Copy Link";
          }, 1500);
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
    });
  });
}

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

function sortByName(items) {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

function initForms() {
  const letterForm = document.getElementById("letter-form");
  const galleryForm = document.getElementById("gallery-form");
  const contactForm = document.getElementById("contact-form");

  letterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(letterForm);
    const newLetter = {
      name: formData.get("name").trim(),
      messageEn: formData.get("messageEn").trim(),
      messageAr: formData.get("messageAr").trim(),
      tiktok: formData.get("tiktok").trim(),
    };
    if (!newLetter.name || !newLetter.messageEn) {
      return;
    }
    state.data.letters.unshift(newLetter);
    saveData();
    renderLetters();
    letterForm.reset();
    showFormMessage(letterForm, "Letter added. Thank you!", "success");
  });

  galleryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(galleryForm);
    const category = formData.get("category");
    const contributor = formData.get("contributor").trim();
    const caption = formData.get("caption").trim();
    const file = formData.get("file");
    const videoUrl = formData.get("videoUrl").trim();

    if (!contributor || !caption) {
      showFormMessage(galleryForm, "Please add your name and a caption.", "error");
      return;
    }

    if (category === "videos") {
      if (!videoUrl) {
        showFormMessage(galleryForm, "Please add a video URL.", "error");
        return;
      }
      const embed = toEmbedUrl(videoUrl);
      state.data.gallery.videos.unshift({ name: contributor, title: caption, embed });
      saveData();
      renderGallery();
      galleryForm.reset();
      showFormMessage(galleryForm, "Video edit added to the gallery!", "success");
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      showFormMessage(galleryForm, "Please upload an image file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      if (category === "photos") {
        state.data.gallery.photos.unshift({ name: contributor, caption, src: imageData });
      } else {
        state.data.gallery.art.unshift({ name: contributor, caption, src: imageData });
      }
      saveData();
      renderGallery();
      galleryForm.reset();
      showFormMessage(galleryForm, "Your piece is now in the gallery!", "success");
    };
    reader.readAsDataURL(file);
  });

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const submission = {
      name: formData.get("name").trim(),
      email: formData.get("email").trim(),
      type: formData.get("type"),
      message: formData.get("message").trim(),
      date: new Date().toISOString(),
    };
    const stored = JSON.parse(localStorage.getItem(SUBMISSION_KEY) || "[]");
    stored.unshift(submission);
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(stored));
    contactForm.reset();
    showFormMessage(contactForm, "Submission saved. Thank you for supporting the community!", "success");
  });
}

initForms();

function showFormMessage(form, message, type) {
  let note = form.querySelector(".form-message");
  if (!note) {
    note = document.createElement("p");
    note.className = "form-message";
    form.appendChild(note);
  }
  note.textContent = message;
  note.style.color = type === "error" ? "#a33" : "#2a3d31";
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

document.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  if (action !== "download-letter") {
    return;
  }
  const index = Number(event.target.dataset.index);
  const letter = state.data.letters[index];
  if (letter) {
    downloadLetterPdf(letter);
  }
});

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
