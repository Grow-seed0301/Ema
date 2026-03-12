# Fix Summary: Additional Option Quantity Issue

## Issue Description (Japanese)
ở màn hình プランを購入 , khi mua 追加オプション số lượng nhiều hơn 1 , nhưng　勉強可能なレッスン chỉ tăng lên 1

Translation: On the plan purchase screen, when buying additional options with quantity more than 1, the available lessons only increase by 1.

## Root Cause Analysis

The issue occurred because:

1. **Frontend**: The user could select a quantity > 1 for additional options, but this quantity was not passed to the backend API
2. **Backend API**: The checkout session creation always used `quantity: 1` in the Stripe session
3. **Backend Payment Processing**: When adding lessons to the user account, the code used `plan.totalLessons` without multiplying by the purchased quantity

## Solution Implemented

### 1. Frontend Changes

**File: `screens/PlanSelectionScreen.tsx`**
- Modified `handleCheckout` to pass `quantity` parameter to the API
- For monthly plans: `quantity = 1` (default)
- For additional options: `quantity = optionQuantity` (user selection)

**File: `services/api.ts`**
- Updated `createCheckoutSession` method signature to accept `quantity` parameter (defaults to 1)
- Passes quantity to backend in request body

### 2. Backend Changes

**File: `backend/server/routes/student/payments.ts`**

#### Checkout Session Creation (`/api/student/create-checkout-session`)
- Accept `quantity` parameter from request body (defaults to 1)
- Validate quantity is a positive integer
- Store quantity in payment record
- Calculate total amount: `plan.price * quantity`
- Create Stripe session with correct quantity
- Add quantity to Stripe metadata for tracking

#### Payment Verification (`/api/student/payments/verify`)
- Calculate total lessons to add: `plan.totalLessons * payment.quantity`
- Create user subscription with correct lesson count
- Update user's total lessons by multiplied amount

#### Webhook Handler (`/api/webhooks/stripe`)
- Apply same multiplication logic when processing successful payments
- Ensures lessons are correctly added regardless of verification method

### 3. Database Schema Changes

**File: `backend/shared/schema.ts`**
- Added `quantity` column to `payments` table
- Type: `integer`
- Default value: `1`
- Ensures backward compatibility

## Testing Scenarios

### Scenario 1: Purchase Additional Option with Quantity = 1
- User selects an additional option (e.g., "授業追加購入" with 1 lesson)
- User keeps quantity at 1
- Expected: User receives 1 lesson

### Scenario 2: Purchase Additional Option with Quantity = 3
- User selects an additional option (e.g., "授業追加購入" with 1 lesson)
- User changes quantity to 3
- Expected: User receives 3 lessons (1 * 3)

### Scenario 3: Purchase Additional Option with Quantity = 5
- User selects an additional option with 2 lessons per unit
- User changes quantity to 5
- Expected: User receives 10 lessons (2 * 5)

### Scenario 4: Purchase Monthly Plan
- User selects a monthly plan
- Quantity is always 1 (not user-configurable for monthly plans)
- Expected: User receives plan's total lessons as before

### Scenario 5: Existing Payments (Backward Compatibility)
- Existing payment records without quantity field
- Database default value applies: `quantity = 1`
- Expected: All existing payments work as before

## Deployment Instructions

1. **Deploy Code Changes**
   - Deploy frontend changes (screens, services)
   - Deploy backend changes (routes, schema)

2. **Run Database Migration**
   ```bash
   cd backend
   npm run db:push
   ```
   This adds the `quantity` column to the `payments` table.

3. **Verify Deployment**
   - Test purchasing additional options with different quantities
   - Verify lesson count increases correctly
   - Check Stripe dashboard for correct quantities in checkout sessions

## Files Modified

1. `screens/PlanSelectionScreen.tsx` - Pass quantity to API
2. `services/api.ts` - Accept quantity parameter
3. `backend/server/routes/student/payments.ts` - Process quantity in checkout, verification, and webhook
4. `backend/shared/schema.ts` - Add quantity column to payments table

## Backward Compatibility

✅ All existing functionality remains unchanged
✅ Existing payment records default to `quantity = 1`
✅ Monthly plans continue to work with implicit `quantity = 1`
✅ No breaking changes to API contracts

## Security Review

✅ No security vulnerabilities introduced
✅ Quantity validation prevents negative or invalid values
✅ CodeQL analysis passed with 0 alerts
✅ Input sanitization maintained

## Notes

- The quantity field is only user-configurable for additional options (追加オプション)
- Monthly plans always use `quantity = 1` internally
- Stripe metadata stores quantity as a string (Stripe requirement)
- Database stores quantity as an integer
- The fix ensures correct lesson calculation: `totalLessons = plan.totalLessons * quantity`
