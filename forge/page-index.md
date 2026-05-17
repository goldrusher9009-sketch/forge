# Forge Frontend Pages - Complete Index

## Public Pages (Phase 4)
All public-facing pages have been created and are ready for integration into the Next.js app directory structure.

### Landing & Navigation
- **landing-page.tsx** - Main landing page with hero, features overview, pricing tiers, testimonials, and CTA
- **about-page.tsx** - Company story, mission/vision/values, team bios, statistics, and CTA

### Features & Documentation
- **features-detail-page.tsx** - Comprehensive feature list with 6 major features, modal detail view, comparison table
- **docs-page.tsx** - Documentation hub with 6 main sections (Getting Started, Core Concepts, API Reference, Integrations, Advanced, Troubleshooting), search, quick links
- **blog-page.tsx** - Blog listing with featured posts, category filtering, search, newsletter signup
- **contact-page.tsx** - Contact form with validation, contact cards, FAQ section

## Authenticated Pages (Phase 3)

### Dashboard & Projects
- **dashboard-page.tsx** - Main dashboard with agent stats, recent agents, performance metrics, quick actions
- **projects-page.tsx** - Projects list with grid/list view toggle, creation modal, detailed project cards

### Settings Subtabs
- **settings-account-page.tsx** - Profile info, theme preferences, notification settings
- **settings-billing-page.tsx** - Subscription management, payment methods, billing history, plan upgrades
- **settings-api-keys-page.tsx** - API key generation, scopes, management, revocation
- **settings-danger-zone-page.tsx** - Account deactivation, data export, workspace transfer, account deletion

### Agent Management
- **agent-runtime-page.tsx** - Agent runtime control, execution monitoring, logs, performance metrics
- **workspace-page.tsx** - Workspace overview, team members, roles/permissions, collaboration settings

## Design Tokens & Configuration
- **tailwind.config.ts** - Tailwind v4 configuration with custom design tokens (COLORS, SPACING, TYPOGRAPHY)
- **components-showcase.tsx** - Interactive component showcase for development and testing

## Integration Points

### File Structure (Next.js 15 App Directory)
```
app/
├── (public)/
│   ├── page.tsx              → landing-page.tsx
│   ├── about/page.tsx         → about-page.tsx
│   ├── features/page.tsx      → features-detail-page.tsx
│   ├── docs/page.tsx          → docs-page.tsx
│   ├── blog/page.tsx          → blog-page.tsx
│   └── contact/page.tsx       → contact-page.tsx
├── (auth)/
│   ├── dashboard/page.tsx     → dashboard-page.tsx
│   ├── projects/page.tsx      → projects-page.tsx
│   ├── agents/[id]/page.tsx   → agent-runtime-page.tsx
│   ├── workspace/page.tsx     → workspace-page.tsx
│   └── settings/
│       ├── account/page.tsx   → settings-account-page.tsx
│       ├── billing/page.tsx   → settings-billing-page.tsx
│       ├── api-keys/page.tsx  → settings-api-keys-page.tsx
│       └── danger-zone/page.tsx → settings-danger-zone-page.tsx
```

## Component Patterns

All pages follow consistent patterns:

1. **State Management**: React.useState with TypeScript interfaces
2. **Form Validation**: Real-time error checking with visual feedback
3. **Modals**: Reusable modal patterns with confirm/cancel actions
4. **Async Simulation**: 600-1000ms delays simulating API calls
5. **Design Tokens**: Uses Tailwind COLORS (blue-600, slate-900, etc.), SPACING (px-6, py-16, etc.), TYPOGRAPHY
6. **Responsive Grid**: Mobile-first with md:grid-cols-* breakpoints
7. **Interactive Elements**: Hover states, transitions, color-coded badges/status

## Sample Data

All pages include sample data:
- **Dashboard**: 5 agents with performance metrics
- **Projects**: 3 projects with different statuses
- **Billing**: 1 subscription, 2 payment methods, 3 invoices
- **API Keys**: 3 keys with different scopes
- **Blog**: 6 articles with categories and authors
- **Contact**: 3 contact methods, form validation, FAQ

## Next Steps (Phase 4)

1. Create _layout.tsx files for public and auth route groups
2. Integrate authentication with NextAuth.js v5
3. Set up API routes for form submissions (contact, newsletter, contact form)
4. Create middleware for route protection
5. Implement Zustand stores for global state
6. Set up React Query hooks for server data fetching
7. Add Socket.io for real-time features
8. Integrate code editor component for agent builder
9. Wire up actual API endpoints to replace sample data
