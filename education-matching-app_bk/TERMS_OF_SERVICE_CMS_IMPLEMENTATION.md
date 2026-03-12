# Terms of Service & Privacy Policy CMS Implementation

## Overview
This implementation provides a CMS for managing Terms of Service (利用規約) and Privacy Policy (プライバシーポリシー) with a simplified single-record approach where admins can only edit content (no create/delete functionality).

## What Was Implemented

### 1. Database Schema Changes
**File**: `backend/shared/schema.ts`

Changed from multi-version system to single-record approach:

**Terms of Service Table:**
- Fixed singleton ID: `'terms_of_service_singleton'`
- Fields: `id`, `title`, `content` (HTML), `updatedAt`
- Removed: `version`, `isActive`, `createdAt` (no longer needed)

**Privacy Policy Table:**
- Fixed singleton ID: `'privacy_policy_singleton'`  
- Same structure as Terms of Service

### 2. Backend Storage Layer
**File**: `backend/server/storage.ts`

Simplified methods:
- `getTermsOfService()`: Gets or auto-creates the singleton record
- `updateTermsOfService(data)`: Updates the singleton record
- `getPrivacyPolicy()`: Gets or auto-creates the singleton record
- `updatePrivacyPolicy(data)`: Updates the singleton record

Removed methods:
- ~~`getAllTermsOfService()`~~
- ~~`createTermsOfService()`~~
- ~~`deleteTermsOfService()`~~
- ~~`setActiveTermsOfService()`~~

### 3. Admin API Endpoints
**File**: `backend/server/routes/admin.ts`

**Terms of Service:**
- `GET /api/admin/terms-of-service`: Get the current terms
- `PATCH /api/admin/terms-of-service`: Update terms content

**Privacy Policy:**
- `GET /api/admin/privacy-policy`: Get the current privacy policy
- `PATCH /api/admin/privacy-policy`: Update privacy policy content

Removed endpoints:
- ~~`POST /api/admin/terms-of-service` (create)~~
- ~~`DELETE /api/admin/terms-of-service/:id` (delete)~~
- ~~`POST /api/admin/terms-of-service/:id/activate`~~
- ~~`GET /api/admin/terms-of-service/:id` (get by ID)~~

### 4. Public API Endpoints
**File**: `backend/server/routes/index.ts`

- `GET /api/terms-of-service`: Public endpoint for mobile app
- `GET /api/privacy-policy`: Public endpoint for mobile app

### 5. Admin Panel UI
**Files**: 
- `backend/client/src/pages/content-management.tsx`: New unified content management page
- `backend/client/src/App.tsx`: Updated route to `/content`
- `backend/client/src/components/app-sidebar.tsx`: Updated menu item

**Features:**
- Tabbed interface for Terms and Privacy Policy
- HTML editor with real-time preview
- Last updated timestamp display
- Save button for each document
- No create/delete UI (edit only)

### 6. Mobile App Integration
**Files**:
- `services/api.ts`: 
  - `getTermsOfService()`: Fetches from `/api/terms-of-service`
  - `getPrivacyPolicy()`: Fetches from `/api/privacy-policy`
- `screens/TermsOfServiceScreen.tsx`: Updated to fetch dynamic content
- `screens/PrivacyPolicyScreen.tsx`: Updated to fetch dynamic content

**Features:**
- Fetches content from API on screen load
- Renders HTML content with `react-native-render-html`
- Shows loading state while fetching
- Falls back to hardcoded content on error
- Displays last updated date
- Removed version display (no longer applicable)

## Key Differences from Previous Implementation

| Aspect | Previous (Multi-version) | New (Single-record) |
|--------|-------------------------|---------------------|
| Records | Multiple versions per document | Single record per document |
| ID | Random UUID | Fixed singleton ID |
| Create | ✅ Admin can create new versions | ❌ Record auto-created on first access |
| Edit | ✅ Edit any version | ✅ Edit the single record |
| Delete | ✅ Delete inactive versions | ❌ Cannot delete (always exists) |
| Activate/Deactivate | ✅ Switch between versions | ❌ Always active |
| Version tracking | ✅ Version field | ❌ No versioning |
| UI | List view with pagination | ❌ Single edit form per tab |

## Database Migration

The schema has changed significantly. To apply:

```bash
cd backend
npm run db:push
```

**Note**: This will create new tables. Existing `terms_of_service` data from the old schema will not be migrated automatically.

## Usage

### Admin Panel

1. Log in to admin panel
2. Navigate to "コンテンツ管理" (Content Management)
3. Select tab: "利用規約" or "プライバシーポリシー"
4. Edit title and HTML content
5. Preview in real-time
6. Click "保存" (Save) to update

### Mobile App

Users can view the content from:
- マイページ → 利用規約 (Terms of Service)
- マイページ → プライバシーポリシー (Privacy Policy)

Content is fetched dynamically and rendered as HTML.

## Technical Notes

1. **Singleton Pattern**: Both documents use fixed IDs to ensure only one record exists
2. **Auto-creation**: If no record exists, it's automatically created with default content
3. **HTML Content**: Admins can enter any valid HTML
4. **No Versioning**: Since there's always one active version, version tracking was removed
5. **Security**: All admin endpoints require authentication and admin role

## Testing Checklist

- [x] Admin can view Terms of Service
- [x] Admin can edit Terms of Service
- [x] Admin can view Privacy Policy  
- [x] Admin can edit Privacy Policy
- [x] Mobile app displays Terms of Service
- [x] Mobile app displays Privacy Policy
- [x] HTML content renders correctly
- [x] Last updated timestamp displays correctly
- [x] Cannot create or delete records (edit only)
