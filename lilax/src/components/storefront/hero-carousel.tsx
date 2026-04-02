"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { BLUR_DATA_URL, HERO_SLIDES } from "./data";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

function formatPart(value: number) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function getTimeLeft(targetDate: Date) {
  return Math.max(0, targetDate.getTime() - Date.now());
}

export default function HeroCarousel({
  initialTimeLeftMs,
  targetDateIso,
}: {
  initialTimeLeftMs: number;
  targetDateIso: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const targetDate = useMemo(() => new Date(targetDateIso), [targetDateIso]);
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, initialTimeLeftMs),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));

    const interval = window.setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_360px]">
        <div className="relative overflow-hidden rounded-3xl bg-hero-grad text-white shadow-float">
          <div className="relative min-h-[300px] sm:min-h-[360px]">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-500 ${
                  index === activeIndex
                    ? "translate-x-0 opacity-100"
                    : index < activeIndex
                      ? "-translate-x-8 opacity-0"
                      : "translate-x-8 opacity-0"
                }`}
              >
                <div className="absolute inset-0 bg-black/20" />
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 100vw, 70vw"
                  className="object-cover mix-blend-multiply"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                <div className="relative z-10 flex h-full flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
                  <div className="max-w-xl">
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] backdrop-blur">
                      {slide.badge}
                    </span>
                    <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                      {slide.title}
                    </h1>
                    <p className="mt-4 max-w-lg text-sm text-white/90 sm:text-base">
                      {slide.description}
                    </p>
                    <Link
                      href={slide.ctaHref}
                      className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-bold text-[#EE4D2D] transition hover:-translate-y-0.5"
                    >
                      {slide.ctaLabel}
                    </Link>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                      {HERO_SLIDES.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            index === activeIndex
                              ? "w-8 bg-white"
                              : "w-2.5 bg-white/45"
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex(
                            (current) =>
                              (current - 1 + HERO_SLIDES.length) %
                              HERO_SLIDES.length,
                          )
                        }
                        className="rounded-full border border-white/25 bg-white/10 p-2 backdrop-blur transition hover:bg-white/20"
                        aria-label="Previous slide"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex(
                            (current) => (current + 1) % HERO_SLIDES.length,
                          )
                        }
                        className="rounded-full border border-white/25 bg-white/10 p-2 backdrop-blur transition hover:bg-white/20"
                        aria-label="Next slide"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#EE4D2D]">
            Flash Sale Countdown
          </p>
          <h2 className="mt-3 text-2xl font-black text-slate-900">Ends in</h2>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {[
              { label: "Days", value: formatPart(days) },
              { label: "Hours", value: formatPart(hours) },
              { label: "Mins", value: formatPart(minutes) },
              { label: "Secs", value: formatPart(seconds) },
            ].map((part) => (
              <div
                key={part.label}
                className="rounded-2xl bg-[#fff4f1] p-3 text-center"
              >
                <div className="text-2xl font-black text-[#EE4D2D]">
                  {part.value}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {part.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-[#EE4D2D]/25 bg-gradient-to-r from-[#fff4f1] to-white p-4">
            <p className="text-sm font-semibold text-slate-700">
              Limited-time push
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Shop discounted picks, then continue through basket and checkout
              without leaving the page.
            </p>
            <Link
              href="#flash-sale"
              className="mt-4 inline-flex rounded-full bg-[#EE4D2D] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d83f22]"
            >
              Go to Flash Sale
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
