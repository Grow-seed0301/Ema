import type { Express, Request } from "express";
import { db } from "../../db";
import { plans, payments, userSubscriptions, users } from "../../../shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { isAuthenticated } from "../../auth";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { stripe, isStripeConfigured, stripeWebhookSecret } from "../../stripe";
import type Stripe from "stripe";
import { DEFAULT_STRIPE_FRONTEND_SUCCESS_URL } from "server/constants/env";
import { SUBSCRIPTION_STATUS } from "../../../shared/constants";

// Extend Express Request type to include rawBody
declare module "express-serve-static-core" {
  interface Request {
    rawBody?: Buffer;
  }
}

/**
 * Helper function to extract the payment/subscription ID from a Stripe checkout session
 * For subscription mode, returns the subscription ID
 * For one-time payment mode, returns the payment intent ID
 */
function getStripePaymentId(session: Stripe.Checkout.Session): string {
  return (session.payment_intent || session.subscription) as string;
}

/**
 * @swagger
 * /api/student/create-checkout-session:
 *   post:
 *     summary: Create a Stripe Checkout session for plan purchase
 *     tags: [Student - Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID of the plan to purchase
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     url:
 *                       type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
export function registerStudentPaymentRoutes(app: Express): void {
  app.post("/api/student/create-checkout-session", isAuthenticated, async (req, res) => {
    try {
      const { planId, quantity = 1 } = req.body;
      const userId = req.userId;

      if (!planId) {
        return sendError(
          res,
          "プランIDが必要です",
          "MISSING_PLAN_ID",
          400
        );
      }

      if (!userId) {
        return sendError(
          res,
          "ユーザーが認証されていません",
          "UNAUTHORIZED",
          401
        );
      }

      // Validate quantity
      if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1) {
        return sendError(
          res,
          "数量は1以上である必要があります",
          "INVALID_QUANTITY",
          400
        );
      }

      // Fetch the plan details
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, planId))
        .limit(1);

      if (!plan) {
        return sendError(
          res,
          "プランが見つかりません",
          "PLAN_NOT_FOUND",
          404
        );
      }

      if (!plan.isActive) {
        return sendError(
          res,
          "このプランは現在利用できません",
          "PLAN_NOT_ACTIVE",
          400
        );
      }

      // // Validate FRONTEND_URL is set
      // if (!process.env.FRONTEND_URL ) {
      //   return sendError(
      //     res,
      //     "サーバーの設定が不完全です",
      //     "FRONTEND_URL_NOT_SET",
      //     500
      //   );
      // }

      // Create a payment record
      const totalAmount = parseFloat(plan.price) * quantity;
      const [payment] = await db
        .insert(payments)
        .values({
          userId,
          planId: plan.id,
          amount: String(totalAmount),
          currency: "JPY",
          paymentMethod: "credit_card",
          status: "pending",
          description: `${plan.name}プラン購入${quantity > 1 ? ` x ${quantity}` : ''}`,
          quantity: quantity,
        })
        .returning();

      // Create Stripe Checkout session
      // If plan is not an additional option, create a subscription; otherwise, one-time payment
      const isSubscription = !plan.isAdditionalOption;
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: plan.name,
                description: plan.description || `${plan.totalLessons}レッスン / ${plan.durationDays}日間`,
              },
              unit_amount: Math.round(parseFloat(plan.price)), // JPY is zero-decimal currency
              ...(isSubscription && {
                recurring: {
                  interval: "month",
                  interval_count: 1,
                },
              }),
            },
            quantity: quantity,
          },
        ],
        mode: isSubscription ? "subscription" : "payment",
        success_url: `${process.env.FRONTEND_URL || DEFAULT_STRIPE_FRONTEND_SUCCESS_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || DEFAULT_STRIPE_FRONTEND_SUCCESS_URL}/payment-cancel`,
        client_reference_id: userId,
        metadata: {
          paymentId: payment.id,
          planId: plan.id,
          userId,
          quantity: String(quantity), // Stripe metadata only accepts strings
        },
      });

      // Update payment record with Stripe session ID
      await db
        .update(payments)
        .set({
          stripeSessionId: session.id,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      return sendSuccess(res, {
        sessionId: session.id,
        url: session.url,
      });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return sendError(
        res,
        "チェックアウトセッションの作成に失敗しました",
        "CHECKOUT_SESSION_FAILED",
        500
      );
    }
  });

  /**
   * @swagger
   * /api/student/payment-status/{sessionId}:
   *   get:
   *     summary: Get payment status by Stripe session ID
   *     tags: [Student - Payments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sessionId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Payment status retrieved
   *       404:
   *         description: Payment not found
   */
  app.get("/api/student/payment-status/:sessionId", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;

      if (!userId) {
        return sendError(
          res,
          "ユーザーが認証されていません",
          "UNAUTHORIZED",
          401
        );
      }

      // Find payment by session ID
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.stripeSessionId, sessionId))
        .limit(1);

      if (!payment) {
        return sendError(
          res,
          "支払いが見つかりません",
          "PAYMENT_NOT_FOUND",
          404
        );
      }

      // Verify the payment belongs to the user
      if (payment.userId !== userId) {
        return sendError(
          res,
          "この支払いにアクセスする権限がありません",
          "UNAUTHORIZED",
          403
        );
      }

      // Get plan details if planId exists
      let planDetails = null;
      if (payment.planId) {
        const [plan] = await db
          .select()
          .from(plans)
          .where(eq(plans.id, payment.planId))
          .limit(1);
        planDetails = plan;
      }

      return sendSuccess(res, {
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          description: payment.description,
          createdAt: payment.createdAt,
        },
        plan: planDetails ? {
          id: planDetails.id,
          name: planDetails.name,
          price: planDetails.price,
          totalLessons: planDetails.totalLessons,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching payment status:", error);
      return sendError(
        res,
        "支払いステータスの取得に失敗しました",
        "FETCH_PAYMENT_STATUS_FAILED",
        500
      );
    }
  });

  /**
   * @swagger
   * /api/student/payments/verify:
   *   post:
   *     summary: Verify payment status and add lessons if successful
   *     tags: [Student - Payments]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - sessionId
   *             properties:
   *               sessionId:
   *                 type: string
   *                 description: Stripe checkout session ID
   *     responses:
   *       200:
   *         description: Payment status verified
   *       404:
   *         description: Payment not found
   */
  app.post("/api/student/payments/verify", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.body;
      const userId = req.userId;

      if (!sessionId) {
        return sendError(
          res,
          "セッションIDが必要です",
          "MISSING_SESSION_ID",
          400
        );
      }

      if (!userId) {
        return sendError(
          res,
          "ユーザーが認証されていません",
          "UNAUTHORIZED",
          401
        );
      }

      // Find payment by session ID
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.stripeSessionId, sessionId))
        .limit(1);

      if (!payment) {
        return sendError(
          res,
          "支払いが見つかりません",
          "PAYMENT_NOT_FOUND",
          404
        );
      }

      // Verify the payment belongs to the user
      if (payment.userId !== userId) {
        return sendError(
          res,
          "この支払いにアクセスする権限がありません",
          "UNAUTHORIZED",
          403
        );
      }

      // Check Stripe session status
      let stripeSession: Stripe.Checkout.Session | null = null;
      try {
        stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (stripeError) {
        console.error("Error retrieving Stripe session:", stripeError);
      }

      // If Stripe session is paid and payment is not yet completed, update it
      if (stripeSession && stripeSession.payment_status === "paid" && payment.status !== "completed") {
        // Extract the appropriate payment/subscription ID
        const stripePaymentId = getStripePaymentId(stripeSession);
        
        // Update payment status
        await db
          .update(payments)
          .set({
            status: "completed",
            stripePaymentId,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, payment.id));

        // Create user subscription if planId exists
        if (payment.planId) {
          const [plan] = await db
            .select()
            .from(plans)
            .where(eq(plans.id, payment.planId))
            .limit(1);

          if (plan) {
            // If this is a subscription plan (not an additional option), cancel existing active subscriptions
            if (!plan.isAdditionalOption) {
              // Get existing subscriptions to cancel their Stripe subscriptions
              const existingSubscriptions = await db
                .select()
                .from(userSubscriptions)
                .where(
                  and(
                    eq(userSubscriptions.userId, payment.userId),
                    eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
                  )
                );

              // Cancel Stripe subscriptions
              for (const existingSub of existingSubscriptions) {
                if (existingSub.stripeSubscriptionId) {
                  try {
                    await stripe.subscriptions.cancel(existingSub.stripeSubscriptionId);
                  } catch (error) {
                    console.error(`Failed to cancel Stripe subscription ${existingSub.stripeSubscriptionId}:`, error);
                    // Continue even if Stripe cancellation fails
                  }
                }
              }

              // Update database to mark subscriptions as cancelled
              await db
                .update(userSubscriptions)
                .set({
                  status: SUBSCRIPTION_STATUS.CANCELLED,
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(userSubscriptions.userId, payment.userId),
                    eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
                  )
                );
            }

            const startDate = new Date();
            // Don't set expiry date on creation - it will be set when needed
            const expiryDate = null;

            const quantity = payment.quantity || 1;
            const totalLessonsToAdd = plan.totalLessons * quantity;

            // Get Stripe subscription ID if this is a subscription
            const stripeSubscriptionId = !plan.isAdditionalOption && stripeSession.subscription 
              ? (stripeSession.subscription as string)
              : null;

            await db.insert(userSubscriptions).values({
              userId: payment.userId,
              planId: plan.id,
              remainingLessons: totalLessonsToAdd,
              totalLessons: totalLessonsToAdd,
              startDate,
              expiryDate,
              status: SUBSCRIPTION_STATUS.ACTIVE,
              stripeSubscriptionId,
            });

            // Increment user's totalLessons
            await db
              .update(users)
              .set({
                totalLessons: sql`${users.totalLessons} + ${totalLessonsToAdd}`,
                updatedAt: new Date(),
              })
              .where(eq(users.id, payment.userId));
          }
        }

        // Refresh payment data
        const [updatedPayment] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, payment.id))
          .limit(1);

        // Get plan details if planId exists
        let planDetails = null;
        if (updatedPayment.planId) {
          const [plan] = await db
            .select()
            .from(plans)
            .where(eq(plans.id, updatedPayment.planId))
            .limit(1);
          planDetails = plan;
        }

        return sendSuccess(res, {
          payment: {
            id: updatedPayment.id,
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            status: updatedPayment.status,
            description: updatedPayment.description,
            createdAt: updatedPayment.createdAt,
          },
          plan: planDetails ? {
            id: planDetails.id,
            name: planDetails.name,
            price: planDetails.price,
            totalLessons: planDetails.totalLessons,
          } : null,
        });
      }

      // Get plan details if planId exists
      let planDetails = null;
      if (payment.planId) {
        const [plan] = await db
          .select()
          .from(plans)
          .where(eq(plans.id, payment.planId))
          .limit(1);
        planDetails = plan;
      }

      return sendSuccess(res, {
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          description: payment.description,
          createdAt: payment.createdAt,
        },
        plan: planDetails ? {
          id: planDetails.id,
          name: planDetails.name,
          price: planDetails.price,
          totalLessons: planDetails.totalLessons,
        } : null,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      return sendError(
        res,
        "支払いの確認に失敗しました",
        "VERIFY_PAYMENT_FAILED",
        500
      );
    }
  });

  /**
   * @swagger
   * /api/webhooks/stripe:
   *   post:
   *     summary: Stripe webhook endpoint
   *     tags: [Webhooks]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Webhook processed
   *       400:
   *         description: Invalid webhook
   */
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];

      if (!sig) {
        return res.status(400).send("Missing stripe-signature header");
      }

      let event: Stripe.Event;

      // Verify webhook signature using raw body
      if (stripeWebhookSecret) {
        try {
          const rawBody = req.rawBody as Buffer;
          event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            stripeWebhookSecret
          );
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return res.status(400).send("Invalid signature");
        }
      } else {
        // In development, if webhook secret is not set, use the event from body
        event = req.body;
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Find the payment by session ID
          const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.stripeSessionId, session.id))
            .limit(1);

          if (payment) {
            // Extract the appropriate payment/subscription ID
            const stripePaymentId = getStripePaymentId(session);
            
            // Update payment status
            await db
              .update(payments)
              .set({
                status: "completed",
                stripePaymentId,
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id));

            // Create user subscription if planId exists
            if (payment.planId) {
              const [plan] = await db
                .select()
                .from(plans)
                .where(eq(plans.id, payment.planId))
                .limit(1);

              if (plan) {
                // If this is a subscription plan (not an additional option), cancel existing active subscriptions
                if (!plan.isAdditionalOption) {
                  // Get existing subscriptions to cancel their Stripe subscriptions
                  const existingSubscriptions = await db
                    .select()
                    .from(userSubscriptions)
                    .where(
                      and(
                        eq(userSubscriptions.userId, payment.userId),
                        eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
                      )
                    );

                  // Cancel Stripe subscriptions
                  for (const existingSub of existingSubscriptions) {
                    if (existingSub.stripeSubscriptionId) {
                      try {
                        await stripe.subscriptions.cancel(existingSub.stripeSubscriptionId);
                      } catch (error) {
                        console.error(`Failed to cancel Stripe subscription ${existingSub.stripeSubscriptionId}:`, error);
                        // Continue even if Stripe cancellation fails
                      }
                    }
                  }

                  // Update database to mark subscriptions as cancelled
                  await db
                    .update(userSubscriptions)
                    .set({
                      status: SUBSCRIPTION_STATUS.CANCELLED,
                      updatedAt: new Date(),
                    })
                    .where(
                      and(
                        eq(userSubscriptions.userId, payment.userId),
                        eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
                      )
                    );
                }

                const startDate = new Date();
                // Don't set expiry date on creation - it will be set when needed
                const expiryDate = null;

                const quantity = payment.quantity || 1;
                const totalLessonsToAdd = plan.totalLessons * quantity;

                // Get Stripe subscription ID if this is a subscription
                const stripeSubscriptionId = !plan.isAdditionalOption && session.subscription 
                  ? (session.subscription as string)
                  : null;

                await db.insert(userSubscriptions).values({
                  userId: payment.userId,
                  planId: plan.id,
                  remainingLessons: totalLessonsToAdd,
                  totalLessons: totalLessonsToAdd,
                  startDate,
                  expiryDate,
                  status: SUBSCRIPTION_STATUS.ACTIVE,
                  stripeSubscriptionId,
                });

                // Increment user's totalLessons
                await db
                  .update(users)
                  .set({
                    totalLessons: sql`${users.totalLessons} + ${totalLessonsToAdd}`,
                    updatedAt: new Date(),
                  })
                  .where(eq(users.id, payment.userId));
              }
            }
          }
          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Find and update the payment
          const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.stripeSessionId, session.id))
            .limit(1);

          if (payment) {
            await db
              .update(payments)
              .set({
                status: "failed",
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id));
          }
          break;
        }

        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // Find payment by Stripe payment intent ID
          const [payment] = await db
            .select()
            .from(payments)
            .where(eq(payments.stripePaymentId, paymentIntent.id))
            .limit(1);

          if (payment) {
            await db
              .update(payments)
              .set({
                status: "failed",
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id));
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).send("Webhook processing failed");
    }
  });
}
