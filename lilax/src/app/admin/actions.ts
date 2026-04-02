"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeImageList, normalizeImageUrl } from "@/lib/image-url";
import { hashPassword, SESSION_COOKIE_NAME } from "@/lib/auth";
import { requireSession } from "@/lib/session";

const ORDER_STATUSES = new Set([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED"
]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePrice(value: FormDataEntryValue | null) {
  const amount = Number(String(value || "").trim());
  return Number.isFinite(amount) && amount >= 0 ? amount : NaN;
}

function parseStock(value: FormDataEntryValue | null) {
  const stock = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(stock) && stock >= 0 ? stock : NaN;
}

function parseGallery(raw: FormDataEntryValue | null) {
  return String(raw || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

function revalidateStore() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/users");
  revalidatePath("/admin/customers");
  revalidatePath("/signup");
}

function redirectWithMessage(path: string, type: "success" | "error", text: string): never {
  const params = new URLSearchParams({ type, text });
  redirect(`${path}?${params.toString()}`);
}

export async function createProduct(formData: FormData) {
  requireSession();

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = normalizeImageUrl(String(formData.get("imageUrl") || "").trim());
  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || name);
  const price = parsePrice(formData.get("price"));
  const stock = parseStock(formData.get("stock"));
  const gallery = normalizeImageList(parseGallery(formData.get("gallery")));
  const featured = parseChecked(formData, "featured");
  const isActive = parseChecked(formData, "isActive");

  if (!name || !category || !description || !imageUrl || !slug) {
    redirectWithMessage("/admin/products", "error", "All product fields are required.");
  }

  if (!Number.isFinite(price) || !Number.isFinite(stock)) {
    redirectWithMessage("/admin/products", "error", "Price and stock must be valid values.");
  }

  try {
    await prisma.product.create({
      data: {
        name,
        slug,
        category,
        description,
        imageUrl,
        gallery: gallery.length ? gallery : [imageUrl],
        price,
        stock,
        featured,
        isActive
      }
    });
  } catch {
    redirectWithMessage("/admin/products", "error", "Could not create product. Check if the slug is already used.");
  }

  revalidateStore();
  redirectWithMessage("/admin/products", "success", "Product added.");
}

export async function updateProduct(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = normalizeImageUrl(String(formData.get("imageUrl") || "").trim());
  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || name);
  const price = parsePrice(formData.get("price"));
  const stock = parseStock(formData.get("stock"));
  const gallery = normalizeImageList(parseGallery(formData.get("gallery")));
  const featured = parseChecked(formData, "featured");
  const isActive = parseChecked(formData, "isActive");

  if (!id || !name || !category || !description || !imageUrl || !slug) {
    redirectWithMessage("/admin/products", "error", "Product update is missing required data.");
  }

  if (!Number.isFinite(price) || !Number.isFinite(stock)) {
    redirectWithMessage("/admin/products", "error", "Price and stock must be valid values.");
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        category,
        description,
        imageUrl,
        gallery: gallery.length ? gallery : [imageUrl],
        price,
        stock,
        featured,
        isActive
      }
    });
  } catch {
    redirectWithMessage("/admin/products", "error", "Could not update product.");
  }

  revalidateStore();
  redirectWithMessage("/admin/products", "success", "Product updated.");
}

export async function deleteProduct(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirectWithMessage("/admin/products", "error", "Missing product id.");
  }

  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    redirectWithMessage("/admin/products", "error", "Could not delete product.");
  }

  revalidateStore();
  redirectWithMessage("/admin/products", "success", "Product deleted.");
}

export async function updateOrder(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const statusNote = String(formData.get("statusNote") || "").trim();

  if (!id || !ORDER_STATUSES.has(status)) {
    redirectWithMessage("/admin/orders", "error", "Invalid order update.");
  }

  try {
    await prisma.order.update({
      where: { id },
      data: {
        status: status as
          | "PENDING"
          | "PAID"
          | "PROCESSING"
          | "SHIPPED"
          | "DELIVERED"
          | "CANCELLED",
        statusNote: statusNote || null
      }
    });
  } catch {
    redirectWithMessage("/admin/orders", "error", "Could not update order.");
  }

  revalidateStore();
  redirectWithMessage("/admin/orders", "success", "Order updated.");
}

export async function deleteOrder(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirectWithMessage("/admin/orders", "error", "Missing order id.");
  }

  try {
    await prisma.order.delete({ where: { id } });
  } catch {
    redirectWithMessage("/admin/orders", "error", "Could not delete order.");
  }

  revalidateStore();
  redirectWithMessage("/admin/orders", "success", "Order deleted.");
}

export async function createUser(formData: FormData) {
  requireSession();

  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!email || !isValidEmail(email) || !password) {
    redirectWithMessage("/admin/users", "error", "A valid email and password are required.");
  }

  if (password !== confirmPassword) {
    redirectWithMessage("/admin/users", "error", "Passwords do not match.");
  }

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password)
      }
    });
  } catch {
    redirectWithMessage("/admin/users", "error", "Could not create admin. Check if the email is already used.");
  }

  revalidateStore();
  redirectWithMessage("/admin/users", "success", "Admin added.");
}

export async function updateUser(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!id || !email || !isValidEmail(email)) {
    redirectWithMessage("/admin/users", "error", "A valid admin email is required.");
  }

  if ((password || confirmPassword) && password !== confirmPassword) {
    redirectWithMessage("/admin/users", "error", "New passwords do not match.");
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        email,
        ...(password ? { passwordHash: hashPassword(password) } : {})
      }
    });
  } catch {
    redirectWithMessage("/admin/users", "error", "Could not update admin.");
  }

  revalidateStore();
  redirectWithMessage("/admin/users", "success", "Admin updated.");
}

export async function deleteUser(formData: FormData) {
  const session = requireSession();
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    redirectWithMessage("/admin/users", "error", "Missing admin id.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!targetUser) {
    redirectWithMessage("/admin/users", "error", "Admin account was not found.");
  }

  if (targetUser.email === session.email) {
    redirectWithMessage("/admin/users", "error", "You cannot delete the current signed-in admin.");
  }

  const userCount = await prisma.user.count();
  if (userCount <= 1) {
    redirectWithMessage("/admin/users", "error", "You cannot delete the last remaining admin.");
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    redirectWithMessage("/admin/users", "error", "Could not delete admin.");
  }

  revalidateStore();
  redirectWithMessage("/admin/users", "success", "Admin deleted.");
}

export async function approveCustomer(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirectWithMessage("/admin/customers", "error", "Missing customer id.");
  }

  try {
    await prisma.customer.update({
      where: { id },
      data: { status: "APPROVED" }
    });
  } catch {
    redirectWithMessage("/admin/customers", "error", "Could not approve customer.");
  }

  revalidateStore();
  redirectWithMessage("/admin/customers", "success", "Customer approved.");
}

export async function declineCustomer(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirectWithMessage("/admin/customers", "error", "Missing customer id.");
  }

  try {
    await prisma.customer.update({
      where: { id },
      data: { status: "DECLINED" }
    });
  } catch {
    redirectWithMessage("/admin/customers", "error", "Could not decline customer.");
  }

  revalidateStore();
  redirectWithMessage("/admin/customers", "success", "Customer declined.");
}

export async function deleteCustomer(formData: FormData) {
  requireSession();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirectWithMessage("/admin/customers", "error", "Missing customer id.");
  }

  try {
    await prisma.customer.delete({
      where: { id }
    });
  } catch {
    redirectWithMessage("/admin/customers", "error", "Could not delete customer.");
  }

  revalidateStore();
  redirectWithMessage("/admin/customers", "success", "Customer deleted.");
}

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
