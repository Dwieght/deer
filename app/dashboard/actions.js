"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { hashPassword, SESSION_COOKIE_NAME, verifySessionToken } from "../../lib/auth";

const GALLERY_CATEGORIES = new Set(["PHOTOS", "VIDEOS", "ART"]);
const ANNOUNCEMENT_TYPES = new Set(["UPDATE", "BOARD"]);
const VIDEO_LAYOUTS = new Set(["GRID", "CAROUSEL"]);
const ORDER_STATUSES = new Set(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]);
const DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/letters",
  "/dashboard/announcements",
  "/dashboard/gallery",
  "/dashboard/videos",
  "/dashboard/payments",
  "/dashboard/products",
  "/dashboard/orders",
  "/dashboard/about",
  "/dashboard/users",
  "/dashboard/join",
  "/dashboard/pending",
];

function revalidateDashboard() {
  DASHBOARD_PATHS.forEach((path) => revalidatePath(path));
}

function requireSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  let session = null;
  try {
    session = verifySessionToken(token);
  } catch (error) {
    redirect("/login");
  }
  if (!session) {
    redirect("/login");
  }
  return session;
}

function parseDateInput(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function normalizeEmbedUrl(url) {
  if (!url) {
    return "";
  }
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const shortMatch = url.match(/youtu\.be\/([A-Za-z0-9_-]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    const longMatch = url.match(/[?&]v=([^&]+)/);
    if (longMatch) {
      return `https://www.youtube.com/embed/${longMatch[1]}`;
    }
    const shortsMatch = url.match(/shorts\/([^?]+)/);
    if (shortsMatch) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }
  }
  if (url.includes("tiktok.com")) {
    const match = url.match(/video\/(\d+)/);
    if (match) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  }
  return url;
}

function normalizeDriveUrl(url) {
  if (!url.includes("drive.google.com")) {
    return url;
  }
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }
  if (url.includes("/preview")) {
    return url;
  }
  if (url.includes("/view")) {
    return url.replace("/view", "/preview");
  }
  return url;
}

function normalizeDriveImageUrl(url) {
  if (!url.includes("drive.google.com")) {
    return url;
  }
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }
  if (url.includes("/uc?")) {
    return url.replace("export=download", "export=view");
  }
  return url;
}

function normalizeVideoUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    return "";
  }
  const drive = normalizeDriveUrl(trimmed);
  return normalizeEmbedUrl(drive);
}

function parseGuidelines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseAmount(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) {
    return NaN;
  }
  return amount;
}

function parseQuantity(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }
  const quantity = Number.parseInt(raw, 10);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return NaN;
  }
  return quantity;
}

function ok(message) {
  return { ok: true, message };
}

function fail(message) {
  return { ok: false, message };
}

export async function createLetter(_prevState, formData) {
  requireSession();
  const name = String(formData.get("name") || "").trim();
  const messageEn = String(formData.get("messageEn") || "").trim();
  const messageAr = String(formData.get("messageAr") || "").trim();
  const tiktok = String(formData.get("tiktok") || "").trim();
  if (!name || !messageEn) {
    return fail("Name and English message are required.");
  }
  try {
    await prisma.letterSubmission.create({
      data: {
        name,
        messageEn,
        messageAr: messageAr || null,
        tiktok: tiktok || null,
        status: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Letter saved.");
  } catch (error) {
    return fail("Could not save letter.");
  }
}

export async function updateLetter(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const messageEn = String(formData.get("messageEn") || "").trim();
  const messageAr = String(formData.get("messageAr") || "").trim();
  const tiktok = String(formData.get("tiktok") || "").trim();
  if (!id || !name || !messageEn) {
    return fail("Name and English message are required.");
  }
  try {
    await prisma.letterSubmission.update({
      where: { id },
      data: {
        name,
        messageEn,
        messageAr: messageAr || null,
        tiktok: tiktok || null,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Letter updated.");
  } catch (error) {
    return fail("Could not update letter.");
  }
}

export async function deleteLetter(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing letter id.");
  }
  try {
    await prisma.letterSubmission.delete({ where: { id } });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Letter deleted.");
  } catch (error) {
    return fail("Could not delete letter.");
  }
}

export async function createAnnouncement(_prevState, formData) {
  requireSession();
  const title = String(formData.get("title") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const type = String(formData.get("type") || "").trim().toUpperCase();
  const date = parseDateInput(formData.get("date"));
  if (!title || !text || !date || !ANNOUNCEMENT_TYPES.has(type)) {
    return fail("Title, date, type, and details are required.");
  }
  try {
    await prisma.announcement.create({
      data: {
        title,
        text,
        type,
        date,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Announcement added.");
  } catch (error) {
    return fail("Could not add announcement.");
  }
}

export async function updateAnnouncement(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const type = String(formData.get("type") || "").trim().toUpperCase();
  const date = parseDateInput(formData.get("date"));
  if (!id || !title || !text || !date || !ANNOUNCEMENT_TYPES.has(type)) {
    return fail("Title, date, type, and details are required.");
  }
  try {
    await prisma.announcement.update({
      where: { id },
      data: {
        title,
        text,
        type,
        date,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Announcement updated.");
  } catch (error) {
    return fail("Could not update announcement.");
  }
}

export async function deleteAnnouncement(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing announcement id.");
  }
  try {
    await prisma.announcement.delete({ where: { id } });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Announcement deleted.");
  } catch (error) {
    return fail("Could not delete announcement.");
  }
}

export async function createGalleryItem(_prevState, formData) {
  requireSession();
  const name = String(formData.get("name") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const category = String(formData.get("category") || "").trim().toUpperCase();
  const srcRaw = String(formData.get("src") || "").trim();
  const embedRaw = String(formData.get("embed") || "").trim();
  if (!name || !caption || !GALLERY_CATEGORIES.has(category)) {
    return fail("Name, caption, and category are required.");
  }
  const embed = category === "VIDEOS" ? normalizeEmbedUrl(embedRaw) : "";
  const src = category === "VIDEOS" ? "" : normalizeDriveImageUrl(srcRaw);
  if (category === "VIDEOS" && !embed) {
    return fail("A video URL is required.");
  }
  if (category !== "VIDEOS" && !src) {
    return fail("An image URL is required.");
  }
  try {
    await prisma.gallerySubmission.create({
      data: {
        name,
        caption,
        category,
        src: category === "VIDEOS" ? null : src,
        embed: category === "VIDEOS" ? embed : null,
        status: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Gallery item saved.");
  } catch (error) {
    return fail("Could not save gallery item.");
  }
}

export async function updateGalleryItem(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const category = String(formData.get("category") || "").trim().toUpperCase();
  const srcRaw = String(formData.get("src") || "").trim();
  const embedRaw = String(formData.get("embed") || "").trim();
  if (!id || !name || !caption || !GALLERY_CATEGORIES.has(category)) {
    return fail("Name, caption, and category are required.");
  }
  const embed = category === "VIDEOS" ? normalizeEmbedUrl(embedRaw) : "";
  const src = category === "VIDEOS" ? "" : normalizeDriveImageUrl(srcRaw);
  if (category === "VIDEOS" && !embed) {
    return fail("A video URL is required.");
  }
  if (category !== "VIDEOS" && !src) {
    return fail("An image URL is required.");
  }
  try {
    await prisma.gallerySubmission.update({
      where: { id },
      data: {
        name,
        caption,
        category,
        src: category === "VIDEOS" ? null : src,
        embed: category === "VIDEOS" ? embed : null,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Gallery item updated.");
  } catch (error) {
    return fail("Could not update gallery item.");
  }
}

export async function deleteGalleryItem(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing gallery item id.");
  }
  try {
    await prisma.gallerySubmission.delete({ where: { id } });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Gallery item deleted.");
  } catch (error) {
    return fail("Could not delete gallery item.");
  }
}

export async function upsertAbout(_prevState, formData) {
  requireSession();
  const story = String(formData.get("story") || "").trim();
  const mission = String(formData.get("mission") || "").trim();
  const guidelinesRaw = formData.get("guidelines");
  const guidelines = parseGuidelines(guidelinesRaw);
  if (!story || !mission || guidelines.length === 0) {
    return fail("Story, mission, and guidelines are required.");
  }
  try {
    await prisma.aboutContent.upsert({
      where: { key: "primary" },
      update: {
        story,
        mission,
        guidelines,
      },
      create: {
        key: "primary",
        story,
        mission,
        guidelines,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("About content saved.");
  } catch (error) {
    return fail("Could not save About content.");
  }
}

export async function upsertUser(_prevState, formData) {
  requireSession();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email) {
    return fail("Email is required.");
  }
  if (!password || password.length < 6) {
    return fail("Password must be at least 6 characters.");
  }
  const passwordHash = hashPassword(password);
  try {
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
    revalidateDashboard();
    return ok("Admin user saved.");
  } catch (error) {
    return fail("Could not save admin user.");
  }
}

export async function createProduct(_prevState, formData) {
  requireSession();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const priceRaw = formData.get("price");
  const imageUrlRaw = String(formData.get("imageUrl") || "").trim();
  const imageUrlsRaw = String(formData.get("imageUrls") || "").trim();
  const sizesRaw = String(formData.get("sizes") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseAmount(priceRaw);
  const imageUrl = normalizeDriveImageUrl(imageUrlRaw);
  const imageUrls = imageUrlsRaw
    ? imageUrlsRaw
        .split("\n")
        .map((line) => normalizeDriveImageUrl(line.trim()))
        .filter(Boolean)
    : [];
  const sizes = sizesRaw
    ? sizesRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (!name || !category || price === null || Number.isNaN(price)) {
    return fail("Name, category, and price are required.");
  }
  if (!imageUrl) {
    return fail("Product image URL is required.");
  }
  try {
    await prisma.product.create({
      data: {
        name,
        category,
        price,
        imageUrl,
        imageUrls,
        sizes,
        description: description || null,
      },
    });
    revalidatePath("/shop");
    revalidateDashboard();
    return ok("Product added.");
  } catch (error) {
    return fail("Could not add product.");
  }
}

export async function updateProduct(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const priceRaw = formData.get("price");
  const imageUrlRaw = String(formData.get("imageUrl") || "").trim();
  const imageUrlsRaw = String(formData.get("imageUrls") || "").trim();
  const sizesRaw = String(formData.get("sizes") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseAmount(priceRaw);
  const imageUrl = normalizeDriveImageUrl(imageUrlRaw);
  const imageUrls = imageUrlsRaw
    ? imageUrlsRaw
        .split("\n")
        .map((line) => normalizeDriveImageUrl(line.trim()))
        .filter(Boolean)
    : [];
  const sizes = sizesRaw
    ? sizesRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (!id || !name || !category || price === null || Number.isNaN(price)) {
    return fail("Name, category, and price are required.");
  }
  if (!imageUrl) {
    return fail("Product image URL is required.");
  }
  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        category,
        price,
        imageUrl,
        imageUrls,
        sizes,
        description: description || null,
      },
    });
    revalidatePath("/shop");
    revalidateDashboard();
    return ok("Product updated.");
  } catch (error) {
    return fail("Could not update product.");
  }
}

export async function deleteProduct(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing product id.");
  }
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/shop");
    revalidateDashboard();
    return ok("Product deleted.");
  } catch (error) {
    return fail("Could not delete product.");
  }
}

export async function updateOrder(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const customerName = String(formData.get("customerName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const region = String(formData.get("region") || "").trim();
  const province = String(formData.get("province") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const barangay = String(formData.get("barangay") || "").trim();
  const postalCode = String(formData.get("postalCode") || "").trim();
  const streetName = String(formData.get("streetName") || "").trim();
  const building = String(formData.get("building") || "").trim();
  const houseNo = String(formData.get("houseNo") || "").trim();
  const addressLabel = String(formData.get("addressLabel") || "").trim();
  const size = String(formData.get("size") || "").trim();
  const status = String(formData.get("status") || "").trim().toUpperCase();
  const quantityRaw = formData.get("quantity");
  if (!id || !customerName || !phone || !ORDER_STATUSES.has(status)) {
    return fail("Customer name, phone, and status are required.");
  }
  if (!region || !province || !city || !barangay) {
    return fail("Region, province, city, and barangay are required.");
  }
  if (!postalCode || !streetName || !houseNo || !addressLabel) {
    return fail("Postal code, street, house number, and label are required.");
  }
  const quantity = parseQuantity(quantityRaw);
  if (Number.isNaN(quantity) || quantity === null) {
    return fail("Quantity must be a valid number.");
  }
  try {
    const existing = await prisma.order.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!existing || !existing.product) {
      return fail("Order not found.");
    }
    const total = existing.product.price * quantity;
    await prisma.order.update({
      where: { id },
      data: {
        customerName,
        phone,
        region,
        province,
        city,
        barangay,
        postalCode,
        streetName,
        building: building || null,
        houseNo,
        addressLabel,
        size: size || null,
        status,
        quantity,
        total,
      },
    });
    revalidateDashboard();
    return ok("Order updated.");
  } catch (error) {
    return fail("Could not update order.");
  }
}

export async function deleteOrder(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing order id.");
  }
  try {
    await prisma.order.delete({ where: { id } });
    revalidateDashboard();
    return ok("Order deleted.");
  } catch (error) {
    return fail("Could not delete order.");
  }
}

export async function createPaymentQr(_prevState, formData) {
  requireSession();
  const title = String(formData.get("title") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const imageUrlRaw = String(formData.get("imageUrl") || "").trim();
  const imageUrl = normalizeDriveImageUrl(imageUrlRaw);
  if (!imageUrl) {
    return fail("QR code image URL is required.");
  }
  try {
    await prisma.paymentQrCode.create({
      data: {
        title: title || null,
        note: note || null,
        imageUrl,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("QR code added.");
  } catch (error) {
    return fail("Could not add QR code.");
  }
}

export async function updatePaymentQr(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const imageUrlRaw = String(formData.get("imageUrl") || "").trim();
  const imageUrl = normalizeDriveImageUrl(imageUrlRaw);
  if (!id || !imageUrl) {
    return fail("QR code image URL is required.");
  }
  try {
    await prisma.paymentQrCode.update({
      where: { id },
      data: {
        title: title || null,
        note: note || null,
        imageUrl,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("QR code updated.");
  } catch (error) {
    return fail("Could not update QR code.");
  }
}

export async function deletePaymentQr(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing QR id.");
  }
  try {
    await prisma.paymentSubmission.updateMany({
      where: { qrCodeId: id },
      data: { qrCodeId: null },
    });
    await prisma.paymentQrCode.delete({ where: { id } });
    revalidatePath("/");
    revalidateDashboard();
    return ok("QR code deleted.");
  } catch (error) {
    return fail("Could not delete QR code.");
  }
}

export async function updatePaymentSubmission(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const matched = String(formData.get("matched") || "") === "true";
  if (!id) {
    return fail("Missing submission id.");
  }
  try {
    await prisma.paymentSubmission.update({
      where: { id },
      data: {
        matched,
        matchedAt: matched ? new Date() : null,
      },
    });
    revalidateDashboard();
    return ok(matched ? "Marked as matched." : "Marked as unmatched.");
  } catch (error) {
    return fail("Could not update submission.");
  }
}

export async function updatePaymentSubmissionDetails(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const senderName = String(formData.get("senderName") || "").trim();
  const referenceNumber = String(formData.get("referenceNumber") || "").trim();
  const amountRaw = formData.get("amount");
  if (!id || !senderName || !referenceNumber) {
    return fail("Name, reference number, and submission id are required.");
  }
  const amount = parseAmount(amountRaw);
  if (Number.isNaN(amount)) {
    return fail("Amount must be a valid number.");
  }
  try {
    await prisma.paymentSubmission.update({
      where: { id },
      data: {
        senderName,
        referenceNumber,
        amount,
      },
    });
    revalidateDashboard();
    return ok("Payment submission updated.");
  } catch (error) {
    return fail("Could not update submission.");
  }
}

export async function deletePaymentSubmission(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing submission id.");
  }
  try {
    await prisma.paymentSubmission.delete({ where: { id } });
    revalidateDashboard();
    return ok("Submission deleted.");
  } catch (error) {
    return fail("Could not delete submission.");
  }
}

export async function createVideoCollection(_prevState, formData) {
  requireSession();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const layout = String(formData.get("layout") || "").trim().toUpperCase();
  if (!title || !VIDEO_LAYOUTS.has(layout)) {
    return fail("Title and layout are required.");
  }
  try {
    await prisma.videoCollection.create({
      data: {
        title,
        description: description || null,
        layout,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Video collection added.");
  } catch (error) {
    return fail("Could not add video collection.");
  }
}

export async function updateVideoCollection(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const layout = String(formData.get("layout") || "").trim().toUpperCase();
  if (!id || !title || !VIDEO_LAYOUTS.has(layout)) {
    return fail("Title and layout are required.");
  }
  try {
    await prisma.videoCollection.update({
      where: { id },
      data: {
        title,
        description: description || null,
        layout,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Video collection updated.");
  } catch (error) {
    return fail("Could not update video collection.");
  }
}

export async function deleteVideoCollection(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing video collection id.");
  }
  try {
    await prisma.videoItem.deleteMany({ where: { collectionId: id } });
    await prisma.videoCollection.delete({ where: { id } });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Video collection deleted.");
  } catch (error) {
    return fail("Could not delete video collection.");
  }
}

export async function createVideoItem(_prevState, formData) {
  requireSession();
  const collectionId = String(formData.get("collectionId") || "");
  const title = String(formData.get("title") || "").trim();
  const urlRaw = String(formData.get("url") || "").trim();
  const url = normalizeVideoUrl(urlRaw);
  if (!collectionId || !title || !url) {
    return fail("Title and video URL are required.");
  }
  try {
    await prisma.videoItem.create({
      data: {
        title,
        url,
        collectionId,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Video added.");
  } catch (error) {
    return fail("Could not add video.");
  }
}

export async function updateVideoItem(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const urlRaw = String(formData.get("url") || "").trim();
  const url = normalizeVideoUrl(urlRaw);
  if (!id || !title || !url) {
    return fail("Title and video URL are required.");
  }
  try {
    await prisma.videoItem.update({
      where: { id },
      data: {
        title,
        url,
      },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Video updated.");
  } catch (error) {
    return fail("Could not update video.");
  }
}

export async function deleteVideoItem(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing video id.");
  }
  try {
    await prisma.videoItem.delete({ where: { id } });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Video deleted.");
  } catch (error) {
    return fail("Could not delete video.");
  }
}

export async function approveLetter(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing letter id.");
  }
  try {
    await prisma.letterSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Letter approved.");
  } catch (error) {
    return fail("Could not approve letter.");
  }
}

export async function declineLetter(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing letter id.");
  }
  try {
    await prisma.letterSubmission.delete({ where: { id } });
    revalidateDashboard();
    return ok("Letter declined.");
  } catch (error) {
    return fail("Could not decline letter.");
  }
}

export async function approveGallery(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing gallery id.");
  }
  try {
    await prisma.gallerySubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
    revalidatePath("/");
    revalidateDashboard();
    return ok("Gallery item approved.");
  } catch (error) {
    return fail("Could not approve gallery item.");
  }
}

export async function declineGallery(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing gallery id.");
  }
  try {
    await prisma.gallerySubmission.delete({ where: { id } });
    revalidateDashboard();
    return ok("Gallery item declined.");
  } catch (error) {
    return fail("Could not decline gallery item.");
  }
}

export async function approveContact(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing message id.");
  }
  try {
    await prisma.contactSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
    revalidateDashboard();
    return ok("Message approved.");
  } catch (error) {
    return fail("Could not approve message.");
  }
}

export async function declineContact(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing message id.");
  }
  try {
    await prisma.contactSubmission.delete({ where: { id } });
    revalidateDashboard();
    return ok("Message declined.");
  } catch (error) {
    return fail("Could not decline message.");
  }
}

export async function approveJoin(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing join request id.");
  }
  try {
    await prisma.joinSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });
    revalidateDashboard();
    return ok("Join request approved.");
  } catch (error) {
    return fail("Could not approve join request.");
  }
}

export async function declineJoin(_prevState, formData) {
  requireSession();
  const id = String(formData.get("id") || "");
  if (!id) {
    return fail("Missing join request id.");
  }
  try {
    await prisma.joinSubmission.delete({ where: { id } });
    revalidateDashboard();
    return ok("Join request declined.");
  } catch (error) {
    return fail("Could not decline join request.");
  }
}

export async function logoutAction() {
  cookies().set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  redirect("/login");
}
