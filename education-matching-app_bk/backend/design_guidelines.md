# Design Guidelines: Education App Admin Dashboard

## Design Approach

**System-Based Approach** drawing from modern admin dashboards (Linear, Vercel, Stripe Dashboard) optimized for data-heavy interfaces with Japanese language support.

**Core Principles:**
- Information clarity over decoration
- Efficient data scanning and manipulation
- Consistent, predictable interactions
- Clean hierarchy for complex data structures

---

## Typography

**Font Families:**
- Primary: Inter (Latin text, UI elements)
- Japanese: Noto Sans JP (Japanese characters)
- Monospace: JetBrains Mono (IDs, codes, technical data)

**Type Scale:**
- Headings: text-2xl (page titles), text-xl (section headers), text-lg (card headers)
- Body: text-base (default), text-sm (table cells, labels), text-xs (metadata, timestamps)
- Weight: font-medium (headings), font-normal (body), font-semibold (emphasis)

---

## Layout System

**Spacing Units:** Standardize on Tailwind units: 2, 3, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Table cells: px-4 py-3
- Form fields: space-y-4

**Grid Structure:**
- Sidebar: fixed w-64 (navigation)
- Main content: flex-1 with max-w-7xl container
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Data tables: full width with horizontal scroll on mobile

---

## Component Library

### Navigation
**Sidebar (Fixed Left):**
- Logo/brand at top (h-16)
- Grouped menu items (Dashboard, Users, Teachers, Lessons, Payments, Plans, Settings)
- Active state: subtle background, left border accent
- Icon + label for each item (Heroicons)
- Collapse state for mobile (hamburger menu)

**Top Bar:**
- Breadcrumb navigation (Home / Users / Edit)
- Search bar (global, w-96)
- User profile dropdown (avatar + name)
- Notifications icon with badge

### Data Tables
**Structure:**
- Sticky header row
- Alternating row backgrounds for readability
- Hover state on rows
- Action buttons in last column (Edit, Delete, View)
- Pagination footer (showing "1-20 of 156 items")
- Per-page selector (20, 50, 100)

**Features:**
- Sortable columns (click header, show arrow indicator)
- Multi-select checkboxes (bulk actions)
- Inline filters (dropdown menus in header)
- Row expansion for details (optional, for complex data)

### Forms
**Layout:**
- Two-column on desktop (grid-cols-2 gap-6)
- Single column on mobile
- Labels above inputs (font-medium text-sm)
- Helper text below (text-xs text-gray-500)
- Required field indicator (red asterisk)

**Input Types:**
- Text inputs: border, rounded-lg, p-3
- Select dropdowns: custom styled with chevron icon
- Date pickers: calendar popup
- File upload: drag-drop zone with preview
- Rich text editor: for bio/descriptions (Tiptap or similar)

**Validation:**
- Inline error messages (text-red-600 text-sm)
- Success states (green border)
- Disabled states (opacity-50)

### Dashboard Cards
**Stats Cards (4-column grid):**
- Icon (top-left, large, colored background circle)
- Metric value (text-3xl font-bold)
- Metric label (text-sm text-gray-600)
- Change indicator (+12% with up/down arrow, green/red)

**Chart Cards:**
- Card header: title + date range selector
- Chart area: 300px height minimum
- Use Chart.js or Recharts for line/bar/pie charts
- Responsive tooltips on hover

### Modals & Dialogs
- Overlay: backdrop-blur-sm bg-black/50
- Modal: max-w-2xl, rounded-xl, shadow-2xl
- Header: title + close button (X icon)
- Body: scrollable if content exceeds viewport
- Footer: action buttons (Cancel, Save/Confirm)

### Buttons
**Variants:**
- Primary: solid background, white text (for main actions)
- Secondary: border, transparent background (for cancel/back)
- Danger: red background (for delete/destructive actions)
- Icon-only: for table actions (Edit, Delete icons)

**Sizes:** px-4 py-2 (default), px-6 py-3 (large), px-3 py-1.5 (small)

### Badges & Status
- Pill shape (rounded-full px-3 py-1)
- User roles: Student (blue), Teacher (purple), Admin (gray)
- Payment status: Paid (green), Pending (yellow), Failed (red)
- Lesson status: Scheduled (blue), Completed (green), Cancelled (gray)

### Filters & Search
**Filter Panel (collapsible):**
- Toggle button "Show Filters"
- Expands to show filter options (subjects, price range, rating, date range)
- Apply + Reset buttons
- Active filter tags (removable chips)

**Search:**
- Debounced input (300ms)
- Search icon left, clear icon right
- Dropdown suggestions (if applicable)

---

## Page Layouts

### Dashboard Overview
- 4 stat cards (Total Users, Active Teachers, Lessons This Month, Revenue)
- Revenue chart (line graph, last 30 days)
- Recent activities table (10 items)
- Quick actions panel (Add User, Add Teacher, Create Lesson)

### Management Pages (Users, Teachers, Lessons, Payments)
- Page header: title + "Add New" button (top-right)
- Filter bar (search + filter toggles)
- Data table with pagination
- Bulk action toolbar (appears when items selected)

### Edit/Create Forms
- Breadcrumb navigation
- Form title
- Tabbed sections for complex forms (Profile, Settings, Permissions)
- Sticky footer with Cancel/Save buttons
- Auto-save indicator (optional)

### Teacher Detail Page
- Profile header: avatar, name, rating, subjects
- Stats row: Total lessons, Rating, Students taught
- Tabbed content: Schedule, Reviews, Earnings
- Availability calendar

### User Profile Page
- User info card (avatar, name, email, role, plan)
- Plan details card (remaining lessons, expiry date)
- Learning progress (goals, achievements)
- Lesson history table

---

## Images

**Avatar Placeholders:**
- Use colored circles with initials when no avatar uploaded
- Generate consistent colors from user ID/name

**Empty States:**
- Simple SVG illustrations for empty tables/lists
- "No data yet" message with call-to-action button

**No large hero images** - This is a functional admin dashboard focused on efficiency, not marketing.

---

## Responsive Behavior

**Mobile (<768px):**
- Sidebar collapses to hamburger menu
- Tables scroll horizontally or switch to card view
- Dashboard cards stack vertically (grid-cols-1)
- Forms switch to single column

**Tablet (768px-1024px):**
- Sidebar always visible
- Dashboard cards: 2 columns
- Tables: reduced columns, hide non-essential data

**Desktop (>1024px):**
- Full layout with all features
- Dashboard cards: 4 columns
- Tables: all columns visible