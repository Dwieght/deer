import test from "node:test";
import assert from "node:assert/strict";

import { buildApprovedGallery, getGalleryImageList } from "./gallery-data.mjs";

test("getGalleryImageList returns the primary image followed by unique additional images", () => {
  const images = getGalleryImageList({
    src: "https://drive.google.com/file/d/primary/view?usp=sharing",
    imageUrls: [
      "https://drive.google.com/file/d/extra-1/view?usp=sharing",
      "https://drive.google.com/file/d/primary/view?usp=sharing",
      "https://drive.google.com/file/d/extra-2/view?usp=sharing",
    ],
  });

  assert.deepEqual(images, [
    "https://drive.google.com/file/d/primary/view?usp=sharing",
    "https://drive.google.com/file/d/extra-1/view?usp=sharing",
    "https://drive.google.com/file/d/extra-2/view?usp=sharing",
  ]);
});

test("buildApprovedGallery maps photos and art with image arrays while preserving videos", () => {
  const gallery = buildApprovedGallery(
    [
      {
        category: "PHOTOS",
        name: "Kai",
        caption: "Memory wall",
        src: "photo-1",
        imageUrls: ["photo-2", "photo-3"],
      },
      {
        category: "ART",
        name: "Mira",
        caption: "Fan art",
        src: "art-1",
        imageUrls: ["art-2"],
      },
      {
        category: "VIDEOS",
        name: "Tala",
        caption: "Edit",
        embed: "https://youtube.test/embed/123",
      },
    ],
    (value) => `normalized:${value}`,
  );

  assert.deepEqual(gallery.photos, [
    {
      name: "Kai",
      caption: "Memory wall",
      src: "normalized:photo-1",
      images: [
        "normalized:photo-1",
        "normalized:photo-2",
        "normalized:photo-3",
      ],
    },
  ]);

  assert.deepEqual(gallery.art, [
    {
      name: "Mira",
      caption: "Fan art",
      src: "normalized:art-1",
      images: ["normalized:art-1", "normalized:art-2"],
    },
  ]);

  assert.deepEqual(gallery.videos, [
    {
      name: "Tala",
      title: "Edit",
      embed: "https://youtube.test/embed/123",
    },
  ]);
});
