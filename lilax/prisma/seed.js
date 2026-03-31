const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

const products = [
  {
    name: "Sunbeam Tote",
    slug: "sunbeam-tote",
    category: "Bags",
    description:
      "A roomy everyday tote with a bright yellow accent panel and reinforced handles for errands, school, or quick weekend plans.",
    price: 499,
    stock: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80"
    ],
    featured: true,
    isActive: true
  },
  {
    name: "Honey Desk Mat",
    slug: "honey-desk-mat",
    category: "Desk",
    description:
      "A clean desk mat with a warm golden tone, built to make workspaces feel calmer and more intentional.",
    price: 799,
    stock: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80"
    ],
    featured: true,
    isActive: true
  },
  {
    name: "Citrus Bottle",
    slug: "citrus-bottle",
    category: "Drinkware",
    description:
      "A lightweight insulated bottle designed for all-day use with a fresh yellow finish and simple silhouette.",
    price: 649,
    stock: 20,
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1610824352934-c10d87b700cc?auto=format&fit=crop&w=900&q=80"
    ],
    featured: false,
    isActive: true
  },
  {
    name: "Golden Notes Planner",
    slug: "golden-notes-planner",
    category: "Paper",
    description:
      "A compact planner for lists, goals, and small wins. Soft cover, bright edge, and easy daily layout.",
    price: 349,
    stock: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80"
    ],
    featured: false,
    isActive: true
  },
  {
    name: "Market Carry Basket",
    slug: "market-carry-basket",
    category: "Home",
    description:
      "A woven carry basket for storage or gifting. Warm neutral body with a cheerful yellow trim.",
    price: 899,
    stock: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=900&q=80"
    ],
    featured: true,
    isActive: true
  },
  {
    name: "Amber Sticker Pack",
    slug: "amber-sticker-pack",
    category: "Accessories",
    description:
      "A printable-style sticker pack with soft golden shapes, labels, and cheerful mini icons.",
    price: 199,
    stock: 40,
    imageUrl:
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1473186505569-9c61870c11f9?auto=format&fit=crop&w=900&q=80"
    ],
    featured: false,
    isActive: true
  }
];

async function main() {
  const adminEmail = "admin@lilax.shop";
  const adminPassword = "LilaxAdmin123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashPassword(adminPassword)
    },
    create: {
      email: adminEmail,
      passwordHash: hashPassword(adminPassword)
    }
  });

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product
    });
  }

  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const first = await prisma.product.findUnique({
      where: { slug: "sunbeam-tote" }
    });

    if (first) {
      await prisma.order.create({
        data: {
          orderCode: "LX-DEMO1",
          customerName: "Sample Customer",
          email: "sample@lilax.shop",
          phone: "09171234567",
          addressLine1: "123 Sample Street",
          addressLine2: "Unit 5",
          city: "Quezon City",
          province: "Metro Manila",
          postalCode: "1100",
          country: "Philippines",
          status: "PENDING",
          statusNote: "Waiting for admin confirmation.",
          items: [
            {
              productId: first.id,
              slug: first.slug,
              name: first.name,
              imageUrl: first.imageUrl,
              quantity: 1,
              unitPrice: first.price,
              lineTotal: first.price
            }
          ],
          subtotal: first.price,
          shippingFee: 0,
          total: first.price
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
