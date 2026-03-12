# Content Management Function - Technical Specification

## Overview
This document provides a comprehensive specification of the content management functionality in the Education Matching App. This specification can be used to replicate the same functionality in other systems.

## Purpose
Enable administrators to manage application content including Terms of Service, Privacy Policy, FAQs, and administrative email settings through a dedicated admin panel interface, with public API endpoints for mobile app consumption.

## Architecture Overview

### System Components
1. **Database Layer** - PostgreSQL tables with schema definitions
2. **Backend API Layer** - RESTful endpoints for CRUD operations
3. **Storage Layer** - Data access methods and business logic
4. **Admin Panel UI** - Web-based management interface
5. **Mobile App Integration** - Public API consumption for end users

---

## 1. Database Schema

### 1.1 Terms of Service Table (`terms_of_service`)

**Purpose**: Store application terms of service (singleton pattern - one record only)

```sql
CREATE TABLE terms_of_service (
  id VARCHAR PRIMARY KEY DEFAULT 'terms_of_service_singleton',
  title VARCHAR NOT NULL DEFAULT '利用規約',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id`: Fixed primary key ensuring singleton pattern
- `title`: Title of the terms of service document
- `content`: HTML content of the terms
- `updated_at`: Last modification timestamp

**Constraints:**
- Single record enforced by fixed primary key
- Title and content are required fields

### 1.2 Privacy Policy Table (`privacy_policy`)

**Purpose**: Store application privacy policy (singleton pattern - one record only)

```sql
CREATE TABLE privacy_policy (
  id VARCHAR PRIMARY KEY DEFAULT 'privacy_policy_singleton',
  title VARCHAR NOT NULL DEFAULT 'プライバシーポリシー',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id`: Fixed primary key ensuring singleton pattern
- `title`: Title of the privacy policy document
- `content`: HTML content of the privacy policy
- `updated_at`: Last modification timestamp

**Constraints:**
- Single record enforced by fixed primary key
- Title and content are required fields

### 1.3 FAQs Table (`faqs`)

**Purpose**: Store frequently asked questions with categorization and ordering

```sql
CREATE TABLE faqs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'すべて',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id`: UUID primary key
- `question`: The FAQ question text
- `answer`: The FAQ answer text
- `category`: Category classification
- `sort_order`: Manual ordering within category
- `is_active`: Visibility flag for public display
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

**Categories:**
- すべて (All)
- アカウント (Account)
- レッスン予約 (Lesson Booking)
- 料金 (Pricing)
- 先生の探し方 (Finding Teachers)
- トラブル (Troubleshooting)

**Constraints:**
- Question and answer are required
- Category defaults to "すべて"
- Sort order defaults to 0
- Is active defaults to true

### 1.4 Admin Settings Table (`admin_settings`)

**Purpose**: Store administrative configuration (singleton pattern - one record only)

```sql
CREATE TABLE admin_settings (
  id VARCHAR PRIMARY KEY DEFAULT 'admin_settings_singleton',
  admin_email VARCHAR NOT NULL DEFAULT '',
  notify_on_new_inquiry BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id`: Fixed primary key ensuring singleton pattern
- `admin_email`: Email address for administrative notifications
- `notify_on_new_inquiry`: Toggle for inquiry notifications
- `updated_at`: Last modification timestamp

**Constraints:**
- Single record enforced by fixed primary key
- Email validation required at application level

---

## 2. Backend API Endpoints

### 2.1 Admin Endpoints (Authentication Required)

All admin endpoints require:
- Session-based authentication via `isAuthenticated` middleware
- Admin role verification via `isAdmin` middleware

#### Terms of Service

**GET /api/admin/terms-of-service**
- **Purpose**: Retrieve terms of service for editing
- **Authentication**: Required (Admin)
- **Response**: Terms of service object
```json
{
  "success": true,
  "data": {
    "id": "terms_of_service_singleton",
    "title": "利用規約",
    "content": "<h2>第1条...</h2>",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**PATCH /api/admin/terms-of-service**
- **Purpose**: Update terms of service content
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "title": "利用規約",
  "content": "<h2>第1条...</h2>"
}
```
- **Response**: Updated terms of service object
- **Validation**: Title and content are optional but validated if provided

#### Privacy Policy

**GET /api/admin/privacy-policy**
- **Purpose**: Retrieve privacy policy for editing
- **Authentication**: Required (Admin)
- **Response**: Privacy policy object
```json
{
  "success": true,
  "data": {
    "id": "privacy_policy_singleton",
    "title": "プライバシーポリシー",
    "content": "<h2>個人情報...</h2>",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**PATCH /api/admin/privacy-policy**
- **Purpose**: Update privacy policy content
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "title": "プライバシーポリシー",
  "content": "<h2>個人情報...</h2>"
}
```
- **Response**: Updated privacy policy object
- **Validation**: Title and content are optional but validated if provided

#### FAQs

**GET /api/admin/faqs**
- **Purpose**: List all FAQs with optional filtering
- **Authentication**: Required (Admin)
- **Query Parameters**:
  - `category` (optional): Filter by category
  - `isActive` (optional): Filter by active status (true/false)
- **Response**: Array of FAQ objects
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "question": "アカウントの作成方法は？",
      "answer": "アプリをダウンロードして...",
      "category": "アカウント",
      "sortOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**GET /api/admin/faqs/:id**
- **Purpose**: Get single FAQ by ID
- **Authentication**: Required (Admin)
- **Response**: FAQ object
- **Error**: 404 if FAQ not found

**POST /api/admin/faqs**
- **Purpose**: Create new FAQ
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "question": "アカウントの作成方法は？",
  "answer": "アプリをダウンロードして...",
  "category": "アカウント",
  "sortOrder": 1,
  "isActive": true
}
```
- **Response**: Created FAQ object (201 status)
- **Validation**: Question and answer are required

**PATCH /api/admin/faqs/:id**
- **Purpose**: Update existing FAQ
- **Authentication**: Required (Admin)
- **Request Body**: Partial FAQ object (any field optional)
- **Response**: Updated FAQ object
- **Error**: 404 if FAQ not found

**DELETE /api/admin/faqs/:id**
- **Purpose**: Delete FAQ
- **Authentication**: Required (Admin)
- **Response**: 204 No Content on success
- **Error**: 404 if FAQ not found

#### Admin Settings

**GET /api/admin/admin-settings**
- **Purpose**: Retrieve admin settings
- **Authentication**: Required (Admin)
- **Response**: Admin settings object
```json
{
  "success": true,
  "data": {
    "id": "admin_settings_singleton",
    "adminEmail": "admin@example.com",
    "notifyOnNewInquiry": true,
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```
- **Note**: Auto-creates record if not exists

**PATCH /api/admin/admin-settings**
- **Purpose**: Update admin settings
- **Authentication**: Required (Admin)
- **Request Body**:
```json
{
  "adminEmail": "admin@example.com",
  "notifyOnNewInquiry": true
}
```
- **Response**: Updated admin settings object
- **Validation**: Email format validation if provided

### 2.2 Public Endpoints (No Authentication Required)

#### Terms of Service (Public)

**GET /api/terms-of-service**
- **Purpose**: Get terms of service for public display
- **Authentication**: None
- **Response**: Terms of service object
- **Use Case**: Mobile app Terms of Service screen

#### Privacy Policy (Public)

**GET /api/privacy-policy**
- **Purpose**: Get privacy policy for public display
- **Authentication**: None
- **Response**: Privacy policy object
- **Use Case**: Mobile app Privacy Policy screen

#### FAQs (Public)

**GET /api/faqs**
- **Purpose**: Get active FAQs for public display
- **Authentication**: None
- **Query Parameters**:
  - `category` (optional): Filter by category
- **Response**: Array of active FAQ objects (isActive = true only)
- **Use Case**: Mobile app FAQ screen
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "question": "アカウントの作成方法は？",
      "answer": "アプリをダウンロードして...",
      "category": "アカウント",
      "sortOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 3. Storage Layer Methods

### Interface Definition

```typescript
interface Storage {
  // Terms of Service
  getTermsOfService(): Promise<TermsOfService | undefined>;
  updateTermsOfService(data: UpdateTermsOfService): Promise<TermsOfService>;
  
  // Privacy Policy
  getPrivacyPolicy(): Promise<PrivacyPolicy | undefined>;
  updatePrivacyPolicy(data: UpdatePrivacyPolicy): Promise<PrivacyPolicy>;
  
  // FAQs
  getAllFaqs(params?: { category?: string; isActive?: boolean }): Promise<Faq[]>;
  getFaq(id: string): Promise<Faq | undefined>;
  createFaq(data: InsertFaq): Promise<Faq>;
  updateFaq(id: string, data: UpdateFaq): Promise<Faq>;
  deleteFaq(id: string): Promise<boolean>;
  
  // Admin Settings
  getAdminSettings(): Promise<AdminSettings | undefined>;
  updateAdminSettings(data: UpdateAdminSettings): Promise<AdminSettings>;
}
```

### Implementation Details

#### Terms of Service Methods

**getTermsOfService()**
- Retrieves the singleton terms of service record
- Auto-creates with default values if not exists
- Returns undefined if database error

**updateTermsOfService(data)**
- Updates the singleton terms of service record
- Auto-creates if not exists before updating
- Updates timestamp automatically
- Returns updated record

#### Privacy Policy Methods

**getPrivacyPolicy()**
- Retrieves the singleton privacy policy record
- Auto-creates with default values if not exists
- Returns undefined if database error

**updatePrivacyPolicy(data)**
- Updates the singleton privacy policy record
- Auto-creates if not exists before updating
- Updates timestamp automatically
- Returns updated record

#### FAQ Methods

**getAllFaqs(params)**
- Retrieves FAQs with optional filtering
- Supports category filter (exact match)
- Supports isActive filter (boolean)
- Orders by sortOrder ASC, then createdAt DESC
- Returns empty array if none found

**getFaq(id)**
- Retrieves single FAQ by UUID
- Returns undefined if not found

**createFaq(data)**
- Creates new FAQ with generated UUID
- Sets default values for optional fields
- Returns created FAQ object

**updateFaq(id, data)**
- Updates FAQ by UUID with partial data
- Updates timestamp automatically
- Returns updated FAQ object
- Returns undefined if not found

**deleteFaq(id)**
- Deletes FAQ by UUID
- Returns true if deleted, false if not found

#### Admin Settings Methods

**getAdminSettings()**
- Retrieves the singleton admin settings record
- Auto-creates with default values if not exists
- Returns undefined if database error

**updateAdminSettings(data)**
- Updates the singleton admin settings record
- Auto-creates if not exists before updating
- Updates timestamp automatically
- Returns updated record

---

## 4. Admin Panel UI

### 4.1 Navigation Structure

**Sidebar Menu:**
```
コンテンツ管理 (Collapsible)
├── 利用規約 (Terms of Service) → /content/terms
├── プライバシーポリシー (Privacy Policy) → /content/privacy
├── 管理者メール (Administrator Email) → /content/admin-email
└── よくある質問 (FAQs) → /content/faqs
```

**Implementation:**
- Uses Radix UI Collapsible component
- Smooth expand/collapse animation
- Active route highlighting
- Icon-based navigation

### 4.2 Content Management Overview Page

**Route:** `/content`

**Purpose:** Landing page with quick navigation cards

**Features:**
- Grid layout with 4 cards (2x2 on desktop)
- Each card displays:
  - Icon
  - Title
  - Description
  - Navigation button
- Responsive design

### 4.3 Terms of Service Page

**Route:** `/content/terms`

**Features:**
- Title input field
- HTML content textarea (monospace font)
- Live HTML preview panel
- Last update timestamp display
- Save button with loading state
- Success/error toast notifications

**Validation:**
- Title: Optional string
- Content: Optional string (HTML)

**User Flow:**
1. Admin navigates to Terms of Service page
2. Form pre-populated with existing data
3. Admin edits title and/or content
4. Admin previews HTML rendering
5. Admin clicks save
6. Success notification displayed
7. Data refreshed from server

### 4.4 Privacy Policy Page

**Route:** `/content/privacy`

**Features:**
- Title input field
- HTML content textarea (monospace font)
- Live HTML preview panel
- Last update timestamp display
- Save button with loading state
- Success/error toast notifications

**Validation:**
- Title: Optional string
- Content: Optional string (HTML)

**User Flow:**
1. Admin navigates to Privacy Policy page
2. Form pre-populated with existing data
3. Admin edits title and/or content
4. Admin previews HTML rendering
5. Admin clicks save
6. Success notification displayed
7. Data refreshed from server

### 4.5 Administrator Email Page

**Route:** `/content/admin-email`

**Features:**
- Email input field with validation
- Toggle switch for inquiry notifications
- Last update timestamp display
- Save button with loading state
- Success/error toast notifications
- Email icon and descriptive text

**Validation:**
- Admin Email: Required, valid email format
- Notify On New Inquiry: Boolean

**User Flow:**
1. Admin navigates to Admin Email page
2. Form pre-populated with existing settings
3. Admin enters/updates email address
4. Admin toggles notification preference
5. Admin clicks save
6. Email validation performed
7. Success notification displayed
8. Data refreshed from server

### 4.6 FAQ Management Page

**Route:** `/content/faqs`

**Features:**

**List View:**
- Table displaying all FAQs
- Columns: Question, Category, Status, Actions
- Filter by category dropdown
- Filter by active status toggle
- Create new FAQ button

**CRUD Operations:**

**Create/Edit Dialog:**
- Modal dialog form
- Fields:
  - Question (textarea, required)
  - Answer (textarea, required)
  - Category (select dropdown)
  - Sort Order (number input)
  - Is Active (toggle switch)
- Save/Cancel buttons
- Form validation
- Success/error notifications

**Delete Confirmation:**
- Confirmation dialog before deletion
- Displays FAQ question
- Confirm/Cancel buttons

**Reordering:**
- Up/Down arrow buttons for each FAQ
- Adjusts sortOrder field
- Immediate update via API
- Visual feedback on success

**Search/Filter:**
- Category filter (dropdown)
- Active status filter (toggle)
- Client-side search by question/answer

**User Flow - Create FAQ:**
1. Admin clicks "Create FAQ" button
2. Dialog opens with empty form
3. Admin fills in question, answer, category
4. Admin sets sort order and active status
5. Admin clicks save
6. Validation performed
7. FAQ created via API
8. Success notification displayed
9. List refreshed

**User Flow - Edit FAQ:**
1. Admin clicks edit icon on FAQ row
2. Dialog opens with pre-filled form
3. Admin modifies fields
4. Admin clicks save
5. Validation performed
6. FAQ updated via API
7. Success notification displayed
8. List refreshed

**User Flow - Delete FAQ:**
1. Admin clicks delete icon on FAQ row
2. Confirmation dialog appears
3. Admin confirms deletion
4. FAQ deleted via API
5. Success notification displayed
6. List refreshed

**User Flow - Reorder FAQs:**
1. Admin clicks up/down arrow on FAQ row
2. Sort order adjusted
3. FAQ updated via API
4. List automatically refreshed
5. FAQs displayed in new order

---

## 5. Mobile App Integration

### 5.1 FAQ Screen

**Purpose:** Display FAQs to mobile app users with search and filtering

**Features:**

**Search Bar:**
- Keyword search input
- Filters questions and answers
- Real-time filtering
- Search icon

**Category Chips:**
- Horizontal scrollable list
- Categories: すべて, アカウント, レッスン予約, 料金, 先生の探し方, トラブル
- Active category highlighted
- Tap to filter FAQs
- Smooth scroll animation

**FAQ List:**
- Accordion-style expandable items
- Shows question as header
- Answer revealed on tap
- Smooth expand/collapse animation
- Chevron icon rotation
- Sort by sortOrder field

**States:**

**Loading State:**
- ActivityIndicator spinner
- "読み込み中..." text
- Displayed during API fetch

**Error State:**
- Error icon
- "FAQの読み込みに失敗しました" message
- Displayed on API failure

**Empty State:**
- Help circle icon
- "検索結果が見つかりませんでした" (if searching)
- "FAQがまだ登録されていません" (if no FAQs)

**Contact FAB (Floating Action Button):**
- Fixed position at bottom right
- "お問い合わせ" text
- Headphones icon
- Links to contact/inquiry form
- Elevated shadow effect

**API Integration:**
- Fetches from GET /api/faqs
- Category parameter passed based on selection
- Only active FAQs displayed (isActive: true)
- React Query for caching and state management

**User Flow:**
1. User navigates to FAQ screen
2. Loading state displayed
3. FAQs fetched from API
4. FAQs displayed in accordion list
5. User selects category chip
6. List filtered by category
7. User types in search bar
8. List filtered by search query
9. User taps FAQ question
10. Answer expanded with animation
11. User taps again to collapse

---

## 6. Technical Implementation Notes

### 6.1 Singleton Pattern

**Purpose:** Ensure only one record exists for Terms, Privacy Policy, and Admin Settings

**Implementation:**
- Fixed primary key value (e.g., 'terms_of_service_singleton')
- Auto-creation on first read if not exists
- Upsert pattern for updates

**Benefits:**
- Simplifies API design (no need for ID in URLs)
- Prevents duplicate records
- Consistent data structure

### 6.2 Security Considerations

**Admin Panel:**
- All admin endpoints require authentication
- Session-based auth with secure cookies
- Admin role verification on every request
- XSS prevention via input sanitization
- CSRF protection via session tokens

**HTML Content:**
- Terms and Privacy Policy support HTML
- Content from trusted admin sources only
- Preview sanitization in admin panel
- No user-generated HTML content

**Public Endpoints:**
- No authentication required
- Read-only access
- Rate limiting recommended
- Active FAQs only (isActive filter)

### 6.3 Data Validation

**Server-Side:**
- Zod schema validation
- Email format validation
- Required field enforcement
- Type checking

**Client-Side:**
- Form validation before submission
- Email format checking
- Required field highlighting
- Real-time validation feedback

### 6.4 FAQ Ordering System

**Sort Order Field:**
- Integer field for manual ordering
- Default value: 0
- Lower numbers appear first
- Secondary sort by createdAt DESC

**Reordering Logic:**
1. Get current FAQ sortOrder
2. Get adjacent FAQ sortOrder
3. Swap values
4. Update both FAQs via API
5. Refresh list to reflect changes

**Alternative:** Drag-and-drop interface (future enhancement)

### 6.5 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

**Pagination (not used in current implementation):**
```json
{
  "success": true,
  "data": { /* array of items */ },
  "page": 1,
  "totalPages": 5,
  "total": 50
}
```

### 6.6 State Management

**Admin Panel:**
- React Query for server state
- Query invalidation on mutations
- Optimistic updates for better UX
- Local state for form inputs

**Mobile App:**
- React Query for server state
- Query key includes category filter
- Automatic refetch on focus
- Cache invalidation strategy

---

## 7. Database Migration

### Initial Setup

**Note**: This implementation uses PostgreSQL-specific features including `gen_random_uuid()` for UUID generation. This is appropriate as the system is built on PostgreSQL with Drizzle ORM.

```sql
-- Create Terms of Service table
CREATE TABLE IF NOT EXISTS terms_of_service (
  id VARCHAR PRIMARY KEY DEFAULT 'terms_of_service_singleton',
  title VARCHAR NOT NULL DEFAULT '利用規約',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Privacy Policy table
CREATE TABLE IF NOT EXISTS privacy_policy (
  id VARCHAR PRIMARY KEY DEFAULT 'privacy_policy_singleton',
  title VARCHAR NOT NULL DEFAULT 'プライバシーポリシー',
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create FAQs table
CREATE TABLE IF NOT EXISTS faqs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'すべて',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Admin Settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id VARCHAR PRIMARY KEY DEFAULT 'admin_settings_singleton',
  admin_email VARCHAR NOT NULL DEFAULT '',
  notify_on_new_inquiry BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_is_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs(sort_order);
```

### Sample Data (Optional)

**Note**: Sample FAQs will create new records each time this is run since they use auto-generated UUIDs. For production, manage FAQs through the admin panel instead.

```sql
-- Insert sample FAQs (these will create new records each time)
INSERT INTO faqs (question, answer, category, sort_order, is_active) VALUES
('アカウントの作成方法は？', 'アプリをダウンロードして、メールアドレスとパスワードを入力してください。', 'アカウント', 1, true),
('レッスンの予約方法は？', '教師のプロフィールページから、カレンダーで希望の日時を選択してください。', 'レッスン予約', 2, true),
('料金の支払い方法は？', 'クレジットカード、銀行振込、コンビニ決済に対応しています。', '料金', 3, true);

-- Initialize admin settings
INSERT INTO admin_settings (id, admin_email, notify_on_new_inquiry)
VALUES ('admin_settings_singleton', 'admin@example.com', true)
ON CONFLICT (id) DO NOTHING;

-- Initialize terms of service
INSERT INTO terms_of_service (id, title, content)
VALUES ('terms_of_service_singleton', '利用規約', '<h2>第1条（定義）</h2><p>本規約において使用する用語の定義は、以下の通りとします。</p>')
ON CONFLICT (id) DO NOTHING;

-- Initialize privacy policy
INSERT INTO privacy_policy (id, title, content)
VALUES ('privacy_policy_singleton', 'プライバシーポリシー', '<h2>個人情報の取り扱いについて</h2><p>当社は、お客様の個人情報を大切に保護します。</p>')
ON CONFLICT (id) DO NOTHING;
```

---

## 8. API Usage Examples

### 8.1 Admin Operations

**Update Terms of Service:**
```bash
curl -X PATCH http://localhost:3000/api/admin/terms-of-service \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie_here" \
  -d '{
    "title": "利用規約",
    "content": "<h2>第1条（定義）</h2><p>本規約において...</p>"
  }'
```

**Create FAQ:**
```bash
curl -X POST http://localhost:3000/api/admin/faqs \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie_here" \
  -d '{
    "question": "アカウントの作成方法は？",
    "answer": "アプリをダウンロードして...",
    "category": "アカウント",
    "sortOrder": 1,
    "isActive": true
  }'
```

**Update FAQ:**
```bash
curl -X PATCH http://localhost:3000/api/admin/faqs/uuid-123 \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie_here" \
  -d '{
    "answer": "更新された回答内容...",
    "sortOrder": 2
  }'
```

**Delete FAQ:**
```bash
curl -X DELETE http://localhost:3000/api/admin/faqs/uuid-123 \
  -H "Cookie: session_cookie_here"
```

**Update Admin Settings:**
```bash
curl -X PATCH http://localhost:3000/api/admin/admin-settings \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie_here" \
  -d '{
    "adminEmail": "admin@example.com",
    "notifyOnNewInquiry": true
  }'
```

### 8.2 Public Operations (Mobile App)

**Get Active FAQs (All Categories):**
```bash
curl http://localhost:3000/api/faqs
```

**Get Active FAQs (Specific Category):**
```bash
curl http://localhost:3000/api/faqs?category=アカウント
```

**Get Terms of Service:**
```bash
curl http://localhost:3000/api/terms-of-service
```

**Get Privacy Policy:**
```bash
curl http://localhost:3000/api/privacy-policy
```

---

## 9. Testing Checklist

### 9.1 Database Layer
- [ ] Terms of Service table created successfully
- [ ] Privacy Policy table created successfully
- [ ] FAQs table created successfully
- [ ] Admin Settings table created successfully
- [ ] Singleton records auto-create on first read
- [ ] Indexes created for performance

### 9.2 Backend API
- [ ] Admin authentication middleware works
- [ ] Admin role verification works
- [ ] Terms of Service GET endpoint returns data
- [ ] Terms of Service PATCH endpoint updates data
- [ ] Privacy Policy GET endpoint returns data
- [ ] Privacy Policy PATCH endpoint updates data
- [ ] FAQs GET endpoint returns filtered list
- [ ] FAQs GET by ID returns single FAQ
- [ ] FAQs POST endpoint creates new FAQ
- [ ] FAQs PATCH endpoint updates FAQ
- [ ] FAQs DELETE endpoint removes FAQ
- [ ] Admin Settings GET endpoint returns data
- [ ] Admin Settings PATCH endpoint updates data
- [ ] Public FAQs endpoint returns only active FAQs
- [ ] Public FAQs endpoint filters by category
- [ ] Public Terms endpoint works without auth
- [ ] Public Privacy endpoint works without auth

### 9.3 Storage Layer
- [ ] getTermsOfService returns correct data
- [ ] updateTermsOfService updates and returns data
- [ ] getPrivacyPolicy returns correct data
- [ ] updatePrivacyPolicy updates and returns data
- [ ] getAllFaqs returns all FAQs
- [ ] getAllFaqs filters by category correctly
- [ ] getAllFaqs filters by isActive correctly
- [ ] getFaq returns single FAQ by ID
- [ ] createFaq creates and returns new FAQ
- [ ] updateFaq updates and returns FAQ
- [ ] deleteFaq removes FAQ and returns boolean
- [ ] getAdminSettings returns correct data
- [ ] updateAdminSettings updates and returns data

### 9.4 Admin Panel UI
- [ ] Navigation menu displays correctly
- [ ] Collapsible content menu expands/collapses
- [ ] Content management overview page loads
- [ ] Terms of Service page loads data
- [ ] Terms of Service page saves changes
- [ ] Terms of Service preview displays HTML
- [ ] Privacy Policy page loads data
- [ ] Privacy Policy page saves changes
- [ ] Privacy Policy preview displays HTML
- [ ] Admin Email page loads settings
- [ ] Admin Email page validates email format
- [ ] Admin Email page saves changes
- [ ] FAQ list page displays all FAQs
- [ ] FAQ create dialog opens and works
- [ ] FAQ edit dialog opens with data
- [ ] FAQ delete confirmation works
- [ ] FAQ reorder up/down buttons work
- [ ] FAQ category filter works
- [ ] FAQ active status filter works
- [ ] Toast notifications display correctly

### 9.5 Mobile App Integration
- [ ] FAQ screen loads and displays FAQs
- [ ] FAQ screen shows loading state
- [ ] FAQ screen shows error state
- [ ] FAQ screen shows empty state
- [ ] Category chips filter FAQs
- [ ] Search bar filters FAQs
- [ ] FAQ accordion expands/collapses
- [ ] FAQs sorted by sortOrder
- [ ] Only active FAQs displayed
- [ ] Contact FAB button displays

---

## 10. Future Enhancements

### 10.1 Planned Features
1. **Email Notifications**: Implement actual email sending for inquiry notifications
2. **Rich Text Editor**: Replace plain textarea with WYSIWYG editor (TinyMCE, Quill)
3. **FAQ Analytics**: Track views and helpfulness ratings
4. **Multi-language Support**: Add language field for internationalization
5. **Custom Categories**: Allow admins to create/edit FAQ categories
6. **Bulk Operations**: Add bulk activate/deactivate/delete for FAQs
7. **FAQ Search (Admin)**: Add search functionality in admin FAQ list
8. **Preview Mode**: Add preview before save for Terms/Privacy
9. **Version History**: Track changes to Terms/Privacy over time
10. **Drag-and-Drop**: Implement drag-and-drop reordering for FAQs

### 10.2 Performance Optimizations
1. **Caching**: Implement Redis caching for frequently accessed content
2. **CDN Integration**: Serve static content via CDN
3. **Database Indexing**: Add composite indexes for complex queries
4. **Query Optimization**: Optimize FAQ queries with pagination
5. **Lazy Loading**: Implement lazy loading for long FAQ lists

### 10.3 Security Enhancements
1. **Content Sanitization**: Add HTML sanitization library (DOMPurify)
2. **Rate Limiting**: Implement rate limiting on public endpoints
3. **Audit Logging**: Log all content changes with admin user
4. **Role-Based Permissions**: Add granular permissions for content editing
5. **Two-Factor Authentication**: Require 2FA for content updates

---

## 11. Deployment Notes

### 11.1 Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session
SESSION_SECRET=your-secret-key-here

# Email (for future notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
```

### 11.2 Deployment Steps
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build admin panel frontend
5. Build mobile app
6. Start backend server
7. Verify all endpoints work
8. Test admin panel access
9. Test mobile app connectivity
10. Monitor logs for errors

### 11.3 Monitoring
- Monitor API response times
- Track FAQ query performance
- Monitor database connection pool
- Log all admin content changes
- Alert on API failures

---

## 12. Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: express-session

### Admin Panel
- **Framework**: React
- **Routing**: Wouter
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Mobile App
- **Framework**: React Native (Expo)
- **State Management**: React Query (TanStack Query)
- **Navigation**: React Navigation
- **Animations**: React Native Reanimated
- **Icons**: Feather Icons

---

## 13. File Structure

```
backend/
├── server/
│   ├── routes/
│   │   ├── admin.ts              # Admin API endpoints
│   │   └── index.ts              # Public API endpoints
│   ├── storage.ts                # Storage layer implementation
│   ├── auth.ts                   # Authentication middleware
│   └── utils/
│       └── apiResponse.ts        # Response formatting utilities
├── shared/
│   └── schema.ts                 # Database schema and types
└── client/
    └── src/
        ├── pages/
        │   ├── content-management.tsx    # Overview page
        │   ├── content-terms.tsx         # Terms of Service page
        │   ├── content-privacy.tsx       # Privacy Policy page
        │   ├── content-admin-email.tsx   # Admin Email page
        │   └── content-faqs.tsx          # FAQ Management page
        └── components/
            └── app-sidebar.tsx           # Navigation sidebar

screens/
└── FAQScreen.tsx                 # Mobile app FAQ screen

services/
└── api.ts                        # Mobile app API service
```

---

## 14. Support and Maintenance

### Common Issues

**Issue**: FAQs not displaying in mobile app
- **Solution**: Check isActive flag, verify API endpoint, check network connection

**Issue**: Admin panel not loading content
- **Solution**: Verify authentication, check session cookies, verify database connection

**Issue**: Singleton records not auto-creating
- **Solution**: Check database permissions, verify default values in schema

**Issue**: HTML preview not rendering
- **Solution**: Verify HTML content format, check browser console for errors

### Maintenance Tasks

**Daily:**
- Monitor API logs for errors
- Check database connection health

**Weekly:**
- Review FAQ analytics
- Update content as needed

**Monthly:**
- Review and update Terms/Privacy if legal changes
- Optimize database queries if performance degrades
- Review admin access logs

---

## 15. Conclusion

This specification provides a complete technical overview of the content management functionality. It can be used to:

1. Replicate the same functionality in other systems
2. Onboard new developers to the codebase
3. Plan future enhancements
4. Troubleshoot issues
5. Maintain and update the system

For questions or support, contact the development team.

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Maintained By**: Development Team
