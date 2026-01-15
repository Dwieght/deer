import { prisma } from "../lib/prisma";
import HomeClient from "./home-client";
import { DEFAULT_GIFTS } from "./content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getApprovedData() {
  try {
    const [letters, gallery, announcements, about, videoCollections] = await Promise.all([
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
    ]);

    const approvedLetters = letters.map((letter) => ({
      name: letter.name,
      messageEn: letter.messageEn,
      messageAr: letter.messageAr,
      tiktok: letter.tiktok,
    }));

    const approvedGallery = {
      photos: [],
      videos: [],
      art: [],
    };

    gallery.forEach((item) => {
      const category = item.category;
      if (category === "VIDEOS") {
        if (item.embed) {
          approvedGallery.videos.push({
            name: item.name,
            title: item.caption,
            embed: item.embed,
          });
        }
        return;
      }
      if (category === "ART") {
        if (item.src) {
          approvedGallery.art.push({
            name: item.name,
            caption: item.caption,
            src: item.src,
          });
        }
        return;
      }
      if (item.src) {
        approvedGallery.photos.push({
          name: item.name,
          caption: item.caption,
          src: item.src,
        });
      }
    });

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
      about: null,
    };
  }
}

export default async function HomePage() {
  const { letters, gallery, updates, announcements, about, videoCollections } = await getApprovedData();

  return (
    <HomeClient
      letters={letters}
      gallery={gallery}
      updates={updates}
      gifts={DEFAULT_GIFTS}
      announcements={announcements}
      about={about}
      videoCollections={videoCollections}
    />
  );
}
