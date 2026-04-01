# Lilax Admin Full-Width Tables + Add Product Modal Design

## Context

Lilax admin already uses table-first summaries for `Products` and `Orders`, but the `Products` page still spends a fixed left column on the inline create form. That layout caps the usable table width and makes the page feel visually narrower than `Orders`, even though both pages are now table-driven. The requested behavior is:

- move `Add product` into a modal
- keep the page focused on stat cards plus the table/detail area
- make both `Products` and `Orders` use the full admin content width

## Current State

### Products

File: `lilax/src/app/admin/products/page.tsx`

- renders stat cards
- renders `.admin-grid`
- left column is an inline create form inside `.admin-panel`
- right column is the current product table/detail area

This creates a permanent `360px` layout tax because `lilax/src/app/globals.css` defines:

```css
.admin-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 18px;
}
```

### Orders

File: `lilax/src/app/admin/orders/page.tsx`

- already renders a single table/detail area
- still inherits `.admin-page { max-width: 1200px; }`, so it is narrower than requested

## Approved UX

### Products page

- keep the existing stat cards
- replace the inline create panel with a header action button: `Add Product`
- clicking `Add Product` opens a modal dialog containing the existing create-product form
- keep the existing `ProductAdminTable` below the stat cards
- keep the existing row-level `View`, `Edit`, `Delete` actions
- keep the existing selected detail card behavior below the table

### Orders page

- keep the current row-level `View`, `Edit`, `Delete` actions
- keep the current selected detail panel behavior
- expand page width to match the new products layout

### Shared layout

- both `Products` and `Orders` should use a wider content container
- tables remain horizontally scrollable on smaller screens
- mobile layout keeps stacking behavior from the current responsive rules

## Proposed Technical Approach

### 1. Add a dedicated client modal for product creation

Create:

- `lilax/src/app/admin/_components/product-create-modal.tsx`

Responsibilities:

- manage open/close state for the add-product dialog
- render a trigger button in the page header
- render the existing create form inside a modal using the same server action: `createProduct`
- reuse the existing overlay look by building on the storefront modal pattern already present in `globals.css` (`.overlay-shell`, `.checkout-modal`)

### 2. Simplify the products page shell

Modify:

- `lilax/src/app/admin/products/page.tsx`

Changes:

- remove the left-side inline add form block
- add `ProductCreateModal` in the page heading action area
- replace the `.admin-grid` wrapper with a single full-width flow container

### 3. Keep the product table, update empty-state language

Modify:

- `lilax/src/app/admin/_components/product-admin-table.tsx`

Changes:

- keep current row actions and detail panel logic
- update the empty-state copy so it no longer references the removed inline add form
- keep the detail card rendered under the table

### 4. Expand the shared admin layout

Modify:

- `lilax/src/app/globals.css`

Changes:

- increase or remove the `.admin-page` width cap
- add a full-width admin content class for the pages that need it
- add modal-specific admin styles for the add-product dialog
- keep `.admin-table-scroll` overflow behavior
- preserve current responsive breakpoints

### 5. Keep orders structurally simple

Modify:

- `lilax/src/app/admin/orders/page.tsx`

Changes:

- only switch it to the new full-width content class
- leave order table/detail logic in `OrderAdminTable` unchanged unless needed for spacing consistency

## Testing Strategy

Primary automated coverage:

- `lilax/src/app/admin/_components/__tests__/admin-table-smoke.test.tsx`

Add assertions for:

- `Add Product` trigger renders on products page helper/modal component
- clicking the trigger opens the dialog
- the dialog contains expected fields like `Product name`, `Slug`, `Category`
- closing the dialog hides the form again

Manual verification:

- `Products` page shows stat cards + header action + table/detail only
- `Orders` page stretches to the same width
- `Add Product` modal is usable on desktop and mobile
- table remains scrollable on narrow screens

## Risks

### Risk: server action form inside a client modal

Mitigation:

- keep the form action pointing directly at `createProduct`
- keep the modal component client-side only for open/close state

### Risk: shared CSS changes affect storefront overlays

Mitigation:

- add admin-specific modal classes instead of changing `.checkout-modal` semantics globally
- reuse only the overlay structure where practical

### Risk: full-width container makes tables too wide on smaller laptops

Mitigation:

- keep `overflow-x: auto`
- preserve current responsive breakpoints

## Out of Scope

- changing `Orders` actions to modals
- adding pagination, search, or filters to admin tables
- changing the product edit/detail card into a modal
- changing server actions or Prisma models
