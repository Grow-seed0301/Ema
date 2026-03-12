import type { Express } from "express";
import { db } from "../../db";
import { plans, userSubscriptions } from "../../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { isAuthenticated } from "../../auth";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { SUBSCRIPTION_STATUS } from "../../../shared/constants";
import { stripe } from "../../stripe";

/**
 * @swagger
 * /api/student/plans:
 *   get:
 *     summary: Get all active subscription plans
 *     tags: [Student - Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active subscription plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       durationDays:
 *                         type: number
 *                       lessonsPerMonth:
 *                         type: number
 *                       features:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isRecommended:
 *                         type: boolean
 */
export function registerStudentPlanRoutes(app: Express): void {
  app.get("/api/student/plans", isAuthenticated, async (req, res) => {
    try {
      // Fetch all active plans from the database that are NOT additional options
      const activePlans = await db
        .select()
        .from(plans)
        .where(and(eq(plans.isActive, true), eq(plans.isAdditionalOption, false)))
        .orderBy(plans.sortOrder);

      // Transform the data to match the expected frontend format
      const formattedPlans = activePlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        durationDays: plan.durationDays,
        lessonsPerMonth: plan.totalLessons,
        features: plan.features || [],
        isRecommended: plan.isRecommended ?? false,
      }));

      return sendSuccess(res, formattedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      return sendError(
        res,
        "プランの取得に失敗しました",
        "INTERNAL_SERVER_ERROR",
        500
      );
    }
  });

  app.get("/api/student/plans/options", isAuthenticated, async (req, res) => {
    try {
      // Fetch all active plans that are additional options
      const additionalOptions = await db
        .select()
        .from(plans)
        .where(and(eq(plans.isActive, true), eq(plans.isAdditionalOption, true)))
        .orderBy(plans.sortOrder);

      // Transform the data to match the expected frontend format
      // For additional options, the field mapping is:
      // - description: Used as the unit (e.g., "回" for per-time pricing)
      // - features[0]: Used as the main description text
      // This allows reusing existing plan fields without adding new columns
      const formattedOptions = additionalOptions.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: parseFloat(plan.price),
        unit: "回",
        description: "",
        features: plan.features || [],
      }));

      return sendSuccess(res, formattedOptions);
    } catch (error) {
      console.error("Error fetching additional options:", error);
      return sendError(
        res,
        "追加オプションの取得に失敗しました",
        "INTERNAL_SERVER_ERROR",
        500
      );
    }
  });

  /**
   * @swagger
   * /api/student/subscriptions/current:
   *   get:
   *     summary: Get current active subscription
   *     tags: [Student - Plans]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current active subscription or null if none
   */
  app.get("/api/student/subscriptions/current", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;

      if (!userId) {
        return sendError(
          res,
          "ユーザーが認証されていません",
          "UNAUTHORIZED",
          401
        );
      }

      // Fetch active subscriptions for the user
      // We only check status, not expiryDate, because:
      // 1. Active subscriptions should be shown even if expiryDate has passed
      // 2. The system will update status to 'expired' when appropriate
      // 3. Users should see their subscription until it's explicitly cancelled or expired by the system
      const activeSubscriptions = await db
        .select({
          subscription: userSubscriptions,
          plan: plans,
        })
        .from(userSubscriptions)
        .leftJoin(plans, eq(userSubscriptions.planId, plans.id))
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
          )
        )
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);

      if (activeSubscriptions.length === 0) {
        return sendSuccess(res, null);
      }

      const { subscription, plan } = activeSubscriptions[0];

      if (!plan) {
        return sendSuccess(res, null);
      }

      return sendSuccess(res, {
        id: subscription.id,
        planId: plan.id,
        planName: plan.name,
        price: parseFloat(plan.price),
        remainingLessons: subscription.remainingLessons,
        totalLessons: subscription.totalLessons,
        startDate: subscription.startDate?.toISOString(),
        expiryDate: subscription.expiryDate?.toISOString() || null,
        status: subscription.status,
      });
    } catch (error) {
      console.error("Error fetching current subscription:", error);
      return sendError(
        res,
        "現在のサブスクリプションの取得に失敗しました",
        "INTERNAL_SERVER_ERROR",
        500
      );
    }
  });

  /**
   * @swagger
   * /api/student/subscriptions/unsubscribe:
   *   post:
   *     summary: Cancel current subscription
   *     tags: [Student - Plans]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - subscriptionId
   *             properties:
   *               subscriptionId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Subscription cancelled successfully
   */
  app.post("/api/student/subscriptions/unsubscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const { subscriptionId } = req.body;

      if (!userId) {
        return sendError(
          res,
          "ユーザーが認証されていません",
          "UNAUTHORIZED",
          401
        );
      }

      if (!subscriptionId) {
        return sendError(
          res,
          "サブスクリプションIDが必要です",
          "MISSING_SUBSCRIPTION_ID",
          400
        );
      }

      // Find the subscription
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.id, subscriptionId))
        .limit(1);

      if (!subscription) {
        return sendError(
          res,
          "サブスクリプションが見つかりません",
          "SUBSCRIPTION_NOT_FOUND",
          404
        );
      }

      // Verify the subscription belongs to the user
      if (subscription.userId !== userId) {
        return sendError(
          res,
          "このサブスクリプションにアクセスする権限がありません",
          "UNAUTHORIZED",
          403
        );
      }

      // Check if already cancelled
      if (subscription.status === SUBSCRIPTION_STATUS.CANCELLED) {
        return sendError(
          res,
          "このサブスクリプションは既にキャンセルされています",
          "ALREADY_CANCELLED",
          400
        );
      }

      // Cancel the Stripe subscription if it exists
      if (subscription.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        } catch (error) {
          console.error(`Failed to cancel Stripe subscription ${subscription.stripeSubscriptionId}:`, error);
          // Continue with local cancellation even if Stripe fails
          // This ensures the user sees the subscription as cancelled in the app
        }
      }

      // Update subscription status to cancelled
      await db
        .update(userSubscriptions)
        .set({
          status: SUBSCRIPTION_STATUS.CANCELLED,
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, subscriptionId));

      return sendSuccess(res, {
        message: "サブスクリプションがキャンセルされました",
        subscriptionId,
      });
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return sendError(
        res,
        "サブスクリプションのキャンセルに失敗しました",
        "CANCEL_SUBSCRIPTION_FAILED",
        500
      );
    }
  });
}
