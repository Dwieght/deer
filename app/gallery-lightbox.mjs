function normalizeEntries(entries = []) {
  return entries
    .map((entry) => {
      if (!entry) {
        return null;
      }

      if (typeof entry === "string") {
        return {
          src: entry,
          fallbackSrc: entry,
        };
      }

      const src = String(entry.src || "").trim();
      const fallbackSrc = String(entry.fallbackSrc || "").trim();

      if (!src) {
        return null;
      }

      return {
        src,
        fallbackSrc: fallbackSrc || src,
      };
    })
    .filter(Boolean);
}

function formatCaption(caption, imageIndex, totalImages) {
  if (totalImages <= 1) {
    return caption;
  }

  return `${caption} (${imageIndex + 1}/${totalImages})`;
}

export function buildGalleryLightboxState(item = {}, imageIndex = 0) {
  const images = normalizeEntries(item.images || []);

  if (!images.length) {
    return {
      open: false,
      src: "",
      fallbackSrc: "",
      caption: "",
      images: [],
      imageIndex: 0,
    };
  }

  const safeIndex = ((imageIndex % images.length) + images.length) % images.length;
  const activeImage = images[safeIndex];

  return {
    open: true,
    src: activeImage.src,
    fallbackSrc: activeImage.fallbackSrc,
    caption: formatCaption(item.caption || "", safeIndex, images.length),
    images,
    imageIndex: safeIndex,
  };
}

export function moveGalleryLightboxIndex(lightboxState, delta) {
  if (!lightboxState?.images?.length || lightboxState.images.length <= 1) {
    return lightboxState;
  }

  return buildGalleryLightboxState(
    {
      caption: String(lightboxState.caption || "").replace(/\s\(\d+\/\d+\)$/, ""),
      images: lightboxState.images,
    },
    lightboxState.imageIndex + delta,
  );
}
