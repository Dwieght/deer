"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    title: "Happy Birthday, Angel Llanos",
    text: "You are a gentle glow in our Deer Army family.",
  },
  {
    title: "Joined January 12, 2026",
    text: "From your first hello, you brought warmth to the chat.",
  },
  {
    title: "Meryenda moments",
    text: "You remind us to share, care, and enjoy the moment together.",
  },
  {
    title: "Thank you for the laughter",
    text: "Your joy keeps the herd smiling, even on long nights.",
  },
  {
    title: "Kindness in every message",
    text: "Your words always feel like a warm hug for the community.",
  },
  {
    title: "A wish from all of us",
    text: "May your days be bright, your dreams be big, and your heart be peaceful.",
  },
  {
    title: "We love you, Angel",
    text: "Happy birthday today and always, from the Deer Army.",
  },
];

export default function BirthdayPage() {
  const [index, setIndex] = useState(0);
  const total = SLIDES.length;
  const slide = SLIDES[index];
  const progress = ((index + 1) / total) * 100;
  const confettiPieces = Array.from({ length: 30 }, (_, i) => i);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % total);
    }, 7000);
    return () => clearInterval(timer);
  }, [total]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "ArrowRight") {
        setIndex((prev) => (prev + 1) % total);
      }
      if (event.key === "ArrowLeft") {
        setIndex((prev) => (prev - 1 + total) % total);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [total]);

  return (
    <div className="birthday-page">
      <div className="birthday-confetti" aria-hidden="true">
        {confettiPieces.map((piece) => (
          <span
            key={`confetti-${piece}`}
            className="confetti-piece"
            style={{
              left: `${(piece * 3) % 100}%`,
              animationDelay: `${(piece % 10) * 0.2}s`,
            }}
          />
        ))}
      </div>
      <header className="birthday-header">
        <a className="birthday-back" href="/">
          &lt;- Back to Home
        </a>
        <div className="birthday-title">
          <span className="badge">Deer Army Birthday</span>
          <h1>Angel Llanos</h1>
          <p className="birthday-subtitle">Joined January 12, 2026</p>
        </div>
      </header>

      <main className="birthday-stage">
        <div className="birthday-card" key={index}>
          <h2>{slide.title}</h2>
          <p>{slide.text}</p>
        </div>

        <div className="birthday-dots">
          {SLIDES.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              className={i === index ? "is-active" : ""}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="birthday-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      </main>
    </div>
  );
}
