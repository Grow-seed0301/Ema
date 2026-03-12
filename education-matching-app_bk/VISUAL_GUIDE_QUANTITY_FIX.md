# Visual Guide: Additional Option Quantity Fix

## Before Fix ❌

```
User Action:
┌─────────────────────────────────┐
│ 追加オプション Screen            │
│                                 │
│ Option: 授業追加購入             │
│ Price: ¥6000 / 回               │
│ Quantity: 3 ← User selects 3    │
│                                 │
│ Total: ¥18,000                  │
└─────────────────────────────────┘
           ↓
Frontend → Backend:
{
  planId: "option-123"
  // ❌ quantity not sent!
}
           ↓
Backend Processing:
- Creates Stripe session with quantity: 1 (hardcoded)
- User pays ¥18,000 (incorrect, should be ¥6,000)
- Adds 1 lesson (incorrect, should be 3)
           ↓
Result: ❌ User paid for 3 but only got 1 lesson!
```

## After Fix ✅

```
User Action:
┌─────────────────────────────────┐
│ 追加オプション Screen            │
│                                 │
│ Option: 授業追加購入             │
│ Price: ¥6000 / 回               │
│ Quantity: 3 ← User selects 3    │
│                                 │
│ Total: ¥18,000                  │
└─────────────────────────────────┘
           ↓
Frontend → Backend:
{
  planId: "option-123",
  quantity: 3  // ✅ quantity sent!
}
           ↓
Backend Processing:
- Validates quantity (must be >= 1)
- Calculates: totalAmount = price * quantity = ¥6,000 * 3 = ¥18,000
- Creates Stripe session with quantity: 3
- Stores quantity in payment record
           ↓
Payment Completed:
- Calculates: totalLessons = plan.totalLessons * quantity = 1 * 3 = 3
- Adds 3 lessons to user account
           ↓
Result: ✅ User paid for 3 and got 3 lessons!
```

## Code Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (Mobile App)                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
    screens/PlanSelectionScreen.tsx
    - User selects additional option
    - User adjusts quantity with +/- buttons
    - handleCheckout() called
                              ↓
    services/api.ts
    - createCheckoutSession(planId, quantity)
    - POST /api/student/create-checkout-session
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Express API)                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
    backend/server/routes/student/payments.ts
    1. Receive { planId, quantity }
    2. Validate quantity (must be positive integer)
    3. Fetch plan from database
    4. Calculate: totalAmount = plan.price * quantity
    5. Create payment record with quantity
    6. Create Stripe checkout session:
       - line_items[0].quantity = quantity
       - metadata.quantity = String(quantity)
    7. Return session URL to frontend
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                      Stripe Payment                           │
└──────────────────────────────────────────────────────────────┘
                              ↓
    User completes payment on Stripe
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                  Payment Verification                         │
│          (Manual or Webhook - both updated)                   │
└──────────────────────────────────────────────────────────────┘
                              ↓
    backend/server/routes/student/payments.ts
    1. Retrieve payment record (includes quantity)
    2. Verify Stripe payment status
    3. Calculate: totalLessonsToAdd = plan.totalLessons * payment.quantity
    4. Create user subscription with totalLessonsToAdd
    5. Update user.totalLessons += totalLessonsToAdd
                              ↓
    ✅ User account updated with correct lesson count!
```

## Example Scenarios

### Scenario 1: Standard Additional Option
```
Plan: "授業追加購入" (1 lesson per unit)
Price: ¥6,000 per unit
User selects: quantity = 3

Calculation:
- Total Amount = ¥6,000 × 3 = ¥18,000
- Total Lessons = 1 × 3 = 3 lessons

Result: ✅ User pays ¥18,000 and receives 3 lessons
```

### Scenario 2: Bulk Additional Option
```
Plan: "まとめて購入" (5 lessons per unit)
Price: ¥25,000 per unit
User selects: quantity = 2

Calculation:
- Total Amount = ¥25,000 × 2 = ¥50,000
- Total Lessons = 5 × 2 = 10 lessons

Result: ✅ User pays ¥50,000 and receives 10 lessons
```

### Scenario 3: Monthly Plan (No Change)
```
Plan: "スタンダードプラン" (monthly subscription)
Price: ¥12,000 per month
Quantity: 1 (always)

Calculation:
- Total Amount = ¥12,000 × 1 = ¥12,000
- Total Lessons = 12 × 1 = 12 lessons

Result: ✅ Works exactly as before
```

## Database Changes

```sql
-- Before: payments table
CREATE TABLE payments (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  plan_id VARCHAR,
  amount DECIMAL(10, 2) NOT NULL,
  -- ... other fields
);

-- After: payments table
CREATE TABLE payments (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  plan_id VARCHAR,
  amount DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,  -- ✅ New field
  -- ... other fields
);
```

## Backward Compatibility

```
Existing Payments (before fix):
┌────────────┬─────────┬────────┬──────────┐
│ id         │ plan_id │ amount │ quantity │
├────────────┼─────────┼────────┼──────────┤
│ payment-1  │ plan-A  │ 12000  │ NULL     │  → Treated as 1
│ payment-2  │ plan-B  │  6000  │ NULL     │  → Treated as 1
└────────────┴─────────┴────────┴──────────┘

New Payments (after fix):
┌────────────┬─────────┬────────┬──────────┐
│ id         │ plan_id │ amount │ quantity │
├────────────┼─────────┼────────┼──────────┤
│ payment-3  │ plan-C  │ 18000  │ 3        │  ✅ Explicit value
│ payment-4  │ plan-D  │ 12000  │ 1        │  ✅ Default value
└────────────┴─────────┴────────┴──────────┘
```

## Key Implementation Details

### Frontend Validation
- Quantity minimum: 1
- Quantity control: +/- buttons
- Only visible for additional options
- Not shown for monthly plans

### Backend Validation
```typescript
if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
  return sendError(res, "数量は1以上である必要があります", "INVALID_QUANTITY", 400);
}
```

### Lesson Calculation
```typescript
const quantity = payment.quantity || 1;  // Default to 1 for backward compatibility
const totalLessonsToAdd = plan.totalLessons * quantity;
```

### Stripe Integration
```typescript
line_items: [{
  price_data: { /* ... */ },
  quantity: quantity  // ✅ User-selected quantity
}],
metadata: {
  quantity: String(quantity)  // Stripe requires strings in metadata
}
```

## Testing Checklist

- [ ] Purchase additional option with quantity = 1
- [ ] Purchase additional option with quantity = 3
- [ ] Purchase additional option with quantity = 5
- [ ] Verify Stripe shows correct quantity
- [ ] Verify correct amount charged
- [ ] Verify correct lessons added to user account
- [ ] Test monthly plan still works (quantity = 1 implicit)
- [ ] Test backward compatibility with existing payments

## Success Criteria

✅ User selects quantity N for additional option
✅ Stripe charges for N units
✅ User receives N × plan.totalLessons lessons
✅ Database stores quantity correctly
✅ Backward compatible with existing code
✅ No security vulnerabilities
