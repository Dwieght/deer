import { prisma } from "../lib/prisma";
import HomeClient from "./home-client";
import { DEFAULT_GIFTS } from "./content";
import { buildApprovedGallery } from "./gallery-data.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function getApprovedData() {
  try {
    const [letters, gallery, announcements, about, videoCollections, paymentQrs] = await Promise.all([
      prisma.letterSubmission.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gallerySubmission.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.announcement.findMany({
        orderBy: { date: "desc" },
      }),
      prisma.aboutContent.findUnique({ where: { key: "primary" } }),
      prisma.videoCollection.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          items: {
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      prisma.paymentQrCode.findMany({
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const approvedLetters = letters.map((letter) => ({
      name: letter.name,
      messageEn: letter.messageEn,
      messageAr: letter.messageAr,
      tiktok: letter.tiktok,
    }));

    const approvedGallery = buildApprovedGallery(gallery, normalizeImageUrl);

    const updates = announcements.filter((item) => item.type === "UPDATE");
    const boardAnnouncements = announcements.filter((item) => item.type === "BOARD");

    return {
      letters: approvedLetters,
      gallery: approvedGallery,
      updates,
      announcements: boardAnnouncements,
      videoCollections: videoCollections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        description: collection.description,
        layout: collection.layout,
        items: collection.items.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url,
        })),
      })),
      paymentQrs: paymentQrs.map((qr) => ({
        id: qr.id,
        title: qr.title,
        note: qr.note,
        imageUrl: normalizeImageUrl(qr.imageUrl),
      })),
      about: about
        ? {
            story: about.story,
            mission: about.mission,
            guidelines: about.guidelines,
          }
        : null,
    };
  } catch (error) {
    return {
      letters: [],
      gallery: { photos: [], videos: [], art: [] },
      updates: [],
      announcements: [],
      videoCollections: [],
      paymentQrs: [],
      about: null,
    };
  }
}

export default async function HomePage() {
  const { letters, gallery, updates, announcements, about, videoCollections, paymentQrs } = await getApprovedData();

  return (
    <HomeClient
      letters={letters}
      gallery={gallery}
      updates={updates}
      gifts={DEFAULT_GIFTS}
      announcements={announcements}
      about={about}
      videoCollections={videoCollections}
      paymentQrs={paymentQrs}
    />
  );
}
