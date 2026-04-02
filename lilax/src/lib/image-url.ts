export function extractDriveFileId(url: string) {
  const value = String(url || "").trim();

  if (!value.includes("drive.google.com")) {
    return "";
  }

  const fileMatch = value.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }

  const idMatch = value.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return idMatch[1];
  }

  return "";
}

export function normalizeImageUrl(url: string) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  const fileId = extractDriveFileId(value);
  if (!fileId) {
    return value;
  }

  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

export function normalizeImageList(urls: string[]) {
  return urls
    .map((url) => normalizeImageUrl(url))
    .filter(Boolean);
}
