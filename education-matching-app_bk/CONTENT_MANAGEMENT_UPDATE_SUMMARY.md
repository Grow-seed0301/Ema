# Content Management Screen Update - Implementation Summary

## Overview
This implementation modernizes the content management system by reorganizing the UI structure and adding new features for FAQ management and administrator email settings.

## Changes Made

### 1. Database Schema Updates (`backend/shared/schema.ts`)

#### New Tables Added:

**FAQs Table (`faqs`)**
```typescript
- id: varchar (UUID primary key)
- question: text (required)
- answer: text (required)
- category: varchar (default: "すべて")
  Categories: すべて, アカウント, レッスン予約, 料金, 先生の探し方, トラブル
- sortOrder: integer (default: 0)
- isActive: boolean (default: true)
- createdAt: timestamp
- updatedAt: timestamp
```

**Admin Settings Table (`admin_settings`)**
```typescript
- id: varchar (singleton: 'admin_settings_singleton')
- adminEmail: varchar (required)
- notifyOnNewInquiry: boolean (default: true)
- updatedAt: timestamp
```

### 2. Backend API Routes

#### Admin Routes (`backend/server/routes/admin.ts`)

**FAQ Management Endpoints:**
- `GET /api/admin/faqs` - List all FAQs (with optional filters: category, isActive)
- `GET /api/admin/faqs/:id` - Get single FAQ by ID
- `POST /api/admin/faqs` - Create new FAQ
- `PATCH /api/admin/faqs/:id` - Update existing FAQ
- `DELETE /api/admin/faqs/:id` - Delete FAQ

**Admin Settings Endpoints:**
- `GET /api/admin/admin-settings` - Get admin settings
- `PATCH /api/admin/admin-settings` - Update admin settings (email, notifications)

#### Public Routes (`backend/server/routes/index.ts`)

**Public FAQ Endpoint:**
- `GET /api/faqs?category={category}` - Get active FAQs for public display (used by mobile app)

### 3. Storage Layer (`backend/server/storage.ts`)

Implemented methods:
- `getAllFaqs(params?: { category?: string; isActive?: boolean })` - Get FAQs with filters
- `getFaq(id: string)` - Get single FAQ
- `createFaq(data: InsertFaq)` - Create FAQ
- `updateFaq(id: string, data: UpdateFaq)` - Update FAQ
- `deleteFaq(id: string)` - Delete FAQ
- `getAdminSettings()` - Get admin settings (auto-creates if not exists)
- `updateAdminSettings(data: UpdateAdminSettings)` - Update admin settings

### 4. Admin Panel UI Changes

#### Sidebar Navigation (`backend/client/src/components/app-sidebar.tsx`)
- Converted "コンテンツ管理" from a single menu item to a collapsible menu with sub-items
- Added icons and proper navigation for each sub-item
- Uses Radix UI Collapsible component for smooth expand/collapse animation

**Sub-menu Structure:**
```
コンテンツ管理 (Collapsible)
├── 利用規約 (Terms of Service)
├── プライバシーポリシー (Privacy Policy)
├── 管理者メール (Administrator Email)
└── よくある質問 (FAQs)
```

#### New Admin Pages Created:

1. **Content Management Overview** (`content-management.tsx`)
   - Landing page with cards for each content type
   - Quick navigation to specific management screens

2. **Terms of Service Page** (`content-terms.tsx`)
   - Edit terms of service title and HTML content
   - Live preview of HTML content
   - Shows last update timestamp

3. **Privacy Policy Page** (`content-privacy.tsx`)
   - Edit privacy policy title and HTML content
   - Live preview of HTML content
   - Shows last update timestamp

4. **Administrator Email Page** (`content-admin-email.tsx`)
   - Configure admin email for notifications
   - Toggle inquiry notification setting
   - Email validation

5. **FAQ Management Page** (`content-faqs.tsx`)
   - List all FAQs in a table
   - Create, edit, delete operations via modal dialog
   - Reorder FAQs using up/down buttons
   - Filter by category and active status
   - Shows FAQ status (active/inactive)

#### Routing (`backend/client/src/App.tsx`)
Added routes:
- `/content` - Overview page
- `/content/terms` - Terms of Service
- `/content/privacy` - Privacy Policy
- `/content/admin-email` - Admin Email Settings
- `/content/faqs` - FAQ Management

### 5. Mobile App Updates

#### FAQ Screen (`screens/FAQScreen.tsx`)
- Replaced hardcoded FAQ data with API calls to `/api/faqs`
- Fetches FAQs dynamically based on selected category
- Implements search functionality (filters by question/answer)
- Added loading state with ActivityIndicator
- Added error state with retry capability
- Added empty state for no results
- Category filtering works seamlessly with backend

**Features:**
- Real-time category filtering
- Keyword search across questions and answers
- Accordion-style expandable FAQ items
- Smooth animations
- Responsive design

## Migration Steps

### To Deploy These Changes:

1. **Database Migration:**
   ```bash
   cd backend
   npm run db:push
   ```
   This will create the `faqs` and `admin_settings` tables in the database.

2. **Verify Schema:**
   Check that the new tables exist in your database:
   - `faqs` - with all columns
   - `admin_settings` - singleton record

3. **Initial Data (Optional):**
   You can manually insert some FAQs or use the admin panel to create them.

4. **Test Admin Panel:**
   - Log into admin panel
   - Navigate to コンテンツ管理 menu
   - Verify collapsible menu works
   - Test each sub-page:
     - Create/edit Terms of Service
     - Create/edit Privacy Policy
     - Set administrator email
     - Create/edit/delete FAQs

5. **Test Mobile App:**
   - Open FAQ screen in mobile app
   - Verify FAQs load from API
   - Test category filtering
   - Test search functionality

## API Usage Examples

### Create FAQ
```javascript
POST /api/admin/faqs
{
  "question": "アカウントの作成方法は？",
  "answer": "アプリをダウンロードして...",
  "category": "アカウント",
  "sortOrder": 1,
  "isActive": true
}
```

### Get Active FAQs (Public)
```javascript
GET /api/faqs?category=アカウント
// Returns only active FAQs in アカウント category
```

### Update Admin Settings
```javascript
PATCH /api/admin/admin-settings
{
  "adminEmail": "admin@example.com",
  "notifyOnNewInquiry": true
}
```

## Technical Notes

1. **Singleton Pattern**: Both `admin_settings` and the existing `terms_of_service`/`privacy_policy` use singleton pattern (fixed ID) to ensure only one record exists.

2. **Soft Ordering**: FAQs use `sortOrder` field for manual ordering. The admin panel provides up/down buttons to adjust order.

3. **Category Filtering**: FAQ categories match exactly between backend and mobile app for consistency.

4. **Security**: All admin endpoints require authentication and admin role check via `isAuthenticated` and `isAdmin` middleware.

5. **API Response Format**: All endpoints follow the standardized response format using `sendSuccess` and `sendError` utilities.

## Future Enhancements

1. **Email Notifications**: Implement actual email sending when new inquiries are created (currently just stores the setting)

2. **Rich Text Editor**: Replace plain textarea with a WYSIWYG editor for Terms/Privacy/FAQ content

3. **FAQ Analytics**: Track which FAQs are most viewed/helpful

4. **Multi-language Support**: Add language field to support multiple languages

5. **FAQ Categories Management**: Allow admins to create/edit custom FAQ categories

6. **Bulk Operations**: Add ability to bulk activate/deactivate or delete FAQs

7. **FAQ Search on Admin**: Add search functionality in admin FAQ list

8. **Preview Before Save**: Add preview mode for Terms/Privacy policy changes

## Files Modified/Created

### Created:
- `backend/client/src/pages/content-terms.tsx`
- `backend/client/src/pages/content-privacy.tsx`
- `backend/client/src/pages/content-admin-email.tsx`
- `backend/client/src/pages/content-faqs.tsx`
- `backend/server/routes/public-content.ts`

### Modified:
- `backend/shared/schema.ts` - Added FAQs and Admin Settings tables
- `backend/server/storage.ts` - Added FAQ and Admin Settings methods
- `backend/server/routes/admin.ts` - Added FAQ and Admin Settings routes
- `backend/server/routes/index.ts` - Added public FAQ endpoint
- `backend/client/src/components/app-sidebar.tsx` - Made content menu collapsible
- `backend/client/src/App.tsx` - Added new routes
- `backend/client/src/pages/content-management.tsx` - Converted to overview page
- `screens/FAQScreen.tsx` - Updated to fetch from API

## Testing Checklist

- [ ] Build succeeds without errors
- [ ] Database migration completes successfully
- [ ] Admin can log in and access content management menu
- [ ] Collapsible menu expands/collapses correctly
- [ ] Terms of Service page loads and saves correctly
- [ ] Privacy Policy page loads and saves correctly
- [ ] Admin Email page loads and saves correctly
- [ ] FAQ management page CRUD operations work
- [ ] FAQ reordering (up/down) works correctly
- [ ] Mobile app FAQ screen loads FAQs from API
- [ ] Category filtering works in mobile app
- [ ] Search works in mobile app
- [ ] Loading and error states display correctly

## Deployment Notes

1. Ensure DATABASE_URL environment variable is set before running migration
2. No breaking changes to existing functionality
3. Backward compatible - existing terms and privacy endpoints still work
4. New routes are additive, no routes removed
