const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const email = process.env.SEED_USER_EMAIL ? process.env.SEED_USER_EMAIL.trim().toLowerCase() : "";
  const password = process.env.SEED_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("SEED_USER_EMAIL and SEED_USER_PASSWORD must be set in .env");
  }

  const passwordHash = hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const letterSeeds = [
    {
      name: "Amina (Lipgloss ni Ghazel)",
      messageEn: "Tommy & Ghazel, your kindness feels like a warm blanket. Thank you for being light in our days.",
      messageAr: "تومي وغزال، لطفكم مثل بطانية دافئة. شكراً لأنكم نور في أيامنا.",
      tiktok: "https://www.tiktok.com/@lipglossnighazel",
    },
    {
      name: "Kira (Kuko ni Ghazel)",
      messageEn: "Your laughter is healing. The Deer Army is proud to stand beside you, always.",
      messageAr: "ضحكاتكم شفاء. جيش الغزلان فخور أن يقف بجانبكم دائماً.",
      tiktok: "https://www.tiktok.com/@kuko.nighazel",
    },
    {
      name: "Hadi (Guard ni Ghazel)",
      messageEn: "We see how hard you work and we admire your heart. Please keep shining.",
      messageAr: "نرى كم تعملون بجد ونُعجب بقلوبكم. استمروا في التألق.",
      tiktok: "https://www.tiktok.com/@guard.nighazel",
    },
    {
      name: "Noor",
      messageEn: "Your streams feel like home. Thank you for making space for all of us.",
      messageAr: "بثوثكم تشبه البيت. شكراً لأنكم تفتحون لنا مساحة دافئة.",
      tiktok: "https://www.tiktok.com/@noor.deerarmy",
    },
    {
      name: "Mae",
      messageEn: "Every gift is a small thank you for the big love you give us.",
      messageAr: "كل هدية هي شكر صغير على الحب الكبير الذي تمنحوننا إياه.",
      tiktok: "https://www.tiktok.com/@maedeerarmy",
    },
    {
      name: "Samir",
      messageEn: "I hope the Deer Army makes you feel safe and supported. We are always here.",
      messageAr: "أتمنى أن يجعلكم جيش الغزلان تشعرون بالأمان والدعم. نحن هنا دائماً.",
      tiktok: "https://www.tiktok.com/@samirdeerarmy",
    },
    {
      name: "Riya",
      messageEn: "Your creativity inspires my own art. Thank you for the gentle motivation.",
      messageAr: "إبداعكم يلهم فني. شكراً على الدافع اللطيف.",
      tiktok: "https://www.tiktok.com/@riya.deerarmy",
    },
    {
      name: "Yousef",
      messageEn: "May the Deer Army always wrap you in peace and encouragement.",
      messageAr: "أتمنى أن يحيطكم جيش الغزلان دائماً بالسلام والتشجيع.",
      tiktok: "https://www.tiktok.com/@yousef.deerarmy",
    },
    {
      name: "Luna",
      messageEn: "You both make the world softer. Thank you for every smile you share.",
      messageAr: "أنتم تجعلون العالم ألطف. شكراً على كل ابتسامة تشاركونها.",
      tiktok: "https://www.tiktok.com/@luna.deerarmy",
    },
    {
      name: "Army Heart",
      messageEn: "We love you endlessly. Keep dreaming big and resting often.",
      messageAr: "نحبكم بلا نهاية. استمروا في الحلم الكبير وخذوا وقتاً للراحة.",
      tiktok: "https://www.tiktok.com/@deerarmy",
    },
  ];

  const existingLetters = await prisma.letterSubmission.count();
  if (existingLetters === 0) {
    await prisma.letterSubmission.createMany({
      data: letterSeeds.map((letter) => ({
        ...letter,
        messageAr: letter.messageAr || null,
        tiktok: letter.tiktok || null,
        status: "APPROVED",
        reviewedAt: new Date(),
      })),
    });
    console.log("Seeded fan letters.");
  } else {
    console.log("Fan letters already exist. Skipping letter seed.");
  }

  const announcementSeeds = [
    {
      title: "January 13 Gift Day Recap",
      date: "2026-01-14",
      text: "Flowers, groceries, and letters were delivered with so much care. Thank you for making the day glow.",
      type: "UPDATE",
    },
    {
      title: "New Fan Edit Challenge",
      date: "2026-01-25",
      text: "Share a 30-second edit celebrating a Tommy & Ghazel moment. Tag #DeerArmyEdits.",
      type: "UPDATE",
    },
    {
      title: "Letter Drop Week",
      date: "2026-02-01",
      text: "We are collecting bilingual letters all week. Every note will be shared in the next community post.",
      type: "UPDATE",
    },
    {
      title: "PK Night Celebration",
      date: "2026-02-10",
      text: "Join the Deer Army for a cozy PK night with supportive comments and gifts.",
      type: "BOARD",
    },
    {
      title: "Community Letter Week",
      date: "2026-02-17",
      text: "Submit letters by Feb 15 so we can compile a bilingual bundle for the creators.",
      type: "BOARD",
    },
    {
      title: "Surprise Project: Hope Kit",
      date: "2026-03-02",
      text: "We are preparing a new support kit with music, snacks, and handwritten notes.",
      type: "BOARD",
    },
  ];

  const existingAnnouncements = await prisma.announcement.count();
  if (existingAnnouncements === 0) {
    await prisma.announcement.createMany({
      data: announcementSeeds.map((item) => ({
        title: item.title,
        text: item.text,
        type: item.type,
        date: new Date(`${item.date}T00:00:00`),
      })),
    });
    console.log("Seeded announcements and updates.");
  } else {
    console.log("Announcements already exist. Skipping announcement seed.");
  }

  const gallerySeeds = [
    {
      name: "Rina",
      caption: "Blue hour stream watch party.",
      category: "PHOTOS",
      src: "/assets/fanphoto-1.svg",
    },
    {
      name: "Kai",
      caption: "Community meetup memory wall.",
      category: "PHOTOS",
      src: "/assets/fanphoto-2.svg",
    },
    {
      name: "Mira",
      caption: "Handmade deer charms from fans.",
      category: "PHOTOS",
      src: "/assets/fanphoto-3.svg",
    },
    {
      name: "Tala",
      caption: "Golden hour edit for Tommy & Ghazel",
      category: "VIDEOS",
      embed: "https://www.youtube.com/embed/5qap5aO4i9A",
    },
    {
      name: "Jude",
      caption: "January 13 recap edit",
      category: "VIDEOS",
      embed: "https://www.youtube.com/embed/Zi_XLOBDo_Y",
    },
    {
      name: "Aya",
      caption: "Soft watercolor deer crest.",
      category: "ART",
      src: "/assets/fanart-1.svg",
    },
    {
      name: "Nash",
      caption: "Tommy & Ghazel illustrated portrait.",
      category: "ART",
      src: "/assets/fanart-2.svg",
    },
  ];

  const existingGallery = await prisma.gallerySubmission.count();
  if (existingGallery === 0) {
    await prisma.gallerySubmission.createMany({
      data: gallerySeeds.map((item) => ({
        name: item.name,
        caption: item.caption,
        category: item.category,
        src: item.src || null,
        embed: item.embed || null,
        status: "APPROVED",
        reviewedAt: new Date(),
      })),
    });
    console.log("Seeded gallery items.");
  } else {
    console.log("Gallery items already exist. Skipping gallery seed.");
  }

  const videoCollections = [
    {
      title: "Behind the Scenes",
      description: "Deer Army behind-the-scenes moments and gift highlights.",
      layout: "GRID",
      items: [
        {
          title: "Deer Army Behind the Scenes",
          url: "https://drive.google.com/file/d/10vzHPcEXteK_CQagdx0arU2guulKFsDy/preview",
        },
        {
          title: "Ghazel Receiving the Gifts (Instagram)",
          url: "https://drive.google.com/file/d/1H6C3Z1BUEfRhBh6uv1G27qqkXldUUhHa/preview",
        },
        {
          title: "Behind the Scenes Clip",
          url: "https://drive.google.com/file/d/1m8NJJCVYVD3FpP6NG4zMQRjpj0Jut7td/preview",
        },
      ],
    },
    {
      title: "From the Community",
      description: "Shared by Deer Army members.",
      layout: "CAROUSEL",
      items: [
        {
          title: "Hear Cake",
          url: "https://drive.google.com/file/d/14vBxfZjDaNfmOvirO3PVFWHGE_zM0fl1/preview",
        },
        {
          title: "Flowers",
          url: "https://drive.google.com/file/d/1XBhBFw2JIcZfBbt-8qpitkbsxuJgKWR-/preview",
        },
        {
          title: "Community Video",
          url: "https://drive.google.com/file/d/1pPUWsmKCHqyJSX6YoQ-hKKVl-Y_BqxOW/preview",
        },
        {
          title: "Community Highlight 1",
          url: "https://drive.google.com/file/d/18ftgfbROMCMtn9F7cBci35EFnSPNFAmX/preview",
        },
        {
          title: "Community Highlight 2",
          url: "https://drive.google.com/file/d/1dWJNMMKYstbjTxRUCyIYPPukMkbgbncg/preview",
        },
        {
          title: "Community Highlight 3",
          url: "https://drive.google.com/file/d/1vavvzyC6Iiui9bM1FcWSR-6T0M_YRYvM/preview",
        },
      ],
    },
    {
      title: "Buying the Cake Video",
      description: "Cake buying moments shared by the community.",
      layout: "CAROUSEL",
      items: [
        {
          title: "Buying the Cake Part 1",
          url: "https://drive.google.com/file/d/1IOkZ-VJ7FRHjrWxNTrTlYkTGeZ64tA2Y/preview",
        },
        {
          title: "Buying the Cake Part 2",
          url: "https://drive.google.com/file/d/1Fuu7-w0HnLKTR1fR0K5GTk4oYLhbrRC7/preview",
        },
        {
          title: "Buying the Cake Part 3",
          url: "https://drive.google.com/file/d/1rp380oBwTXBgj2cXcQPwjeRcAdw_HlAN/preview",
        },
        {
          title: "Buying the Cake Part 4",
          url: "https://drive.google.com/file/d/1cCYgMSlDuYnL0QJBKmapH1A02Rf-xJKW/preview",
        },
        {
          title: "Buying the Cake Part 5",
          url: "https://drive.google.com/file/d/1sP-hIVoDyFp2qukLCEyeC2OObVCAkVpV/preview",
        },
      ],
    },
  ];

  const existingCollections = await prisma.videoCollection.count();
  if (existingCollections === 0) {
    for (const collection of videoCollections) {
      await prisma.videoCollection.create({
        data: {
          title: collection.title,
          description: collection.description,
          layout: collection.layout,
          items: {
            create: collection.items.map((item) => ({
              title: item.title,
              url: item.url,
            })),
          },
        },
      });
    }
    console.log("Seeded video library collections.");
  } else {
    console.log("Video library already exists. Skipping video seed.");
  }

  const existingAbout = await prisma.aboutContent.findUnique({ where: { key: "primary" } });
  if (!existingAbout) {
    await prisma.aboutContent.create({
      data: {
        key: "primary",
        story:
          "Deer Army began as a small group of fans cheering for Tommy and Ghazel. The community grew into a heartfelt family that celebrates creativity, kindness, and the power of togetherness.",
        mission:
          "We exist to support Tommy & Ghazel with positive energy, thoughtful gifts, and uplifting encouragement. Every letter, edit, and moment is a reminder that they are never alone.",
        guidelines: [
          "Lead with kindness and gratitude.",
          "Respect privacy and boundaries.",
          "Celebrate each other's creativity.",
          "Keep the space hopeful and welcoming.",
        ],
      },
    });
    console.log("Seeded About Deer Army content.");
  } else {
    console.log("About content already exists. Skipping about seed.");
  }

  const productSeeds = [
    {
      name: "Deer Army Sticker Pack",
      category: "Stickers",
      price: 4.5,
      imageUrl: "/assets/fanart-1.svg",
      description: "Printable sticker sheet with deer motifs and cozy phrases.",
    },
    {
      name: "Soft Green Tee",
      category: "Apparel",
      price: 22,
      imageUrl: "/assets/fanart-2.svg",
      description: "Crew neck shirt featuring the Deer Army crest.",
    },
    {
      name: "Fan Art Print Bundle",
      category: "Printables",
      price: 9,
      imageUrl: "/assets/fanphoto-1.svg",
      description: "Downloadable art prints inspired by Tommy & Ghazel moments.",
    },
    {
      name: "Deer Army Hoodie",
      category: "Apparel",
      price: 38,
      imageUrl: "/assets/fanphoto-2.svg",
      description: "Comfy hoodie with embroidered deer heart badge.",
    },
    {
      name: "Car Window Decal",
      category: "Stickers",
      price: 6.75,
      imageUrl: "/assets/fanphoto-3.svg",
      description: "Weatherproof decal featuring the Deer Army mark.",
    },
    {
      name: "Thank You Postcards",
      category: "Printables",
      price: 7,
      imageUrl: "/assets/moment-02.svg",
      description: "Set of printable postcards for gift day notes.",
    },
    {
      name: "Deer Army Tote Bag",
      category: "Accessories",
      price: 16,
      imageUrl: "/assets/moment-03.svg",
      description: "Canvas tote with soft green typography.",
    },
    {
      name: "Phone Wallpaper Pack",
      category: "Digital",
      price: 3.5,
      imageUrl: "/assets/moment-01.svg",
      description: "Mobile wallpapers for Tommy & Ghazel fans.",
    },
    {
      name: "Desk Art Print",
      category: "Home",
      price: 12,
      imageUrl: "/assets/gift-surprise.svg",
      description: "Small art print sized for desks and shelves.",
    },
    {
      name: "Deer Army Keychain",
      category: "Accessories",
      price: 5.25,
      imageUrl: "/assets/deer-mark.svg",
      description: "Acrylic keychain with the Deer Army emblem.",
    },
    {
      name: "February Calendar Pack",
      category: "Digital",
      price: 4,
      imageUrl: "/assets/jan13-letters.svg",
      description: "Printable monthly calendar with community reminders.",
    },
    {
      name: "Letter Writing Set",
      category: "Stationery",
      price: 8,
      imageUrl: "/assets/jan13-flowers.svg",
      description: "Printable letter templates and decorative borders.",
    },
    {
      name: "Sticker Sheet Vol. 2",
      category: "Stickers",
      price: 4.75,
      imageUrl: "/assets/jan13-groceries.svg",
      description: "Extra deer doodles and cozy phrases.",
    },
    {
      name: "Gift Day Photo Bundle",
      category: "Printables",
      price: 10,
      imageUrl: "/assets/moment-02.svg",
      description: "Curated prints from the January 13 gift day.",
    },
    {
      name: "Deer Army Cap",
      category: "Apparel",
      price: 18,
      imageUrl: "/assets/moment-03.svg",
      description: "Soft cap with stitched Deer Army mark.",
    },
    {
      name: "Community Badge Set",
      category: "Accessories",
      price: 6.5,
      imageUrl: "/assets/fanphoto-2.svg",
      description: "Printable badge set for community events.",
    },
    {
      name: "Warm Notes Bundle",
      category: "Bundle",
      price: 14,
      imageUrl: "/assets/fanphoto-3.svg",
      description: "Printable thank-you notes and envelopes.",
    },
    {
      name: "Soft Green Mug Wrap",
      category: "Home",
      price: 7.25,
      imageUrl: "/assets/fanphoto-1.svg",
      description: "Printable wrap for custom mugs.",
    },
    {
      name: "Fan Art Pack Vol. 2",
      category: "Digital",
      price: 5.5,
      imageUrl: "/assets/fanart-1.svg",
      description: "Extra art assets inspired by Deer Army moments.",
    },
    {
      name: "Deer Army Lanyard",
      category: "Accessories",
      price: 9.5,
      imageUrl: "/assets/fanart-2.svg",
      description: "Printable lanyard design for meetups.",
    },
  ];

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    await prisma.product.createMany({
      data: productSeeds,
    });
    console.log("Seeded shop products.");
  } else {
    console.log("Products already exist. Skipping product seed.");
  }

  console.log(`Seeded user: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
