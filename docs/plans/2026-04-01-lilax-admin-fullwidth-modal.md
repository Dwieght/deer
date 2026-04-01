# Lilax Admin Full-Width Tables + Add Product Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move product creation into a modal, remove the permanent inline create panel from the products page, and make both `Products` and `Orders` use the full admin content width.

**Architecture:** Keep the current server actions and table/detail components intact. Introduce one small client-side modal wrapper for product creation, rewire the products page to use it from the header, and widen the shared admin page shell through scoped CSS changes so both admin pages align visually.

**Tech Stack:** Next.js App Router, React client/server components, Prisma server actions, Vitest, Testing Library, shared CSS in `src/app/globals.css`

---

### Task 1: Add failing modal tests for product creation

**Files:**
- Modify: `lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx`
- Create: `lilax/src/app/admin/_components/product-create-modal.tsx`

**Step 1: Write the failing test**

Add a new test block that renders `ProductCreateModal` and asserts:

```tsx
render(<ProductCreateModal />);

expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument();
expect(screen.queryByText("Product name")).not.toBeInTheDocument();

fireEvent.click(screen.getByRole("button", { name: "Add Product" }));

expect(screen.getByRole("dialog", { name: "Add Product" })).toBeInTheDocument();
expect(screen.getByLabelText("Product name")).toBeInTheDocument();
expect(screen.getByLabelText("Slug")).toBeInTheDocument();
```

Also add a close assertion:

```tsx
fireEvent.click(screen.getByRole("button", { name: "Close" }));

expect(screen.queryByRole("dialog", { name: "Add Product" })).not.toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- --runInBand admin-table-smoke
```

Expected:

- FAIL because `product-create-modal.tsx` does not exist yet

**Step 3: Write minimal implementation**

Create `lilax/src/app/admin/_components/product-create-modal.tsx` with:

- `"use client";`
- local `useState(false)` for open/close
- trigger button text `Add Product`
- conditional modal wrapper with `role="dialog"` and accessible heading
- initial form shell containing:
  - `Product name`
  - `Slug`
  - `Category`
  - close button

Use a placeholder form structure first; do not wire every field yet.

**Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- --runInBand admin-table-smoke
```

Expected:

- PASS for the new modal smoke test

**Step 5: Commit**

```bash
git add lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx lilax/src/app/admin/_components/product-create-modal.tsx
git commit -m "test(lilax): add product create modal smoke coverage"
```

### Task 2: Replace the inline add form with the modal trigger

**Files:**
- Modify: `lilax/src/app/admin/products/page.tsx`
- Modify: `lilax/src/app/admin/_components/product-create-modal.tsx`

**Step 1: Write the failing test**

Extend the modal smoke test or add a products-page render test that documents the expected header action:

```tsx
expect(screen.getByRole("button", { name: "Add Product" })).toBeInTheDocument();
expect(screen.queryByText("Everything here belongs only to Lilax.")).not.toBeInTheDocument();
```

If rendering the full page is too heavy for the existing test harness, document this behavior through component-level tests on `ProductCreateModal` and product table copy.

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- --runInBand admin-table-smoke
```

Expected:

- FAIL because the products page still renders the inline create panel copy

**Step 3: Write minimal implementation**

In `lilax/src/app/admin/products/page.tsx`:

- import `ProductCreateModal`
- place it in the `.page-heading` action area
- delete the inline `form action={createProduct}` panel
- delete the surrounding `.admin-grid` wrapper
- keep only:
  - heading
  - flash message
  - stat cards
  - wide current products panel

In `lilax/src/app/admin/_components/product-create-modal.tsx`:

- replace the placeholder form with the full existing create form fields:
  - `Product name`
  - `Slug`
  - `Category`
  - `Description`
  - `Price`
  - `Stock`
  - `Main image URL`
  - `Gallery URLs`
  - `Featured product`
  - `Visible in storefront`
- wire `action={createProduct}` directly

**Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- --runInBand admin-table-smoke
```

Expected:

- PASS with modal create flow covered

**Step 5: Commit**

```bash
git add lilax/src/app/admin/products/page.tsx lilax/src/app/admin/_components/product-create-modal.tsx lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx
git commit -m "feat(lilax): move product creation into modal"
```

### Task 3: Update product table copy for the new create flow

**Files:**
- Modify: `lilax/src/app/admin/_components/product-admin-table.tsx`
- Modify: `lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx`

**Step 1: Write the failing test**

Add an empty-state test:

```tsx
render(<ProductAdminTable products={[]} />);

expect(screen.getByText("No products yet")).toBeInTheDocument();
expect(screen.getByText("Create your first Lilax product from the Add Product button.")).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- --runInBand admin-table-smoke
```

Expected:

- FAIL because the current copy still says `using the add form`

**Step 3: Write minimal implementation**

In `lilax/src/app/admin/_components/product-admin-table.tsx`:

- update the empty-state copy from the inline-form wording to modal-trigger wording
- keep all row actions, selected panel logic, and detail card behavior unchanged

Suggested copy:

```tsx
<p>Create your first Lilax product from the Add Product button.</p>
```

**Step 4: Run test to verify it passes**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test -- --runInBand admin-table-smoke
```

Expected:

- PASS for the new empty-state copy assertion

**Step 5: Commit**

```bash
git add lilax/src/app/admin/_components/product-admin-table.tsx lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx
git commit -m "refactor(lilax): align product table copy with modal create flow"
```

### Task 4: Widen the admin pages and add modal styling

**Files:**
- Modify: `lilax/src/app/globals.css`

**Step 1: Write the failing test**

CSS layout is best validated manually here. Instead of a fragile DOM-style test, define the target selectors before editing:

```css
.admin-page {
  max-width: none;
  width: 100%;
}

.admin-page-wide {
  width: 100%;
}

.admin-create-modal {
  width: min(100%, 920px);
}
```

**Step 2: Run current app to verify the layout problem exists**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm run dev
```

Expected:

- `Products` shows a left create panel
- both admin pages still cap at `1200px`

**Step 3: Write minimal implementation**

In `lilax/src/app/globals.css`:

- change `.admin-page` so it can expand beyond `1200px`
- add a new page class such as `.admin-page-wide`
- add an admin modal panel class that can reuse the overlay structure without hijacking checkout semantics
- remove dependency on `.admin-grid` for the products page layout, or keep the selector only for older/admin-shared uses
- make the table shell breathe more on wide screens

Add or adjust selectors for:

```css
.admin-page {
  width: 100%;
  max-width: none;
}

.admin-page-wide {
  width: 100%;
}

.admin-page-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.admin-create-overlay {
  justify-content: center;
}

.admin-create-modal {
  width: min(100%, 920px);
  margin: auto;
  height: auto;
  max-height: calc(100vh - 44px);
}
```

Keep the mobile stacking rules for:

- `.page-heading`
- `.panel-headline`
- `.admin-table-scroll`

**Step 4: Run app and build to verify it works**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm run build
```

Expected:

- PASS

Manual check:

- `/admin/products` uses full width and the table is noticeably wider
- `/admin/orders` uses the same full width
- add-product modal is centered and scrollable

**Step 5: Commit**

```bash
git add lilax/src/app/globals.css
git commit -m "style(lilax): widen admin tables and add create modal styles"
```

### Task 5: Apply the shared full-width class to orders

**Files:**
- Modify: `lilax/src/app/admin/orders/page.tsx`
- Modify: `lilax/src/app/admin/products/page.tsx`

**Step 1: Write the failing test**

If you add lightweight page render tests, assert that both pages use the new wide page class. If page tests are not worth the harness cost, document this as a manual verification item.

Expected target markup:

```tsx
<section className="admin-page admin-page-wide">
```

**Step 2: Run current build to verify baseline**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm run build
```

Expected:

- PASS before the final layout class change

**Step 3: Write minimal implementation**

Update both pages:

- `lilax/src/app/admin/products/page.tsx`
- `lilax/src/app/admin/orders/page.tsx`

Use:

```tsx
<section className="admin-page admin-page-wide">
```

Keep all flash-message and stat-card logic unchanged.

**Step 4: Run tests and build**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test
npm run build
```

Expected:

- PASS for all tests
- PASS for production build

**Step 5: Commit**

```bash
git add lilax/src/app/admin/products/page.tsx lilax/src/app/admin/orders/page.tsx
git commit -m "feat(lilax): make admin tables full width"
```

### Task 6: Final verification

**Files:**
- Review only

**Step 1: Verify products flow manually**

Check:

- `/admin/products`
- header shows `Add Product`
- no inline left create panel remains
- clicking `Add Product` opens the modal
- modal contains all expected fields
- table remains usable and detail panel still works

**Step 2: Verify orders flow manually**

Check:

- `/admin/orders`
- page width matches products
- table/detail interactions still work

**Step 3: Run final automated verification**

Run:

```bash
cd /Users/dweight/Documents/projects/deer/lilax
npm test
npm run build
```

Expected:

- PASS for all tests
- PASS for build

**Step 4: Review changed files**

Expected changed files:

- `lilax/src/app/admin/_components/product-create-modal.tsx`
- `lilax/src/app/admin/_components/product-admin-table.tsx`
- `lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx`
- `lilax/src/app/admin/products/page.tsx`
- `lilax/src/app/admin/orders/page.tsx`
- `lilax/src/app/globals.css`

**Step 5: Commit**

```bash
git add lilax/src/app/admin/_components/product-create-modal.tsx lilax/src/app/admin/_components/product-admin-table.tsx lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx lilax/src/app/admin/products/page.tsx lilax/src/app/admin/orders/page.tsx lilax/src/app/globals.css
git commit -m "feat(lilax): widen admin pages and move product create into modal"
```
