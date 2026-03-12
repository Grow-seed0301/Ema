# Stripe Checkout Payment Implementation

## Overview

This implementation adds Stripe Checkout payment functionality to the education matching app, allowing users to purchase subscription plans.

## Features

- **Stripe Checkout Integration**: Secure payment processing using Stripe's hosted checkout page
- **Webhook Support**: Automatic payment status updates and subscription creation via webhooks
- **Mobile-Friendly**: Uses expo-web-browser for seamless checkout experience on mobile
- **Payment Tracking**: Complete payment history with status tracking
- **User Subscriptions**: Automatic subscription creation upon successful payment

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed as part of the implementation:
- Backend: `stripe` (v17.4.0)
- Frontend: `@stripe/stripe-react-native` (v0.41.2)

### 2. Configure Environment Variables

Add the following environment variables to your backend `.env` file:

```bash
# Required
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
FRONTEND_URL=https://your-frontend-url.com

# Recommended for production (for webhook signature verification)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Database Migration

The schema has been updated to add `stripeSessionId` to the payments table. Run the migration:

```bash
cd backend
npm run db:push
```

### 4. Configure Stripe Webhooks

1. Go to your Stripe Dashboard → Developers → Webhooks
2. Add a new webhook endpoint: `https://your-api-domain.com/api/webhooks/stripe`
3. Select the following events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret and add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

## API Endpoints

### Create Checkout Session
```
POST /api/student/create-checkout-session
Authorization: Bearer <token>

Request:
{
  "planId": "plan-uuid"
}

Response:
{
  "success": true,
  "data": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### Get Payment Status
```
GET /api/student/payment-status/:sessionId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment-uuid",
      "amount": "27500",
      "currency": "JPY",
      "status": "completed",
      "description": "スタンダードプラン購入",
      "createdAt": "2024-01-19T..."
    },
    "plan": {
      "id": "plan-uuid",
      "name": "スタンダードプラン",
      "price": "27500",
      "totalLessons": 8
    }
  }
}
```

### Stripe Webhook
```
POST /api/webhooks/stripe
Headers:
  stripe-signature: <signature>

Body: Stripe Event Object
```

## Usage Flow

1. **User selects a plan** in PlanSelectionScreen
2. **Frontend calls** `/api/student/create-checkout-session` with planId
3. **Backend creates** a Stripe Checkout session and pending payment record
4. **Frontend opens** Stripe Checkout in WebBrowser
5. **User completes** payment on Stripe's hosted page
6. **Stripe sends** webhook to `/api/webhooks/stripe`
7. **Backend updates** payment status and creates user subscription
8. **Frontend checks** payment status and navigates to success screen

## Security Considerations

### Implemented
- ✅ Authentication required for all payment endpoints
- ✅ Webhook signature verification (when STRIPE_WEBHOOK_SECRET is set)
- ✅ Raw body preservation for Stripe signature validation
- ✅ Secure payment amount calculation
- ✅ Proper handling of zero-decimal currencies (JPY)

### Recommendations
- ⚠️ Consider adding rate limiting to payment endpoints
- ⚠️ Consider implementing CSRF protection for all endpoints
- ⚠️ Monitor webhook failures and implement retry logic
- ⚠️ Add payment amount limits and validation

## Testing

### Test Mode
Use Stripe test mode for development:
- Test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### Testing Webhooks
Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

## Currency Handling

**Important**: JPY is a zero-decimal currency in Stripe, meaning amounts are specified in the currency's smallest unit (yen, not cents). The implementation correctly handles this by using the amount directly without multiplying by 100.

Example: ¥27,500 is sent as `27500` to Stripe, not `2750000`.

## Troubleshooting

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible
- Check Stripe webhook logs in dashboard
- Ensure `STRIPE_WEBHOOK_SECRET` is correctly set
- Check backend logs for signature verification errors

### Payment Status Not Updating
- Verify webhook endpoint is working
- Check if webhook events are being delivered (Stripe dashboard)
- Ensure database is accessible
- Check backend logs for errors

### Frontend Not Redirecting to Success
- Verify `FRONTEND_URL` is correctly set
- Check payment status API response
- Ensure webhook has processed before status check

## Files Modified

### Backend
- `backend/server/stripe.ts` - Stripe configuration
- `backend/server/routes/student/payments.ts` - Payment endpoints and webhook
- `backend/server/routes/student.ts` - Route registration
- `backend/shared/schema.ts` - Added stripeSessionId field

### Frontend
- `screens/PlanSelectionScreen.tsx` - Checkout integration
- `screens/PaymentCompleteScreen.tsx` - Success screen
- `services/api.ts` - API methods
- `navigation/RootNavigator.tsx` - Route params

## Known Limitations

1. **Rate Limiting**: Payment endpoints do not have rate limiting (follows existing pattern)
2. **CSRF Protection**: Not implemented (pre-existing pattern in codebase)
3. **Subscription Management**: No UI for viewing/managing active subscriptions yet
4. **Refunds**: No refund functionality implemented
5. **Failed Payment Retry**: No automatic retry mechanism for failed payments

## Future Improvements

- Add subscription management UI
- Implement refund functionality
- Add payment history view for users
- Implement rate limiting for payment endpoints
- Add more comprehensive error handling
- Support for additional payment methods
- Implement automatic payment retry for failed payments
- Add email notifications for payment events
