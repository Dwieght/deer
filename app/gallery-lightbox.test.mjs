import test from "node:test";
import assert from "node:assert/strict";

import {
  buildGalleryLightboxState,
  moveGalleryLightboxIndex,
} from "./gallery-lightbox.mjs";

test("buildGalleryLightboxState creates navigable state for multi-image gallery items", () => {
  const state = buildGalleryLightboxState({
    caption: "Community meetup memory wall.",
    images: ["preview-1", "preview-2", "preview-3"],
  }, 1);

  assert.deepEqual(state, {
    open: true,
    src: "preview-2",
    fallbackSrc: "preview-2",
    caption: "Community meetup memory wall. (2/3)",
    images: [
      { src: "preview-1", fallbackSrc: "preview-1" },
      { src: "preview-2", fallbackSrc: "preview-2" },
      { src: "preview-3", fallbackSrc: "preview-3" },
    ],
    imageIndex: 1,
  });
});

test("moveGalleryLightboxIndex wraps around within a multi-image gallery set", () => {
  const state = {
    open: true,
    src: "preview-1",
    fallbackSrc: "preview-1",
    caption: "Community meetup memory wall. (1/3)",
    images: ["preview-1", "preview-2", "preview-3"],
    imageIndex: 0,
  };

  assert.equal(moveGalleryLightboxIndex(state, -1).imageIndex, 2);
  assert.equal(moveGalleryLightboxIndex(state, 1).imageIndex, 1);
});

test("moveGalleryLightboxIndex leaves non-gallery lightbox entries unchanged", () => {
  const state = {
    open: true,
    src: "hero-slide",
    fallbackSrc: "",
    caption: "Hero slide",
    images: [],
    imageIndex: 0,
  };

  assert.deepEqual(moveGalleryLightboxIndex(state, 1), state);
});
