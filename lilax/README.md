# Lilax

Standalone Next.js + Prisma + MongoDB storefront, built with the same stack style as the Deer project but using its own database and seed data.

## Features

- Customer storefront with product catalog, category filter, search, basket, and checkout
- Admin login
- Admin product management
- Admin order management
- MongoDB via Prisma
- Vercel-ready App Router setup

## Environment

Create `.env` from `.env.example`.

- `DATABASE_URL`: can use the same MongoDB cluster/database as Deer because Lilax uses separate mapped collections (`LilaxUser`, `LilaxProduct`, `LilaxOrder`)
- `AUTH_SECRET`: long random string for session signing

## Setup

```bash
npm install
npm run prisma:push
npm run prisma:seed
npm run dev
```

## Deploy to Vercel

If this project lives inside the Deer repository, set the Vercel Root Directory to `lilax`.

Use these environment variables in Vercel:

- `DATABASE_URL`
- `AUTH_SECRET`

Recommended deployment flow:

```bash
npm install
npm run build
npx prisma db push
npm run prisma:seed
```

Notes:

- Vercel will install dependencies automatically from `package.json`
- the current build command is `prisma generate && next build`
- `db push` and `seed` are not part of the Vercel build, so run them yourself against the production database

## Seed Admin

- Email: `admin@lilax.shop`
- Password: `LilaxAdmin123!`

Change these after first setup if this will be public.
