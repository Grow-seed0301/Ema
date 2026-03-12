import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import { db } from "../../db";
import { bookings, transferRequests, teachers } from "../../../shared/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { formatDateWithDots } from "../../utils/dateTime";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import {
  ACCOUNT_TYPES,
  TRANSFER_FEE,
  MAX_TRANSFERS_PER_MONTH,
  ESTIMATED_PROCESSING_DAYS,
  BANK_ACCOUNT_VALIDATION,
} from "../../../shared/rewards";

/**
 * Teacher Rewards Management Routes
 * Handles reward tracking, bank account info, and transfer requests
 */

export function setupTeacherRewardsRoutes(app: Express) {
  /**
   * GET /api/teacher/rewards/summary
   * Get reward summary including available balance and monthly earnings
   */
  app.get("/api/teacher/rewards/summary", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teacherId = req.userId || req.session.userId!;

      // Calculate total earnings from completed bookings
      const totalEarningsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${bookings.price}), 0)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.teacherId, teacherId),
            eq(bookings.status, "completed"),
          )
        );

      const totalEarnings = Number(totalEarningsResult[0]?.total || 0);

      // Calculate total transferred amount
      const transferredResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transferRequests.amount}), 0)`,
        })
        .from(transferRequests)
        .where(
          and(
            eq(transferRequests.teacherId, teacherId),
            eq(transferRequests.status, "completed")
          )
        );

      const transferred = Number(transferredResult[0]?.total || 0);

      // Calculate available balance (total earnings - transferred)
      const availableBalance = totalEarnings - transferred;

      // Calculate predicted earnings (pending bookings)
      const predictedResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${bookings.price}), 0)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.teacherId, teacherId),
            eq(bookings.status, "confirmed"),
          )
        );

      const predictedEarnings = Number(predictedResult[0]?.total || 0);

      // Get monthly earnings for the last 6 months
      const monthlyResult = await db
        .select({
          month: sql<string>`TO_CHAR(${bookings.date}, 'YYYY-MM')`,
          amount: sql<number>`COALESCE(SUM(${bookings.price}), 0)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.teacherId, teacherId),
            eq(bookings.status, "completed"),
            gte(bookings.date, sql`NOW() - INTERVAL '6 months'`)
          )
        )
        .groupBy(sql`TO_CHAR(${bookings.date}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${bookings.date}, 'YYYY-MM')`);

      // Format monthly data with Japanese month labels
      const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
      const maxAmount = Math.max(...monthlyResult.map(m => Number(m.amount)), 1);
      
      const monthlyData = monthlyResult.map(m => {
        const [year, monthNum] = m.month.split('-');
        const monthIndex = parseInt(monthNum) - 1;
        const amount = Number(m.amount);
        return {
          month: monthNames[monthIndex],
          amount,
          height: Math.round((amount / maxAmount) * 100),
        };
      });

      const summary = {
        availableBalance,
        predictedEarnings,
        monthlyData,
      };

      sendSuccess(res, summary);
    } catch (error) {
      console.error("Error fetching reward summary:", error);
      sendError(res, "Failed to fetch reward summary", "FETCH_FAILED", 500);
    }
  });

  /**
   * GET /api/teacher/rewards/history
   * Get reward history with pagination
   */
  app.get("/api/teacher/rewards/history", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teacherId = req.userId || req.session.userId!;
      const { month, page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      // Build query conditions
      const conditions = [
        eq(bookings.teacherId, teacherId),
        sql`${bookings.price} > 0`,
      ];

      // Add month filter if provided (format: YYYY-MM)
      if (month && typeof month === 'string') {
        conditions.push(sql`TO_CHAR(${bookings.date}, 'YYYY-MM') = ${month}`);
      }

      // Get bookings with student information
      const bookingsList = await db
        .select({
          id: bookings.id,
          date: bookings.date,
          lessonType: bookings.lessonType,
          price: bookings.price,
          status: bookings.status,
          studentId: bookings.studentId,
        })
        .from(bookings)
        .where(and(...conditions))
        .orderBy(desc(bookings.date))
        .limit(limitNum)
        .offset(offset);

      // Get student names for the bookings
      const items = await Promise.all(
        bookingsList.map(async (booking) => {
          const student = await storage.getUser(booking.studentId);
          return {
            id: booking.id,
            date: formatDateWithDots(booking.date),
            studentName: student?.name || "Unknown",
            lessonType: booking.lessonType,
            amount: Number(booking.price),
            status: booking.status === "completed" ? "完了" : booking.status === "confirmed" ? "確認済み" : booking.status,
          };
        })
      );

      // Calculate monthly total
      const monthlyTotalResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${bookings.price}), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(bookings)
        .where(and(...conditions));

      const monthlyTotal = Number(monthlyTotalResult[0]?.total || 0);
      const count = Number(monthlyTotalResult[0]?.count || 0);

      // Format month for display
      let displayMonth = month as string;
      if (month && typeof month === 'string') {
        const [year, monthNum] = month.split('-');
        displayMonth = `${year}年${parseInt(monthNum)}月`;
      }

      const history = {
        month: displayMonth,
        monthlyTotal,
        count,
        items,
        hasMore: count > pageNum * limitNum,
      };

      sendSuccess(res, history);
    } catch (error) {
      console.error("Error fetching reward history:", error);
      sendError(res, "Failed to fetch reward history", "FETCH_FAILED", 500);
    }
  });

  /**
   * GET /api/teacher/rewards/bank-account
   * Get teacher's bank account information
   */
  app.get("/api/teacher/rewards/bank-account", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teacherId = req.userId || req.session.userId!;

      // Get teacher's bank account information
      const [teacher] = await db
        .select({
          bankName: teachers.bankName,
          branchName: teachers.branchName,
          branchCode: teachers.branchCode,
          accountType: teachers.accountType,
          accountNumber: teachers.accountNumber,
          accountHolder: teachers.accountHolder,
        })
        .from(teachers)
        .where(eq(teachers.id, teacherId));

      if (!teacher) {
        sendError(res, "Teacher not found", "NOT_FOUND", 404);
        return;
      }

      const bankAccount = {
        bankName: teacher.bankName || "",
        branchName: teacher.branchName || "",
        branchCode: teacher.branchCode || "",
        accountType: teacher.accountType || "",
        accountNumber: teacher.accountNumber || "",
        accountHolder: teacher.accountHolder || "",
      };

      sendSuccess(res, bankAccount);
    } catch (error) {
      console.error("Error fetching bank account:", error);
      sendError(res, "Failed to fetch bank account information", "FETCH_FAILED", 500);
    }
  });

  /**
   * PUT /api/teacher/rewards/bank-account
   * Update teacher's bank account information
   */
  app.put("/api/teacher/rewards/bank-account", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teacherId = req.userId || req.session.userId!;
      const { bankName, branchName, branchCode, accountType, accountNumber, accountHolder } = req.body;

      // Validate required fields
      if (!bankName || !branchName || !branchCode || !accountType || !accountNumber || !accountHolder) {
        sendError(res, "All fields are required", "VALIDATION_ERROR", 400);
        return;
      }

      // Validate account number (should be 7 digits)
      if (!BANK_ACCOUNT_VALIDATION.ACCOUNT_NUMBER_PATTERN.test(accountNumber)) {
        sendError(res, `Account number must be ${BANK_ACCOUNT_VALIDATION.ACCOUNT_NUMBER_LENGTH} digits`, "VALIDATION_ERROR", 400);
        return;
      }

      // Validate account type
      if (![ACCOUNT_TYPES.ORDINARY, ACCOUNT_TYPES.CURRENT].includes(accountType)) {
        sendError(res, "Invalid account type", "VALIDATION_ERROR", 400);
        return;
      }

      // Update teacher's bank account information
      await db
        .update(teachers)
        .set({
          bankName,
          branchName,
          branchCode,
          accountType,
          accountNumber,
          accountHolder,
          updatedAt: new Date(),
        })
        .where(eq(teachers.id, teacherId));

      sendSuccess(res, { 
        success: true, 
        message: "Bank account information updated successfully" 
      });
    } catch (error) {
      console.error("Error updating bank account:", error);
      sendError(res, "Failed to update bank account information", "UPDATE_FAILED", 500);
    }
  });

  /**
   * POST /api/teacher/rewards/transfer-request
   * Submit a transfer request
   */
  app.post("/api/teacher/rewards/transfer-request", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teacherId = req.userId || req.session.userId!;
      const { amount } = req.body;

      // Validate amount
      if (!amount || typeof amount !== "number" || amount <= 0) {
        sendError(res, "Invalid transfer amount", "VALIDATION_ERROR", 400);
        return;
      }

      // Calculate available balance
      const totalEarningsResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${bookings.price}), 0)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.teacherId, teacherId),
            eq(bookings.status, "completed"),
          )
        );

      const totalEarnings = Number(totalEarningsResult[0]?.total || 0);

      const transferredResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transferRequests.amount}), 0)`,
        })
        .from(transferRequests)
        .where(
          and(
            eq(transferRequests.teacherId, teacherId),
            eq(transferRequests.status, "completed")
          )
        );

      const transferred = Number(transferredResult[0]?.total || 0);
      const availableBalance = totalEarnings - transferred;

      if (amount > availableBalance) {
        sendError(res, "Insufficient available balance", "INSUFFICIENT_BALANCE", 400);
        return;
      }

      // Check if teacher already has a pending transfer request this month
      const currentMonthStart = sql`DATE_TRUNC('month', CURRENT_DATE)`;
      const pendingRequestsThisMonth = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(transferRequests)
        .where(
          and(
            eq(transferRequests.teacherId, teacherId),
            eq(transferRequests.status, "pending"),
            sql`${transferRequests.requestDate} >= ${currentMonthStart}`
          )
        );

      const pendingCount = Number(pendingRequestsThisMonth[0]?.count || 0);
      if (pendingCount >= MAX_TRANSFERS_PER_MONTH) {
        sendError(res, `Maximum ${MAX_TRANSFERS_PER_MONTH} pending transfer request per month allowed`, "LIMIT_EXCEEDED", 400);
        return;
      }

      // Calculate net amount after fee
      const netAmount = amount - TRANSFER_FEE;

      // Insert transfer request into database
      const [newTransferRequest] = await db
        .insert(transferRequests)
        .values({
          teacherId,
          amount: amount.toString(),
          transferFee: TRANSFER_FEE.toString(),
          netAmount: netAmount.toString(),
          status: "pending",
          requestDate: new Date(),
        })
        .returning({ id: transferRequests.id });

      sendSuccess(res, {
        success: true,
        message: "Transfer request submitted successfully",
        transferId: newTransferRequest.id,
        requestedAmount: amount,
        transferFee: TRANSFER_FEE,
        netAmount,
        estimatedProcessingDays: ESTIMATED_PROCESSING_DAYS,
      });
    } catch (error) {
      console.error("Error processing transfer request:", error);
      sendError(res, "Failed to process transfer request", "PROCESS_FAILED", 500);
    }
  });

  /**
   * GET /api/teacher/rewards/transfers
   * Get list of transfer requests
   */
  app.get("/api/teacher/rewards/transfers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const teacherId = req.userId || req.session.userId!;

      // Get all transfer requests for the teacher
      const transferList = await db
        .select({
          id: transferRequests.id,
          requestDate: transferRequests.requestDate,
          amount: transferRequests.amount,
          transferFee: transferRequests.transferFee,
          netAmount: transferRequests.netAmount,
          status: transferRequests.status,
          completedDate: transferRequests.completedDate,
          notes: transferRequests.notes,
        })
        .from(transferRequests)
        .where(eq(transferRequests.teacherId, teacherId))
        .orderBy(desc(transferRequests.requestDate));

      const items = transferList.map((transfer) => ({
        id: transfer.id,
        requestDate: formatDateWithDots(transfer.requestDate),
        amount: Number(transfer.amount),
        transferFee: Number(transfer.transferFee),
        netAmount: Number(transfer.netAmount),
        status: transfer.status,
        completedDate: formatDateWithDots(transfer.completedDate),
        notes: transfer.notes,
      }));

      sendSuccess(res, { items });
    } catch (error) {
      console.error("Error fetching transfer requests:", error);
      sendError(res, "Failed to fetch transfer requests", "FETCH_FAILED", 500);
    }
  });
}
