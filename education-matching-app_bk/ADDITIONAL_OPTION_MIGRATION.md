# Additional Option Feature Migration Guide

## Overview
This document describes the changes made to add the "追加オプション" (Additional Option) feature to plans.

## Changes Made

### 1. Database Schema Changes
Added `isAdditionalOption` field to the `plans` table in `/backend/shared/schema.ts`:
```typescript
isAdditionalOption: boolean("is_additional_option").default(false),
```

### 2. Backend API Changes

#### Admin Routes
- Updated form data handling to include `isAdditionalOption` field
- The existing `/api/admin/plans` endpoints (GET, POST, PATCH, DELETE) now support the new field

#### Student Routes (`/backend/server/routes/student/plans.ts`)
- **Modified** `/api/student/plans` - Now filters out plans where `isAdditionalOption = true`
- **Added** `/api/student/plans/options` - New endpoint to fetch only additional options

### 3. Frontend Changes

#### Admin Panel (`/backend/client/src/pages/plans.tsx`)
- Added `isAdditionalOption` field to form state
- Added checkbox "追加オプション" in the plan creation/edit dialog
- Checkbox appears after the "有効" (Active) switch

#### Mobile App (`/screens/PlanSelectionScreen.tsx`)
- Updated to fetch additional options from API instead of using hardcoded data
- Added `fetchAdditionalOptions()` function
- Changed `optionItems` from constant to state variable

#### API Service (`/services/api.ts`)
- Added `getAdditionalOptions()` method to fetch additional options

## Database Migration Steps

To apply these changes to the database, run:

```bash
cd backend
npm run db:push
```

This will add the `is_additional_option` column to the `plans` table with a default value of `false`.

## How to Use

### Creating an Additional Option Plan

1. Navigate to the admin panel → Plans (プラン)
2. Click "プランを追加" (Add Plan)
3. Fill in the plan details:
   - **名前 (Name)**: e.g., "授業追加購入"
   - **価格 (Price)**: e.g., 6000
   - **レッスン数合計 (Total Lessons)**: e.g., 1
   - **説明 (Description)**: ⚠️ For additional options, use this field for the pricing unit (e.g., "回" for per-time pricing)
   - **機能 (Features)**: ⚠️ For additional options, enter the main description as the first feature line (e.g., "追加で1回分のレッスンを購入できます")
4. **Important**: Check the "追加オプション" checkbox
5. Set "有効" (Active) to enabled
6. Click "保存" (Save)

**⚠️ Field Mapping Note**: For additional options, the existing plan fields are repurposed:
- `description` field → displayed as the pricing unit on the mobile app (not as a description)
- `features[0]` (first feature) → displayed as the option description text

**Why this approach?** This reuses existing database columns without requiring schema changes. However, be aware that the field labels in the admin UI may not exactly match how the data is displayed in the mobile app for additional options.

### Viewing Additional Options

When users open the "プランを選択" (Select Plan) screen in the mobile app:
- Regular monthly plans appear in the "月額プラン" tab (filtered by `isAdditionalOption = false`)
- Additional options appear in the "追加オプション" tab (filtered by `isAdditionalOption = true`)

## Backward Compatibility

- All existing plans will have `isAdditionalOption = false` by default
- Existing functionality remains unchanged
- No data migration is required for existing plans
