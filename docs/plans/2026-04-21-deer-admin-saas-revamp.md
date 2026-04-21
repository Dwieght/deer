# Deer Admin SaaS Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the Deer Army admin into a compact SaaS-style dashboard with a stronger app shell, denser navigation, and shared table-first page chrome.

**Architecture:** Keep the current Next.js route structure intact and shift the redesign into shared dashboard primitives. Refactor the shell, sidebar, and global admin classes first so all admin routes inherit the new visual language, then patch the overview and product/order surfaces where the old public-site framing still leaks through.

**Tech Stack:** Next.js App Router, React server/client components, shared CSS in `app/globals.css`

---

### Task 1: Save design context and identify shared admin surfaces

**Files:**
- Confirm: `docs/plans/2026-04-21-deer-admin-saas-revamp-design.md`
- Confirm: `app/dashboard/layout.jsx`
- Confirm: `app/dashboard/sidebar.jsx`
- Confirm: `app/dashboard/sidebar-nav.jsx`
- Confirm: `app/dashboard/utils.js`
- Confirm: `app/globals.css`

**Step 1: Verify the shared admin entry points**

Check that the dashboard shell and table utilities flow through the shared files above so the redesign can be centralized.

**Step 2: Keep the route structure unchanged**

Do not change dashboard URLs. The revamp is layout/UI only.

### Task 2: Refactor the shell and sidebar

**Files:**
- Modify: `app/dashboard/layout.jsx`
- Modify: `app/dashboard/sidebar.jsx`
- Modify: `app/dashboard/sidebar-nav.jsx`

**Step 1: Rework the dashboard shell markup**

Introduce a clearer shell structure with a dedicated sidebar rail and a content panel wrapper.

**Step 2: Simplify sidebar brand/session treatment**

Reduce fandom-forward copy, keep only useful identity and account info, and make logout read like an app control.

**Step 3: Improve navigation grouping**

Split the nav into practical groups such as overview, community, commerce, and settings/admin.

### Task 3: Retheme shared admin primitives

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace warm dashboard shell styling**

Update `.dashboard-layout`, `.dashboard-sidebar`, `.dashboard-content`, `.dashboard-nav`, and related classes to neutral app-like surfaces and tighter spacing.

**Step 2: Retheme page headers and stats**

Update `.section`, `.section-header`, `.dashboard-grid`, `.stat-card`, `.stat-label`, `.stat-value`, and chart wrappers to match the compact SaaS direction.

**Step 3: Retheme table primitives**

Update `.table-toolbar`, `.table-search`, `.pagination`, `.table-wrapper`, `.dashboard-table`, `.table-actions`, `.table-cell-muted`, `.table-cell-truncate`, `.table-image`, and action/button states for denser, clearer data management.

**Step 4: Retheme modal/form primitives**

Update `.modal-overlay`, `.modal`, `.modal-header`, `.modal-body`, `.modal-card`, `.admin-form`, `.action-row`, and related classes so modals feel like clean admin dialogs instead of public-site overlays.

**Step 5: Preserve responsive behavior**

Ensure the admin remains usable at narrower widths by collapsing the shell layout cleanly and preserving table overflow behavior.

### Task 4: Patch pages where old public-site framing still leaks through

**Files:**
- Modify: `app/dashboard/page.jsx`
- Modify: `app/dashboard/products/page.jsx`
- Modify: `app/dashboard/orders/page.jsx`

**Step 1: Overview page**

Make the dashboard overview feel like an operations landing page with compact intro copy and operational stat/chart framing.

**Step 2: Products page**

Align the products header and table framing with the new shell so it reads like a proper catalog admin, not a themed content section.

**Step 3: Orders page**

Align the orders header and modal/table framing with the same pattern so commerce pages remain consistent.

### Task 5: Verify

**Files:**
- Review: `app/dashboard/layout.jsx`
- Review: `app/dashboard/sidebar.jsx`
- Review: `app/dashboard/sidebar-nav.jsx`
- Review: `app/dashboard/page.jsx`
- Review: `app/dashboard/products/page.jsx`
- Review: `app/dashboard/orders/page.jsx`
- Review: `app/globals.css`

**Step 1: Run build verification**

Run:

```bash
npm run build
```

Expected: build passes without introducing dashboard rendering or CSS-related failures.

**Step 2: Summarize residual risks**

Call out any admin routes that still inherit old public-site classes and may need a second pass.
