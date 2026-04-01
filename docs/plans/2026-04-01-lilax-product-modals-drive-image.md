# Lilax Product Modals and Google Drive Image Rendering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move product `View` and `Edit` interactions into modals, remove the inline below-table product panel, and make Google Drive image links render correctly in Lilax admin and shared product views.

**Architecture:** Add a shared image URL normalizer in `src/lib`, then use it both when saving product URLs and when rendering existing product data. Convert the product admin table from inline detail panels to modal dialogs, and add a small client-side alert bridge so successful create/update redirects show a one-time browser alert while leaving the modal closed.

**Tech Stack:** Next.js App Router, React client/server components, Prisma server actions, `next/image`, Vitest, Testing Library, shared CSS in `src/app/globals.css`

---

### Task 1: Add failing tests for Drive URL normalization

**Files:**
- Create: `lilax/src/lib/image-url.test.ts`
- Create: `lilax/src/lib/image-url.ts`

**Step 1: Write the failing test**

Create `lilax/src/lib/image-url.test.ts` with tests like:

```ts
import { describe, expect, it } from "vitest";
import { normalizeImageUrl, normalizeImageList } from "./image-url";

describe("normalizeImageUrl", () => {
  it("keeps non-drive urls unchanged", () => {
    expect(normalizeImageUrl("https://images.unsplash.com/photo-1")).toBe(
      "https://images.unsplash.com/photo-1"
    );
  });

  it("converts google drive file view links", () => {
    expect(
      normalizeImageUrl(
        "https://drive.google.com/file/d/1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro/view?usp=sharing"
      )
    ).toBe(
      "https://drive.google.com/uc?export=view&id=1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro"
    );
  });

  it("normalizes image lists", () => {
    expect(
      normalizeImageList([
        "https://drive.google.com/file/d/abc123/view?usp=sharing",
        " https://images.unsplash.com/photo-2 "
      ])
    ).toEqual([
      "https://drive.google.com/uc?export=view&id=abc123",
      "https://images.unsplash.com/photo-2"
    ]);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- image-url
```

Expected:

- FAIL because `src/lib/image-url.ts` does not exist yet

**Step 3: Write minimal implementation**

Create `lilax/src/lib/image-url.ts` with:

- `extractDriveFileId(url: string): string`
- `normalizeImageUrl(url: string): string`
- `normalizeImageList(urls: string[]): string[]`

Implement only enough logic to satisfy:

- non-Drive URLs return trimmed original values
- `/file/d/<id>/view` becomes `https://drive.google.com/uc?export=view&id=<id>`
- `?id=<id>` Drive URLs convert to the same shape

**Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- image-url
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add lilax/src/lib/image-url.ts lilax/src/lib/image-url.test.ts
git commit -m "test(lilax): add drive image normalization coverage"
```

### Task 2: Add failing modal tests for product view/edit dialogs

**Files:**
- Modify: `lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx`
- Modify: `lilax/src/app/admin/_components/product-admin-table.tsx`

**Step 1: Write the failing test**

Add or update tests in `admin-table-smoke.test.tsx`:

```tsx
it("opens the view modal for a selected product", () => {
  render(<ProductAdminTable products={[product]} />);

  fireEvent.click(screen.getByRole("button", { name: "View" }));

  expect(screen.getByRole("dialog", { name: "View Product" })).toBeInTheDocument();
  expect(screen.getByText("A roomy everyday tote with a soft structured body.")).toBeInTheDocument();
});

it("opens the edit modal for a selected product", () => {
  render(<ProductAdminTable products={[product]} />);

  fireEvent.click(screen.getByRole("button", { name: "Edit" }));

  expect(screen.getByRole("dialog", { name: "Edit Product" })).toBeInTheDocument();
  expect(screen.getByDisplayValue("Lilax Canvas Tote")).toBeInTheDocument();
});
```

Also assert the old inline panel is gone:

```tsx
expect(screen.queryByText("Select a product")).not.toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- admin-table-smoke
```

Expected:

- FAIL because product table still renders below-table detail sections rather than dialogs

**Step 3: Write minimal implementation**

In `lilax/src/app/admin/_components/product-admin-table.tsx`:

- keep one selected product state object
- rename or replace `panel` state with modal-oriented state
- render a modal for view mode:
  - `role="dialog"`
  - `aria-label="View Product"`
- render a modal for edit mode:
  - `role="dialog"`
  - `aria-label="Edit Product"`
- remove the persistent inline detail card and `Select a product` fallback block

Keep the existing form and product overview content, but move them inside modal containers.

**Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- admin-table-smoke
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx lilax/src/app/admin/_components/product-admin-table.tsx
git commit -m "feat(lilax): move product view and edit into modals"
```

### Task 3: Apply image normalization on save and render

**Files:**
- Modify: `lilax/src/app/admin/actions.ts`
- Modify: `lilax/src/app/admin/_components/product-admin-table.tsx`
- Modify: `lilax/src/app/page.tsx`
- Modify: `lilax/src/components/storefront/product-card.tsx`
- Modify: `lilax/src/components/storefront/flash-sale-section.tsx`
- Modify: `lilax/src/app/storefront-client.tsx`

**Step 1: Write the failing test**

Add one UI-level assertion to `admin-table-smoke.test.tsx`:

```tsx
const driveProduct = {
  ...product,
  imageUrl: "https://drive.google.com/file/d/1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro/view?usp=sharing"
};

render(<ProductAdminTable products={[driveProduct]} />);

expect(screen.getByAltText("Lilax Canvas Tote")).toHaveAttribute(
  "src",
  expect.stringContaining("https://drive.google.com/uc?export=view&id=1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro")
);
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- admin-table-smoke
```

Expected:

- FAIL because the current renderer still uses the raw Drive view URL

**Step 3: Write minimal implementation**

In `lilax/src/app/admin/actions.ts`:

- import `normalizeImageUrl` and `normalizeImageList`
- normalize `imageUrl`
- normalize parsed gallery values
- keep fallback behavior where gallery uses `imageUrl` if empty

In rendering files:

- normalize `product.imageUrl` before passing to `next/image`
- normalize gallery images before mapping them
- do the same in the storefront product image renderers

This protects both newly saved data and previously stored data.

**Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- admin-table-smoke
npm test -- image-url
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add lilax/src/lib/image-url.ts lilax/src/lib/image-url.test.ts lilax/src/app/admin/actions.ts lilax/src/app/admin/_components/product-admin-table.tsx lilax/src/app/page.tsx lilax/src/components/storefront/product-card.tsx lilax/src/components/storefront/flash-sale-section.tsx lilax/src/app/storefront-client.tsx
git commit -m "fix(lilax): normalize google drive image urls"
```

### Task 4: Add one-time success alerts for product create/update

**Files:**
- Create: `lilax/src/app/admin/_components/admin-flash-alert.tsx`
- Modify: `lilax/src/app/admin/products/page.tsx`

**Step 1: Write the failing test**

Extend `admin-table-smoke.test.tsx` or add a focused test for the alert component:

```tsx
const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

render(<AdminFlashAlert type="success" text="Product created." scope="products" />);

expect(alertSpy).toHaveBeenCalledWith("Product created.");
```

Also verify it only fires once for the same message if rendered twice using a session key mock.

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- admin-table-smoke
```

Expected:

- FAIL because the alert bridge does not exist yet

**Step 3: Write minimal implementation**

Create `admin-flash-alert.tsx` as a client component that:

- accepts `type`, `text`, and `scope`
- when `type === "success"` and `text` matches product create/update strings:
  - calls `window.alert(text)`
  - stores a `sessionStorage` marker
  - optionally removes the query string with `history.replaceState`

In `products/page.tsx`:

- keep the existing flash-message block
- render `<AdminFlashAlert ... />` when flash text exists

Because the page is reloaded after the server action redirect, the create or edit modal will already be closed.

**Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- admin-table-smoke
```

Expected:

- PASS

**Step 5: Commit**

```bash
git add lilax/src/app/admin/_components/admin-flash-alert.tsx lilax/src/app/admin/products/page.tsx lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx
git commit -m "feat(lilax): add product success alerts after redirect"
```

### Task 5: Update modal styling and verify layout

**Files:**
- Modify: `lilax/src/app/globals.css`

**Step 1: Write the failing test**

For CSS-driven layout, use manual verification targets instead of brittle DOM assertions. Define the desired modal styles first:

```css
.admin-product-overlay {
  justify-content: center;
  align-items: center;
}

.admin-product-modal {
  width: min(100%, 1040px);
  max-height: calc(100vh - 44px);
  overflow: auto;
}
```

**Step 2: Run the app to observe current behavior**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm run dev
```

Expected before fix:

- view/edit product still use non-modal layout or generic modal sizing
- image preview may feel cramped

**Step 3: Write minimal implementation**

In `lilax/src/app/globals.css`:

- add or refine admin product modal overlay class
- add width/scroll styles for read-only and edit product modals
- ensure mobile behavior remains stacked
- keep the products table full width

**Step 4: Run build to verify no regressions**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm run build
```

Expected:

- PASS

Manual checks:

- `View` modal is readable and scrollable
- `Edit` modal fits the form without horizontal overflow
- Google Drive image now renders in preview

**Step 5: Commit**

```bash
git add lilax/src/app/globals.css
git commit -m "style(lilax): polish product admin modals"
```

### Task 6: Final verification

**Files:**
- Review only

**Step 1: Verify admin product flow manually**

Check:

- `/admin/products`
- table renders without below-table detail panel
- `Add Product` modal opens and closes
- `View` modal opens and shows image/description/details
- `Edit` modal opens and shows form fields

**Step 2: Verify Google Drive image behavior**

Use the sample URL:

`https://drive.google.com/file/d/1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro/view?usp=sharing`

Check:

- table thumbnail renders
- modal main image renders
- gallery thumbnails render if included

**Step 3: Verify success feedback**

Check:

- add a product → alert appears and modal is closed after redirect
- edit a product → alert appears and modal is closed after redirect

**Step 4: Run final automated verification**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test
npm run build
```

Expected:

- PASS for all tests
- PASS for production build

**Step 5: Review changed files**

Expected changed files:

- `lilax/src/lib/image-url.ts`
- `lilax/src/lib/image-url.test.ts`
- `lilax/src/app/admin/_components/product-admin-table.tsx`
- `lilax/src/app/admin/_components/product-create-modal.tsx`
- `lilax/src/app/admin/_components/admin-flash-alert.tsx`
- `lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx`
- `lilax/src/app/admin/actions.ts`
- `lilax/src/app/admin/products/page.tsx`
- `lilax/src/app/page.tsx`
- `lilax/src/components/storefront/product-card.tsx`
- `lilax/src/components/storefront/flash-sale-section.tsx`
- `lilax/src/app/storefront-client.tsx`
- `lilax/src/app/globals.css`

**Step 6: Commit**

```bash
git add lilax/src/lib/image-url.ts lilax/src/lib/image-url.test.ts lilax/src/app/admin/_components/product-admin-table.tsx lilax/src/app/admin/_components/product-create-modal.tsx lilax/src/app/admin/_components/admin-flash-alert.tsx lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx lilax/src/app/admin/actions.ts lilax/src/app/admin/products/page.tsx lilax/src/app/page.tsx lilax/src/components/storefront/product-card.tsx lilax/src/components/storefront/flash-sale-section.tsx lilax/src/app/storefront-client.tsx lilax/src/app/globals.css
git commit -m "feat(lilax): move product actions to modals and normalize drive images"
```
