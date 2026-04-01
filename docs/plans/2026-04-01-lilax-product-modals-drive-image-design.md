# Lilax Product Modals and Google Drive Image Rendering Design

## Context

Lilax admin currently uses:

- a table for product rows
- a modal for `Add Product`
- an inline below-table detail panel for `View` and `Edit`

The requested change is to remove the below-table product detail area entirely and move both `View` and `Edit` into modals, so the products page stays focused on the table. The user also reported that Google Drive image links such as:

`https://drive.google.com/file/d/1GsNE4UXnF0yvTydKOe1YKCItIhwJp-Ro/view?usp=sharing`

do not render in the admin preview.

## Root Cause: Google Drive Preview

The current product image fields are rendered directly through `next/image`, but the stored values may be Google Drive share/viewer URLs rather than direct image URLs. `next/image` can render remote images from `drive.google.com`, but the input URL still has to point to image content, not a Drive viewer page.

Current behavior:

- admin thumbnail uses `product.imageUrl` directly
- admin preview uses `selectedProduct.imageUrl` directly
- gallery thumbnails use raw `gallery` items directly
- create/update actions store the submitted URL exactly as entered

This means a link ending in `/file/d/.../view?usp=sharing` is preserved as-is and passed to `next/image`, which does not display the actual file contents.

## Approved UX

### Products page

- page remains table-first
- no below-table product detail panel remains
- `Add Product` stays modal-based
- `View` opens a read-only modal
- `Edit` opens an editable modal
- `Delete` remains inline in the action row

### Success feedback

- after creating a product, show a browser alert such as `Product added.`
- after updating a product, show a browser alert such as `Product updated.`
- after save, the modal is closed

Given the current server-action redirect flow, modal closing happens naturally after redirect because client state resets. The alert should be triggered from client code after the redirected page loads and inspects the success message.

### Image rendering

- product images should render when a Google Drive share link is entered
- this should work for:
  - product table thumbnail
  - product `View` modal preview
  - gallery thumbnails in the product modal
  - landing page product cards
  - flash sale cards on the landing page
  - landing page quick-view images and thumbnails

## Approaches Considered

### 1. Modal-only product interactions + shared URL normalizer

- create a reusable image URL normalization helper
- use modals for `Add`, `View`, and `Edit`
- remove the current inline panel
- show success alerts after redirect

Pros:

- matches the requested UX exactly
- fixes Drive links at the correct abstraction layer
- keeps the products page cleaner and wider
- normalization can also benefit storefront image rendering

Cons:

- touches several files together
- requires one small client-side success-alert effect

### 2. Modal-only UI, but fix Drive images only in admin rendering

- keep raw DB values
- transform only inside the admin table/view

Pros:

- slightly smaller change

Cons:

- landing page and quick-view images can still break on the same Drive URLs
- normalization logic becomes duplicated or inconsistent

### 3. Save-time normalization only

- normalize the URL only in `createProduct` and `updateProduct`
- leave current rendering code mostly unchanged

Pros:

- simple persistence behavior

Cons:

- existing records with old Drive links still remain broken
- rendering code still trusts raw inputs too much

## Recommendation

Use **Approach 1**.

It solves both requests cleanly:

- the page becomes table + modal based
- the Drive image issue is fixed both for new submissions and already-saved products if rendering also normalizes at read time

## Proposed Technical Design

### 1. Add a shared image URL normalization helper

Create:

- `lilax/src/lib/image-url.ts`

Responsibilities:

- detect Google Drive share/view URLs
- extract the file id
- convert to a renderable URL such as:

`https://drive.google.com/uc?export=view&id=<fileId>`

- expose a small helper API such as:
  - `normalizeImageUrl(url: string): string`
  - `normalizeImageList(urls: string[]): string[]`

This helper should be pure and reusable from both server and client files.

### 2. Normalize on save and on render

Modify:

- `lilax/src/app/admin/actions.ts`
- `lilax/src/app/admin/_components/product-admin-table.tsx`
- `lilax/src/app/page.tsx`
- any storefront component that renders `product.imageUrl` or `gallery`

Behavior:

- on create/update, normalize `imageUrl`
- normalize every gallery entry
- when rendering existing DB values, normalize again defensively so older saved records still display

### 3. Replace inline product panel with product modals

Modify:

- `lilax/src/app/admin/_components/product-admin-table.tsx`

Changes:

- keep row actions in the table
- replace current `panel` state and below-table section with a modal state
- `View` opens a read-only modal
- `Edit` opens a form modal
- remove the persistent empty-detail card that says `Select a product`

### 4. Add a client-side success alert bridge

Likely create:

- `lilax/src/app/admin/_components/admin-flash-alert.tsx`

or extend:

- `product-create-modal.tsx`

Recommended behavior:

- read the success `type/text` from the page props
- trigger `window.alert(text)` only for product create/update success events
- keep the existing inline flash message visible unless explicitly removed later

This avoids changing the working server-action redirect pattern.

### 5. Keep Add Product modal behavior consistent

Modify:

- `lilax/src/app/admin/products/page.tsx`
- `lilax/src/app/admin/_components/product-create-modal.tsx`

Changes:

- pass current flash info if needed for success alert logic
- keep `Add Product` modal as the creation entry point

## Testing Strategy

### Unit/component tests

Modify:

- `lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx`

Add tests for:

- `View` opens a modal dialog instead of an inline section
- `Edit` opens a modal dialog instead of an inline section
- closing the modal removes the dialog
- no inline `Product overview` or `Edit product` section is rendered before action
- existing empty-state copy still works

Create:

- `lilax/src/lib/image-url.test.ts`

Add tests for:

- raw URL stays unchanged when not a Drive link
- Drive `/file/d/.../view` URL converts correctly
- Drive `?id=...` URL converts correctly
- list normalization removes blanks and normalizes each entry if needed

### Verification

- `npm test`
- `npm run build`

Manual checks:

- add a product with a Google Drive image URL
- confirm thumbnail renders in products table
- confirm `View` modal renders main image and gallery thumbnails
- confirm `Edit` modal renders the normalized image preview after save
- confirm alert appears after create/update and modal is closed

## Risks

### Alert repeats on refresh

Because redirects keep `type/text` in the query string, the browser alert could appear again on refresh if we trigger directly from those params each time.

Mitigation:

- only fire the alert once using a client-side `sessionStorage` key tied to the current query text, or
- clear the query string after the alert using `history.replaceState`

### Drive files may not be public

Even normalized Drive URLs will fail if the file is not shared publicly.

Mitigation:

- keep the renderer fix
- document that Drive files must be accessible to anyone with the link

### View/edit modal duplication

The view and edit modals share much of the same product context.

Mitigation:

- use one modal state object with mode + selected product
- extract small helpers for repeated sections where needed

## Out of Scope

- redesigning order modals
- adding image upload support
- replacing alerts with a custom toast system
- changing Prisma schema
