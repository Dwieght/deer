import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export async function POST(request) {
  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const caption = String(body?.caption || "").trim();
  const categoryRaw = String(body?.category || "").trim();
  const embed = String(body?.embed || "").trim();
  const imageData = String(body?.imageData || "").trim();

  if (!name || !caption || !categoryRaw) {
    return NextResponse.json({ error: "Name, caption, and category are required" }, { status: 400 });
  }

  const category = categoryRaw.toUpperCase();
  if (!['PHOTOS', 'VIDEOS', 'ART'].includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const data = {
    name,
    caption,
    category,
    embed: null,
    src: null,
  };

  if (category === "VIDEOS") {
    if (!embed) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }
    data.embed = embed;
  } else {
    if (!imageData.startsWith("data:image")) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }
    if (Buffer.byteLength(imageData, "utf8") > MAX_IMAGE_SIZE * 1.4) {
      return NextResponse.json({ error: "Image is too large" }, { status: 400 });
    }
    data.src = imageData;
  }

  try {
    await prisma.gallerySubmission.create({ data });
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
