# Forge AI Business Foundry - Frontend Design System & Architecture

## 1. Design Philosophy & Vision

**Brand Identity:**
- **Modern, Minimalist, Professional** - Clean lines, purposeful whitespace, sophisticated typography
- **AI-Powered Aesthetic** - Subtle gradients, animated elements reflecting machine intelligence
- **Trust & Transparency** - Clear information hierarchy, obvious CTAs, accessible design

**Color Palette:**
- **Primary:** Deep Blue (#0F172A) - Trust, professionalism, intelligence
- **Accent:** Electric Purple (#8B5CF6) - Innovation, AI, future-forward
- **Success:** Emerald Green (#10B981) - Growth, positive outcomes
- **Warning:** Amber (#F59E0B) - Attention, important information
- **Error:** Ruby Red (#EF4444) - Errors, critical issues
- **Neutral:** Gray Scale (#F3F4F6 to #1F2937) - Backgrounds, text, subtle elements

**Typography:**
- **Headlines:** Inter Bold (600-700) - Modern, geometric
- **Body:** Inter Regular (400-500) - Excellent readability
- **Code/Data:** JetBrains Mono - Technical, precise
- **Sizes:** 12px (xs), 14px (sm), 16px (base), 18px (lg), 20px (xl), 24px (2xl), 32px (3xl), 48px (4xl)

**Spacing System:**
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px
- Consistent padding/margins throughout

---

## 2. Frontend Stack

**Framework:** Next.js 15+ (React 19)
**Styling:** Tailwind CSS v4
**Component Library:** Shadcn/ui + Custom components
**State Management:** Zustand + React Query
**Authentication:** NextAuth.js v5
**Real-time:** Socket.io client
**API Client:** Axios + interceptors
**Form Handling:** React Hook Form + Zod validation
**Charts/Visualizations:** Recharts, Chart.js
**Animation:** Framer Motion
**Icons:** Heroicons + custom SVG
**Testing:** Vitest, React Testing Library
**Build/Deploy:** Vercel, Docker

---

## 3. Page Structure & Hierarchy

### Public Pages (No Authentication Required)
```
/ (Landing Page)
├── Hero Section
├── Features Overview
├── How It Works
├── Pricing Tiers
├── Testimonials
├── CTA Section
└── Footer

/about
├── Company Story
├── Team
├── Mission/Vision
├── Timeline
└── Contact

/features
├── Feature Cards Grid
├── Deep Dives per Feature
├── Use Cases
└── Comparison Matrix

/pricing
├── Pricing Tiers (3 levels)
├── Feature Comparison Table
├── FAQ
└── CTA to Signup

/blog
├── Blog List/Search
├── Category Filter
├── Search Functionality
└── Blog Post Detail

/docs
├── Documentation Sidebar
├── Getting Started
├── API Reference
├── SDK Documentation
└── Search

/contact
├── Contact Form
├── Support Channels
├── Social Links
└── Response Timeline
```

### Authenticated Pages (Requires Login)
```
/dashboard
├── Overview/Analytics
├── Quick Actions
├── Recent Activity
└── Personalized Recommendations

/projects
├── Project List/Grid
├── Create Project Modal
├── Project Detail Page
├── Project Settings
└── Team Management

/agent-runtime
├── Agent Management
├── Agent Logs/Monitoring
├── Agent Configuration
├── Performance Metrics
└── Debugging Tools

/workspace
├── File Browser
├── Code Editor Integration
├── Collaboration Tools
├── Version Control
└── Deployment Status

/settings
├── Account Settings
├── Profile Management
├── API Keys
├── Billing/Subscription
├── Notifications
└── Security Settings

/documentation
├── In-app Documentation
├── API Browser
├── Sample Code
└── Integration Guides
```

---

## 4. Component Library Architecture

### Layout Components
```
├── MainLayout (public pages)
├── DashboardLayout (authenticated)
├── SidebarLayout (docs/settings)
├── ModalLayout (overlays)
└── ResponsiveContainer
```

### Navigation Components
```
├── Header/Navbar
│   ├── Logo
│   ├── Nav Links
│   ├── Auth Buttons
│   └── Mobile Menu
├── Sidebar
│   ├── Nav Items
│   ├── Collapsible Groups
│   └── User Profile
├── Breadcrumbs
├── Tabs
└── Step Indicators
```

### Form Components
```
├── Input (text, email, password, number)
├── Textarea
├── Select/Dropdown
├── Checkbox/Radio
├── Toggle Switch
├── Date/Time Picker
├── File Upload
├── Form Validation Messages
└── FormBuilder (for dynamic forms)
```

### Data Display Components
```
├── Table (sortable, filterable, paginated)
├── Card (single item container)
├── List (ordered/unordered)
├── Tree View
├── Timeline
├── Kanban Board
├── DataGrid (advanced table)
└── Virtualized Lists
```

### Feedback Components
```
├── Alert (success, error, warning, info)
├── Toast Notifications
├── Loading Skeleton
├── Spinner
├── Progress Bar
├── Badge
├── Tooltip
└── Popover
```

### Interactive Components
```
├── Button (primary, secondary, outline, ghost, danger)
├── Dropdown Menu
├── Command Palette (Cmd+K)
├── Search Box
├── Filter Panel
├── Pagination
├── Modal Dialog
├── Drawer/Slide-out Panel
└── Popover Menu
```

### Specialized Components
```
├── Code Editor (Monaco or Ace)
├── Markdown Viewer/Editor
├── JSON Viewer
├── Terminal/Console
├── Log Viewer
├── Chart Components
├── Map Integration
└── Video Player
```

---

## 5. Page Designs (Detailed Layouts)

### Landing Page (`/`)
**Sections:**
1. **Hero Section**
   - Eye-catching headline: "Your AI Infrastructure, Fully Autonomous"
   - Subheadline with value prop
   - CTA buttons (Get Started, View Demo)
   - Hero image/animation (construction AI visualization)
   - Scroll indicator

2. **Features Overview**
   - 6 feature cards in 3-column grid
   - Icon, title, description per card
   - Subtle hover animations
   - "Learn More" links

3. **How It Works**
   - 5-step process visualization
   - Numbered steps with descriptions
   - Flow diagram or connected steps
   - Use animated arrows/connectors

4. **Pricing Section**
   - 3 pricing tiers (Starter, Professional, Enterprise)
   - Feature comparison checkmarks
   - Highlighted recommended tier
   - Monthly/Yearly toggle

5. **Testimonials**
   - 3-4 customer testimonials
   - Avatar, name, role, company
   - Star ratings
   - Carousel or grid layout

6. **CTA Banner**
   - Urgent message about early access
   - Email signup form
   - Social proof (early adopters count)

7. **Footer**
   - Company info
   - Quick links by category
   - Newsletter signup
   - Social media icons
   - Legal links

### Dashboard (`/dashboard`)
**Layout:** Sidebar + Main Content Area
**Sections:**
1. **Top Bar**
   - Breadcrumb navigation
   - User profile dropdown
   - Notifications bell
   - Search bar

2. **Main Grid**
   - **Left Sidebar:** Navigation menu
   - **Top Cards:** Key metrics (Active Projects, Tasks, Revenue, Status)
   - **Charts Row:** Activity chart, Performance chart
   - **Activity Feed:** Recent actions, updates
   - **Quick Actions:** Shortcuts to common tasks

3. **Responsive Behavior:**
   - Sidebar collapses on mobile
   - Cards stack vertically
   - Charts adapt to width

### Project Detail Page (`/projects/:id`)
**Layout:** Full-width with tabs
**Sections:**
1. **Header**
   - Project title, status badge
   - Action buttons (Edit, Deploy, Delete, Share)
   - Project metadata (created date, owner, team)

2. **Tabs:**
   - **Overview:** Project stats, recent activity
   - **Files:** File browser/editor integration
   - **Agents:** Deployed agents, logs, monitoring
   - **Deployments:** Deployment history, rollback options
   - **Settings:** Project configuration
   - **Team:** Team members, permissions
   - **Activity:** Full activity log

3. **Right Sidebar (Sticky):**
   - Project status indicator
   - Quick stats
   - AI recommendations
   - Help/documentation links

---

## 6. Design Patterns & Standards

### Interaction Patterns
- **Hover States:** Subtle elevation, color change, cursor pointer
- **Active States:** Bold color, background highlight
- **Disabled States:** Reduced opacity (50%), cursor not-allowed
- **Loading States:** Skeleton screens, spinners, pulsing animations
- **Empty States:** Illustrated placeholder, helpful message, CTA
- **Error States:** Red border, error message, suggestion to fix

### Animations
- **Page Transitions:** Fade in/out (200ms)
- **Component Entrance:** Slide up or fade in (300ms)
- **Hover Effects:** Scale (1.05) or color shift (150ms)
- **Loading:** Smooth spinner rotation
- **Toast/Notifications:** Slide in from edge, slide out on dismiss

### Responsive Design
- **Mobile (320px - 640px):** Single column, full-width inputs, stacked cards
- **Tablet (641px - 1024px):** 2-column layout, adjusted padding
- **Desktop (1025px+):** Full multi-column layouts, optimal spacing
- **Large Screens (1400px+):** Wider content containers, dual panels

### Accessibility (WCAG 2.1 AA)
- Semantic HTML (proper heading hierarchy, landmarks)
- ARIA labels for interactive components
- Keyboard navigation support (Tab, Enter, Escape)
- Color contrast ratio ≥ 4.5:1
- Focus indicators visible on all interactive elements
- Alt text for all images
- Form labels associated with inputs
- Error messages linked to form fields

---

## 7. Routing & Navigation Structure

### Next.js App Router Organization
```
app/
├── (public)/
│   ├── page.tsx (landing)
│   ├── about/page.tsx
│   ├── features/page.tsx
│   ├── pricing/page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── docs/
│   │   ├── layout.tsx
│   │   └── [...slug]/page.tsx
│   ├── contact/page.tsx
│   └── layout.tsx
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── [id]/settings/page.tsx
│   ├── agent-runtime/page.tsx
│   ├── workspace/page.tsx
│   ├── settings/
│   │   ├── page.tsx
│   │   ├── account/page.tsx
│   │   ├── billing/page.tsx
│   │   └── api-keys/page.tsx
│   └── documentation/page.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── projects/route.ts
│   ├── projects/[id]/route.ts
│   ├── agents/route.ts
│   └── ...
└── layout.tsx (root)
```

---

## 8. State Management Strategy

### Zustand Stores
```typescript
// authStore: User authentication, session
// projectStore: Projects list, active project
// agentStore: Agents, active agent, logs
// uiStore: Theme, sidebar state, modals
// notificationStore: Toasts, alerts
```

### React Query (TanStack Query)
```typescript
// useQuery for data fetching (projects, agents, activity)
// useMutation for create/update/delete operations
// Automatic caching, refetching, background updates
```

---

## 9. Implementation Phases

**Phase 1: Foundation (Week 1-2)**
- Set up Next.js project structure
- Create design tokens (colors, typography, spacing)
- Build core layout components
- Implement authentication flow

**Phase 2: Public Pages (Week 2-3)**
- Landing page with all sections
- About, Features, Pricing pages
- Blog setup with sample posts
- Documentation structure

**Phase 3: Dashboard & Core Features (Week 3-4)**
- Dashboard layout and overview
- Projects CRUD functionality
- Agent management interface
- Basic monitoring/logging

**Phase 4: Advanced Features (Week 4-5)**
- Code editor integration
- Real-time collaboration
- Advanced monitoring/analytics
- Team management

**Phase 5: Polish & Launch (Week 5-6)**
- Performance optimization
- E2E testing
- Accessibility audit
- Deploy to production

---

## 10. File & Folder Structure

```
forge-web-studio/
├── app/
│   ├── (public)/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── forms/
│   ├── data-display/
│   ├── feedback/
│   ├── interactive/
│   └── specialized/
├── hooks/
│   ├── useAuth.ts
│   ├── useProjects.ts
│   └── ...
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── validation.ts
│   └── utils.ts
├── stores/
│   ├── auth.ts
│   ├── projects.ts
│   └── ...
├── styles/
│   ├── globals.css
│   └── variables.css
├── types/
│   ├── index.ts
│   ├── auth.ts
│   └── ...
├── public/
│   ├── icons/
│   ├── images/
│   └── ...
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── package.json
```

---

## 11. Key Design Tokens (Tailwind Config)

```typescript
colors: {
  primary: '#0F172A',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  neutral: { /* gray scale */ }
}

spacing: {
  /* 4px base unit scale */
}

typography: {
  fontFamily: {
    sans: ['Inter'],
    mono: ['JetBrains Mono']
  }
}

// Responsive breakpoints
// Mobile first: sm, md, lg, xl, 2xl
```

---

## 12. Component Template Examples

**Button Component**
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant: ButtonVariant;
  size: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  children: ReactNode;
}
```

**Card Component**
```typescript
interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  hoverable?: boolean;
  interactive?: boolean;
}
```

---

## 13. Future Enhancements

- Dark mode toggle
- Multi-language support (i18n)
- Advanced analytics dashboard
- Custom theme builder
- Mobile app (React Native)
- Progressive Web App (PWA)
- Offline support
- Advanced search/filtering
- Custom integrations marketplace
- AI-powered UI recommendations

