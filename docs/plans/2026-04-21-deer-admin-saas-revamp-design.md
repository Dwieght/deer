# Deer Admin SaaS Revamp Design

## Goal

Revamp the Deer Army admin so it feels like a compact, practical operations dashboard instead of a themed extension of the public fan site.

## Audience

- Primary: admins and moderators
- Secondary: community managers reviewing submissions and payments
- Tertiary: merch/order operators

## UX Direction

The admin should optimize for fast scanning, dense information presentation, and low-friction repeated actions. The interface should feel closer to a SaaS control panel than a fandom microsite.

## Visual Direction

- Light, soft, neutral-first surfaces
- White and near-white backgrounds with subtle tinted neutrals
- Orange reserved for alerts, warnings, destructive actions, and attention states
- Compact controls and utility-first spacing
- Persistent left sidebar that reads like an app shell
- Table-first page layouts with clear toolbars and secondary metadata

## Reference Qualities

The target feel matches the mipocket admin layout language:

- persistent sidebar
- dense but readable data tables
- compact filters and toolbars
- quiet surfaces
- practical hierarchy over decorative styling

This is a layout and interaction reference only, not a structural copy.

## Layout Principles

1. The admin shell should feel like a dedicated app.
2. Sidebar and content regions should have a clearer split.
3. Shared page headers should carry title, short description, and primary action cleanly.
4. Tables should become the dominant organizing unit for management screens.
5. Stat cards should be flatter, smaller, and operational rather than celebratory.

## Component Direction

### Sidebar

- reduce brand ornamentation
- make navigation denser and easier to scan
- group content management and commerce/admin tasks
- make session controls quieter and more app-like

### Page Header

- replace large editorial section framing with compact page chrome
- use small eyebrow/kicker text sparingly
- keep the primary action aligned with the table workflow

### Tables

- stronger header row contrast
- tighter row rhythm
- clearer muted metadata cells
- more deliberate action grouping
- hover and focus states should aid scanning, not decorate

### Modals

- cleaner shells with stronger structure
- more restrained padding and heading treatment
- better distinction between form content and summary content

### Forms

- compact label/input spacing
- predictable vertical rhythm
- quieter surfaces that support high information density

## Accessibility

Standard strong accessibility is required:

- visible keyboard focus states
- readable contrast
- no hover-only critical actions
- clear labels and helper copy
- low-motion behavior by default

## Scope

This revamp should focus on the shared dashboard shell and the most reused UI primitives first:

- dashboard layout shell
- sidebar
- nav
- page headers
- stats
- toolbars
- tables
- modals

Then patch the dashboard home and core commerce pages where the old public-site styling still leaks through.
