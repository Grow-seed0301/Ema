# Education App Admin Dashboard

## Overview

This is an admin dashboard for an education platform, built to manage users, teachers, lessons, payments, and subscription plans. The application is designed as a full-stack TypeScript project with a React frontend and Express backend, targeting Japanese language education services with bilingual support.

The dashboard provides administrative capabilities including:
- User and teacher management with role-based access
- Lesson booking and scheduling oversight
- Payment tracking and subscription plan configuration
- Dashboard analytics with revenue and usage charts

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based architecture with shared components:
- Pages located in `client/src/pages/` (dashboard, users, teachers, lessons, payments, plans, settings)
- Reusable components in `client/src/components/` (data-table, stats-card, status-badge, search-filter)
- UI primitives in `client/src/components/ui/` (shadcn/ui components)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

API routes follow REST conventions under `/api/` prefix:
- Admin endpoints at `/api/admin/*` for dashboard stats, user management, etc.
- Auth endpoints at `/api/auth/*` for authentication flow

### Database Schema
Located in `shared/schema.ts` using Drizzle ORM:
- `users` - Student user table (role removed, now implicitly students)
- `teachers` - Teacher table (merged with teacher_profiles)
- `plans` - Subscription plan definitions
- `userSubscriptions` - User-to-plan relationships
- `bookings` - Lesson scheduling
- `reviews` - Teacher/lesson reviews
- `payments` - Transaction records
- `sessions` - Authentication session storage

### Authentication Flow
Uses email/password authentication with bcrypt:
- Fixed admin account only (no public registration)
- Session-based authentication with 7-day TTL stored in PostgreSQL
- **Admin accounts are stored in a separate `admins` table** (not in the `users` table)
- Session stores `adminId` for authenticated admins

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `admin123`

To create admin account, run: `npx tsx server/seed-admin.ts`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, required via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- Schema migrations managed via `drizzle-kit push`

### Authentication
- **Custom email/password auth**: bcrypt password hashing with PostgreSQL session storage
- Requires `DATABASE_URL` and `SESSION_SECRET` environment variables

### UI Framework
- **shadcn/ui**: Component library configured in `components.json`
- **Radix UI**: Accessible primitive components
- **Tailwind CSS**: Utility-first styling with custom design tokens

### Charts and Data Visualization
- **Recharts**: Used for dashboard analytics (line charts, bar charts)

### Build and Development
- **Vite**: Frontend development server and bundler
- **esbuild**: Production server bundling
- **tsx**: TypeScript execution for development

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `date-fns`: Date formatting and manipulation
- `zod`: Runtime validation for API inputs
- `drizzle-zod`: Zod schemas generated from Drizzle tables