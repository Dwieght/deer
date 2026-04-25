export function getGalleryImageList(item = {}) {
  const values = [item?.src, ...(Array.isArray(item?.imageUrls) ? item.imageUrls : [])]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return Array.from(new Set(values));
}

export function buildApprovedGallery(items = [], normalizeImage) {
  const approvedGallery = {
    photos: [],
    videos: [],
    art: [],
  };

  items.forEach((item) => {
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

    const images = Array.from(
      new Set(
        getGalleryImageList(item)
          .map((value) => normalizeImage(value))
          .filter(Boolean),
      ),
    );

    if (!images.length) {
      return;
    }

    const payload = {
      name: item.name,
      caption: item.caption,
      src: images[0],
      images,
    };

    if (category === "ART") {
      approvedGallery.art.push(payload);
      return;
    }

    approvedGallery.photos.push(payload);
  });

  return approvedGallery;
}
