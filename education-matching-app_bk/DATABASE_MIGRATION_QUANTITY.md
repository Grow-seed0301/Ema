# Database Migration: Add Quantity Field to Payments Table

## Overview
This migration adds a `quantity` field to the `payments` table to support purchasing multiple units of additional options (追加オプション).

## Changes Made

### Schema Update
Added `quantity` field to the `payments` table in `/backend/shared/schema.ts`:
```typescript
quantity: integer("quantity").default(1),
```

### Migration Steps

To apply this change to the database, run:

```bash
cd backend
npm run db:push
```

This will add the `quantity` column to the `payments` table with a default value of `1`.

## Backward Compatibility

- All existing payment records will have `quantity = 1` by default
- Existing functionality remains unchanged
- No data migration is required for existing payments

## Field Usage

- **Monthly Plans**: Always use `quantity = 1`
- **Additional Options**: Can have `quantity >= 1`
- When processing payments, the total lessons added to the user is calculated as: `plan.totalLessons * quantity`

## Related Changes

This migration is part of the fix for the issue where purchasing additional options with quantity > 1 only increased available lessons by 1.

See the following files for implementation details:
- Frontend: `screens/PlanSelectionScreen.tsx`, `services/api.ts`
- Backend: `backend/server/routes/student/payments.ts`
- Schema: `backend/shared/schema.ts`
