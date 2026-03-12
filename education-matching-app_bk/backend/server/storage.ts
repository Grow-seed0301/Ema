import {
  users,
  teachers,
  plans,
  userSubscriptions,
  bookings,
  reviews,
  payments,
  transferRequests,
  admins,
  favorites,
  inquiries,
  chats,
  chatMessages,
  passwordResetTokens,
  emailLogs,
  errorLogs,
  teacherAvailability,
  termsOfService,
  privacyPolicy,
  faqCategories,
  faqs,
  adminSettings,
  teacherCredentials,
  subjectCategories,
  subjects,
  subjectGroups,
  type User,
  type UserWithPlan,
  type UpsertUser,
  type Teacher,
  type UpsertTeacher,
  type InsertTeacher,
  type Plan,
  type InsertPlan,
  type Booking,
  type Payment,
  type InsertUser,
  type InsertAdmin,
  type Admin,
  type Review,
  type TransferRequest,
  type InsertTransferRequest,
  type Inquiry,
  type InsertInquiry,
  type Chat,
  type InsertChat,
  type ChatMessage,
  type InsertChatMessage,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailLog,
  type InsertEmailLog,
  type ErrorLog,
  type InsertErrorLog,
  type TeacherAvailability,
  type InsertTeacherAvailability,
  type TermsOfService,
  type UpdateTermsOfService,
  type PrivacyPolicy,
  type UpdatePrivacyPolicy,
  type FaqCategory,
  type InsertFaqCategory,
  type UpdateFaqCategory,
  type Faq,
  type InsertFaq,
  type UpdateFaq,
  type AdminSettings,
  type UpdateAdminSettings,
  type TeacherCredential,
  type InsertTeacherCredential,
  type UpdateTeacherCredential,
  type SubjectCategory,
  type InsertSubjectCategory,
  type UpdateSubjectCategory,
  type Subject,
  type InsertSubject,
  type UpdateSubject,
  type SubjectGroup,
  type InsertSubjectGroup,
  type UpdateSubjectGroup,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, like, or, count, gte, lte, inArray, leftJoin, innerJoin } from "drizzle-orm";
import { SUBSCRIPTION_STATUS } from "@shared/constants";
import { calculateTeacherCompensation } from "./utils/teacherCompensation";

export interface IStorage {
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  getUser(id: string): Promise<UserWithPlan | undefined>;
  getUserByEmail(email: string): Promise<UserWithPlan | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getAllUsers(params: { page: number; limit: number; search?: string; status?: string }): Promise<{ users: User[]; total: number }>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Teacher methods
  getTeacher(id: string): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  createTeacher(teacher: UpsertTeacher): Promise<Teacher>;
  upsertTeacher(teacher: UpsertTeacher): Promise<Teacher>;
  updateTeacher(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: string): Promise<boolean>;
  
  getAllTeachers(params: { page: number; limit: number; search?: string }): Promise<{ teachers: Teacher[]; total: number }>;
  searchTeachers(params: {
    page: number;
    limit: number;
    q?: string;
    subjects?: string;
    subjectGroups?: string;
    ratingMin?: number;
    gender?: string;
    experienceYears?: string;
    sortBy?: string;
    sortOrder?: string;
    userId?: string;
  }): Promise<{ teachers: Teacher[]; total: number }>;

  getAllPlans(params?: { page?: number; limit?: number }): Promise<{ plans: Plan[]; total: number; page: number; totalPages: number }>;
  getPlan(id: string): Promise<Plan | undefined>;
  createPlan(data: InsertPlan): Promise<Plan>;
  updatePlan(id: string, data: Partial<InsertPlan>): Promise<Plan | undefined>;
  deletePlan(id: string): Promise<boolean>;
  
  getAllBookings(params: { page: number; limit: number; status?: string }): Promise<{ bookings: (Booking & { student?: User; teacher?: Teacher })[]; total: number }>;
  getBooking(id: string): Promise<Booking | undefined>;
  updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined>;
  
  getAllPayments(params: { page: number; limit: number; status?: string }): Promise<{ payments: (Payment & { user?: User; plan?: Plan })[]; total: number }>;
  
  getDashboardStats(): Promise<{
    totalUsers: number;
    totalTeachers: number;
    totalLessons: number;
    totalRevenue: number;
    activeSubscriptions: number;
    pendingBookings: number;
  }>;
  
  getRevenueChart(days: number): Promise<{ date: string; revenue: number }[]>;
  getLessonChart(days: number): Promise<{ date: string; completed: number; cancelled: number }[]>;
  
  // Student-specific methods
  getRecommendedTeachers(userId: string, limit: number): Promise<(Teacher & { isFavorite: boolean })[]>;
  getFavoriteTeachers(userId: string): Promise<(Teacher & { isFavorite: boolean })[]>;
  addFavoriteTeacher(userId: string, teacherId: string): Promise<void>;
  removeFavoriteTeacher(userId: string, teacherId: string): Promise<void>;
  getFavoriteCount(teacherId: string): Promise<number>;
  getUpcomingBookings(studentId: string): Promise<(Booking & { teacher?: Teacher })[]>;
  getUserTotalLessons(userId: string): Promise<number>;
  decrementUserTotalLessons(userId: string): Promise<void>;
  createBooking(data: {
    studentId: string;
    teacherId: string;
    lessonType: string;
    date: Date;
    startTime: string;
    endTime: string;
    format?: string;
    notes?: string;
    price?: number;
  }): Promise<Booking>;
  getBookingHistory(studentId: string, params: { status?: string; page?: number; limit?: number }): Promise<{
    bookings: (Booking & { teacher?: Teacher; hasReview?: boolean })[];
    total: number;
  }>;
  
  // Teacher-specific methods
  getTeacherBookings(teacherId: string, params: { status?: string; page?: number; limit?: number }): Promise<{
    bookings: (Booking & { student?: User; hasReview?: boolean; review?: Review })[];
    total: number;
  }>;
  hasTeacherStudentBooking(teacherId: string, studentId: string): Promise<boolean>;
  updateBookingStatus(bookingId: string, status: string, cancelReason?: string): Promise<Booking>;
  
  getLatestReviews(limit: number): Promise<(Review & { teacher?: Teacher })[]>;
  getTeacherReviews(teacherId: string, params: { filter?: string; page?: number; limit?: number }): Promise<{
    reviews: (Review & { student?: User })[];
    stats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<string, number>;
    };
    total: number;
  }>;
  
  // Inquiry methods
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getAllInquiries(params: { page: number; limit: number; status?: string }): Promise<{ inquiries: Inquiry[]; total: number; page: number; totalPages: number }>;
  updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined>;
  
  // Chat methods
  getUserChats(userId: string): Promise<(Chat & { participant?: User | Teacher; lastMessage?: ChatMessage; unreadCount?: number })[]>;
  getChat(chatId: string): Promise<Chat | undefined>;
  getChatBetweenUsers(userId1: string, userId2: string): Promise<Chat | undefined>;
  createChat(data: InsertChat): Promise<Chat>;
  getChatMessages(chatId: string, params: { before?: string; limit: number; userId?: string }): Promise<{ messages: (ChatMessage & { isMe?: boolean })[], hasMore: boolean }>;
  sendMessage(data: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(chatId: string, userId: string): Promise<void>;
  getAllChats(params: { page: number; limit: number }): Promise<{ chats: (Chat & { participant1?: User | Teacher; participant2?: User | Teacher; lastMessage?: ChatMessage; participant1Type?: string; participant2Type?: string })[], total: number }>;
  getChatWithParticipants(chatId: string): Promise<(Chat & { participant1?: User | Teacher; participant2?: User | Teacher }) | undefined>;
  
  // Password reset methods
  createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken>;
  findPasswordResetToken(email: string, code: string, userType: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(id: string): Promise<void>;
  deletePasswordResetTokensByEmail(email: string, userType: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateTeacherPassword(teacherId: string, hashedPassword: string): Promise<void>;
  
  // Email log methods
  createEmailLog(data: InsertEmailLog): Promise<EmailLog>;
  
  // Teacher availability methods
  createTeacherAvailability(data: InsertTeacherAvailability): Promise<TeacherAvailability>;
  createTeacherAvailabilityBulk(data: InsertTeacherAvailability[]): Promise<TeacherAvailability[]>;
  getTeacherAvailability(teacherId: string, date?: Date): Promise<TeacherAvailability[]>;
  deleteTeacherAvailability(id: string): Promise<boolean>;
  deleteTeacherAvailabilityByDate(teacherId: string, date: Date): Promise<number>;
  
  // Terms of Service methods (single record, edit only)
  getTermsOfService(): Promise<TermsOfService | undefined>;
  updateTermsOfService(data: UpdateTermsOfService): Promise<TermsOfService>;
  
  // Privacy Policy methods (single record, edit only)
  getPrivacyPolicy(): Promise<PrivacyPolicy | undefined>;
  updatePrivacyPolicy(data: UpdatePrivacyPolicy): Promise<PrivacyPolicy>;
  
  // FAQ Category methods
  getAllFaqCategories(): Promise<FaqCategory[]>;
  getFaqCategory(id: string): Promise<FaqCategory | undefined>;
  createFaqCategory(data: InsertFaqCategory): Promise<FaqCategory>;
  updateFaqCategory(id: string, data: UpdateFaqCategory): Promise<FaqCategory | undefined>;
  deleteFaqCategory(id: string): Promise<boolean>;
  
  // FAQ methods
  getAllFaqs(params?: { category?: string; isActive?: boolean }): Promise<Faq[]>;
  getFaq(id: string): Promise<Faq | undefined>;
  createFaq(data: InsertFaq): Promise<Faq>;
  updateFaq(id: string, data: UpdateFaq): Promise<Faq | undefined>;
  deleteFaq(id: string): Promise<boolean>;
  
  // Teacher Credentials methods
  getTeacherCredentials(teacherId: string): Promise<TeacherCredential[]>;
  getTeacherCredential(id: string): Promise<TeacherCredential | undefined>;
  createTeacherCredential(data: InsertTeacherCredential): Promise<TeacherCredential>;
  updateTeacherCredential(id: string, data: UpdateTeacherCredential): Promise<TeacherCredential | undefined>;
  deleteTeacherCredential(id: string): Promise<boolean>;
  
  // Admin Settings methods (single record, edit only)
  getAdminSettings(): Promise<AdminSettings | undefined>;
  updateAdminSettings(data: UpdateAdminSettings): Promise<AdminSettings>;
  
  // Subject Category methods
  getAllSubjectCategories(): Promise<SubjectCategory[]>;
  getSubjectCategory(id: string): Promise<SubjectCategory | undefined>;
  createSubjectCategory(data: InsertSubjectCategory): Promise<SubjectCategory>;
  updateSubjectCategory(id: string, data: UpdateSubjectCategory): Promise<SubjectCategory | undefined>;
  deleteSubjectCategory(id: string): Promise<boolean>;
  
  // Subject methods
  getAllSubjects(categoryId?: string): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(data: InsertSubject): Promise<Subject>;
  updateSubject(id: string, data: UpdateSubject): Promise<Subject | undefined>;
  deleteSubject(id: string): Promise<boolean>;
  
  // Subject Group methods
  getAllSubjectGroups(subjectId?: string): Promise<SubjectGroup[]>;
  getSubjectGroup(id: string): Promise<SubjectGroup | undefined>;
  createSubjectGroup(data: InsertSubjectGroup): Promise<SubjectGroup>;
  updateSubjectGroup(id: string, data: UpdateSubjectGroup): Promise<SubjectGroup | undefined>;
  deleteSubjectGroup(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async createAdmin(adminData: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(adminData).returning();
    return admin;
  }

  async getUser(id: string): Promise<UserWithPlan | undefined> {
    const [result] = await db
      .select({
        user: users,
        subscription: userSubscriptions,
        plan: plans,
      })
      .from(users)
      .leftJoin(
        userSubscriptions,
        and(
          eq(users.id, userSubscriptions.userId),
          eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
        )
      )
      .leftJoin(plans, eq(userSubscriptions.planId, plans.id))
      .where(eq(users.id, id));
    
    if (!result) {
      return undefined;
    }

    // Construct user object with plan data
    const user = result.user;
    if (result.subscription && result.plan) {
      return {
        ...user,
        plan: {
          id: result.plan.id,
          name: result.plan.name,
          remainingLessons: result.subscription.remainingLessons,
          totalLessons: result.subscription.totalLessons,
          expiryDate: result.subscription.expiryDate?.toISOString(),
        },
      };
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<UserWithPlan | undefined> {
    const [result] = await db
      .select({
        user: users,
        subscription: userSubscriptions,
        plan: plans,
      })
      .from(users)
      .leftJoin(
        userSubscriptions,
        and(
          eq(users.id, userSubscriptions.userId),
          eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)
        )
      )
      .leftJoin(plans, eq(userSubscriptions.planId, plans.id))
      .where(eq(users.email, email));
    
    if (!result) {
      return undefined;
    }

    // Construct user object with plan data
    const user = result.user;
    if (result.subscription && result.plan) {
      return {
        ...user,
        plan: {
          id: result.plan.id,
          name: result.plan.name,
          remainingLessons: result.subscription.remainingLessons,
          totalLessons: result.subscription.totalLessons,
          expiryDate: result.subscription.expiryDate?.toISOString(),
        },
      };
    }

    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(params: { page: number; limit: number; search?: string; status?: string }): Promise<{ users: User[]; total: number }> {
    const { page, limit, search, status } = params;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }
    if (status && status !== "all") {
      if (status === "active") {
        conditions.push(eq(users.isActive, true));
      } else if (status === "inactive") {
        conditions.push(eq(users.isActive, false));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result, countResult] = await Promise.all([
      db.select().from(users).where(whereClause).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(users).where(whereClause),
    ]);

    return { users: result, total: countResult[0]?.count || 0 };
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) {
      return false;
    }
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Teacher CRUD methods
  async getTeacher(id: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.email, email));
    return teacher;
  }

  async createTeacher(teacherData: UpsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(teacherData).returning();
    return teacher;
  }

  async upsertTeacher(teacherData: UpsertTeacher): Promise<Teacher> {
    const [teacher] = await db
      .insert(teachers)
      .values(teacherData)
      .onConflictDoUpdate({
        target: teachers.id,
        set: {
          ...teacherData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return teacher;
  }

  async updateTeacher(id: string, data: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [teacher] = await db
      .update(teachers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teachers.id, id))
      .returning();
    return teacher;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    const teacher = await this.getTeacher(id);
    if (!teacher) {
      return false;
    }
    await db.delete(teachers).where(eq(teachers.id, id));
    return true;
  }

  async getAllTeachers(params: { page: number; limit: number; search?: string }): Promise<{ teachers: Teacher[]; total: number }> {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (search) {
      conditions.push(
        or(
          like(teachers.name, `%${search}%`),
          like(teachers.email, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result, countResult] = await Promise.all([
      whereClause 
        ? db.select().from(teachers).where(whereClause).orderBy(desc(teachers.createdAt)).limit(limit).offset(offset)
        : db.select().from(teachers).orderBy(desc(teachers.createdAt)).limit(limit).offset(offset),
      whereClause
        ? db.select({ count: count() }).from(teachers).where(whereClause)
        : db.select({ count: count() }).from(teachers),
    ]);

    return { teachers: result, total: countResult[0]?.count || 0 };
  }

  async searchTeachers(params: {
    page: number;
    limit: number;
    q?: string;
    subjects?: string;
    subjectGroups?: string;
    ratingMin?: number;
    gender?: string;
    experienceYears?: string;
    sortBy?: string;
    sortOrder?: string;
    userId?: string;
  }): Promise<{ teachers: Teacher[]; total: number }> {
    const { page, limit, q, subjects, subjectGroups, ratingMin, gender, experienceYears, sortBy, sortOrder, userId } = params;
    const offset = (page - 1) * limit;

    // Build conditions for teachers table
    let conditions = [];
    
    if (q) {
      conditions.push(
        or(
          like(teachers.name, `%${q}%`),
          like(teachers.email, `%${q}%`)
        )!
      );
    }

    if (gender) {
      conditions.push(eq(teachers.gender, gender));
    }

    // Filter by subjects and subjectGroups
    if (subjects) {
      const subjectArray = subjects.split(',').map(s => s.trim());
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM unnest(${teachers.subjects}) AS subject
          WHERE ${sql.raw(
            subjectArray
              .map(s => {
                // Escape single quotes and backslashes to prevent SQL injection
                const escaped = s.replace(/\\/g, '\\\\').replace(/'/g, "''");
                return `subject ILIKE '%${escaped}%'`;
              })
              .join(' OR ')
          )}
        )`
      );
    }

    // Filter by subject groups if provided
    if (subjectGroups) {
      try {
        const groupsObj = JSON.parse(subjectGroups);
        // Check if teacher has matching subject groups
        // Teacher's subjectGroups is a JSON object: { subjectName: [groupName1, groupName2] }
        const groupConditions: string[] = [];
        Object.entries(groupsObj).forEach(([subject, groups]) => {
          if (Array.isArray(groups) && groups.length > 0) {
            groups.forEach((group: string) => {
              // Escape single quotes and backslashes to prevent SQL injection
              const escapedSubject = subject.replace(/\\/g, '\\\\').replace(/'/g, "''");
              const escapedGroup = group.replace(/\\/g, '\\\\').replace(/'/g, "''");
              // Check if the teacher's subjectGroups JSON contains this subject->group mapping
              groupConditions.push(
                `(subject_groups->'${escapedSubject}')::jsonb ? '${escapedGroup}'`
              );
            });
          }
        });
        
        if (groupConditions.length > 0) {
          conditions.push(
            sql.raw(`(${groupConditions.join(' OR ')})`)
          );
        }
      } catch (e) {
        console.error('Error parsing subjectGroups:', e);
      }
    }

    // Filter by minimum rating
    if (ratingMin !== undefined) {
      conditions.push(gte(teachers.rating, ratingMin.toString()));
    }

    // Filter by experience years
    if (experienceYears) {
      // Frontend sends numeric values: '0', '1', '3', '5'
      // Database has: integer experienceYears field
      const yearsNum = parseInt(experienceYears, 10);
      
      if (yearsNum === 0) {
        // '1年未満': Less than 1 year (0 years or NULL)
        conditions.push(
          or(
            sql`${teachers.experienceYears} IS NULL`,
            lte(teachers.experienceYears, 0)
          )
        );
      } else {
        // '1年以上', '3年以上', '5年以上': Greater than or equal to specified years
        conditions.push(gte(teachers.experienceYears, yearsNum));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build the query
    let teacherQuery = whereClause
      ? db.select().from(teachers).where(whereClause)
      : db.select().from(teachers);

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'rating':
          teacherQuery = sortOrder === 'asc' 
            ? teacherQuery.orderBy(asc(teachers.rating))
            : teacherQuery.orderBy(desc(teachers.rating));
          break;
        case 'reviewCount':
          teacherQuery = sortOrder === 'asc'
            ? teacherQuery.orderBy(asc(teachers.reviewCount))
            : teacherQuery.orderBy(desc(teachers.reviewCount));
          break;
        case 'createdAt':
          teacherQuery = sortOrder === 'asc'
            ? teacherQuery.orderBy(asc(teachers.createdAt))
            : teacherQuery.orderBy(desc(teachers.createdAt));
          break;
        default:
          teacherQuery = teacherQuery.orderBy(desc(teachers.rating));
      }
    } else {
      teacherQuery = teacherQuery.orderBy(desc(teachers.rating));
    }

    const [allMatchingTeachers, countResult] = await Promise.all([
      teacherQuery,
      whereClause
        ? db.select({ count: count() }).from(teachers).where(whereClause)
        : db.select({ count: count() }).from(teachers),
    ]);

    // Apply pagination
    const total = countResult[0]?.count || 0;
    const paginatedTeachers = allMatchingTeachers.slice(offset, offset + limit);

    return { teachers: paginatedTeachers, total };
  }


  async getAllPlans(params?: { page?: number; limit?: number }): Promise<{ plans: Plan[]; total: number; page: number; totalPages: number }> {
    // If no pagination params provided, return all plans (for backwards compatibility)
    if (!params || !params.page) {
      const allPlans = await db.select().from(plans).orderBy(asc(plans.sortOrder));
      return {
        plans: allPlans,
        total: allPlans.length,
        page: 1,
        totalPages: 1,
      };
    }

    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const [plansResult, countResult] = await Promise.all([
      db.select()
        .from(plans)
        .orderBy(asc(plans.sortOrder))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(plans),
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      plans: plansResult,
      total,
      page,
      totalPages,
    };
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }

  async createPlan(data: InsertPlan): Promise<Plan> {
    const [plan] = await db.insert(plans).values(data).returning();
    return plan;
  }

  async updatePlan(id: string, data: Partial<InsertPlan>): Promise<Plan | undefined> {
    const [plan] = await db
      .update(plans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();
    return plan;
  }

  async deletePlan(id: string): Promise<boolean> {
    const plan = await this.getPlan(id);
    if (!plan) {
      return false;
    }
    await db.delete(plans).where(eq(plans.id, id));
    return true;
  }

  async getAllBookings(params: { page: number; limit: number; status?: string }): Promise<{ bookings: (Booking & { student?: User; teacher?: Teacher })[]; total: number }> {
    const { page, limit, status } = params;
    const offset = (page - 1) * limit;

    let whereClause = (status && status !== "all") ? eq(bookings.status, status) : undefined;

    const [bookingList, countResult] = await Promise.all([
      db.select().from(bookings).where(whereClause).orderBy(desc(bookings.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(bookings).where(whereClause),
    ]);

    const bookingsWithUsers = await Promise.all(
      bookingList.map(async (booking) => {
        const [student, teacher] = await Promise.all([
          this.getUser(booking.studentId),
          this.getTeacher(booking.teacherId),
        ]);
        return { ...booking, student, teacher };
      })
    );

    return { bookings: bookingsWithUsers, total: countResult[0]?.count || 0 };
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async getAllPayments(params: { page: number; limit: number; status?: string }): Promise<{ payments: (Payment & { user?: User; plan?: Plan })[]; total: number }> {
    const { page, limit, status } = params;
    const offset = (page - 1) * limit;

    let whereClause = (status && status !== "all") ? eq(payments.status, status) : undefined;

    const [paymentList, countResult] = await Promise.all([
      db.select().from(payments).where(whereClause).orderBy(desc(payments.createdAt)).limit(limit).offset(offset),
      db.select({ count: count() }).from(payments).where(whereClause),
    ]);

    const paymentsWithDetails = await Promise.all(
      paymentList.map(async (payment) => {
        const [user, plan] = await Promise.all([
          this.getUser(payment.userId),
          payment.planId ? this.getPlan(payment.planId) : undefined,
        ]);
        return { ...payment, user, plan };
      })
    );

    return { payments: paymentsWithDetails, total: countResult[0]?.count || 0 };
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalTeachers: number;
    totalLessons: number;
    totalRevenue: number;
    activeSubscriptions: number;
    pendingBookings: number;
  }> {
    const [
      usersCount,
      teachersCount,
      lessonsCount,
      revenueResult,
      subscriptionsCount,
      pendingCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(teachers),
      db.select({ count: count() }).from(bookings),
      db.select({ total: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)` }).from(payments).where(eq(payments.status, "completed")),
      db.select({ count: count() }).from(userSubscriptions).where(eq(userSubscriptions.status, SUBSCRIPTION_STATUS.ACTIVE)),
      db.select({ count: count() }).from(bookings).where(eq(bookings.status, "pending")),
    ]);

    return {
      totalUsers: usersCount[0]?.count || 0,
      totalTeachers: teachersCount[0]?.count || 0,
      totalLessons: lessonsCount[0]?.count || 0,
      totalRevenue: Number(revenueResult[0]?.total) || 0,
      activeSubscriptions: subscriptionsCount[0]?.count || 0,
      pendingBookings: pendingCount[0]?.count || 0,
    };
  }

  async getRevenueChart(days: number): Promise<{ date: string; revenue: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`TO_CHAR(${payments.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "completed"),
          gte(payments.createdAt, startDate)
        )
      )
      .groupBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM-DD')`);

    const chartData: { date: string; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = result.find((r) => String(r.date) === dateStr);
      chartData.push({
        date: dateStr,
        revenue: found ? Number(found.revenue) : 0,
      });
    }
    return chartData;
  }

  async getLessonChart(days: number): Promise<{ date: string; completed: number; cancelled: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`TO_CHAR(${bookings.date}, 'YYYY-MM-DD')`,
        completed: sql<number>`COUNT(CASE WHEN ${bookings.status} = 'completed' THEN 1 END)`,
        cancelled: sql<number>`COUNT(CASE WHEN ${bookings.status} = 'cancelled' THEN 1 END)`,
      })
      .from(bookings)
      .where(gte(bookings.date, startDate))
      .groupBy(sql`TO_CHAR(${bookings.date}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${bookings.date}, 'YYYY-MM-DD')`);

    const chartData: { date: string; completed: number; cancelled: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const found = result.find((r) => String(r.date) === dateStr);
      chartData.push({
        date: dateStr,
        completed: found ? Number(found.completed) : 0,
        cancelled: found ? Number(found.cancelled) : 0,
      });
    }
    return chartData;
  }

  async getRecommendedTeachers(userId: string, limit: number): Promise<(Teacher & { isFavorite: boolean })[]> {
    // Get teachers ordered by rating and review count
    const teacherList = await db
      .select()
      .from(teachers)
      .where(eq(teachers.isActive, true))
      .orderBy(
        desc(teachers.rating),
        desc(teachers.reviewCount),
        desc(teachers.createdAt)
      )
      .limit(limit);

    // Get user's favorite teachers
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    const favoriteTeacherIds = new Set(userFavorites.map(f => f.teacherId));

    // Mark favorites
    return teacherList.map(teacher => ({
      ...teacher,
      isFavorite: favoriteTeacherIds.has(teacher.id),
    }));
  }

  async getFavoriteTeachers(userId: string): Promise<(Teacher & { isFavorite: boolean })[]> {
    // Get user's favorite teacher IDs
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    const favoriteTeacherIds = userFavorites.map(f => f.teacherId);
    
    // If no favorites, return empty array
    if (favoriteTeacherIds.length === 0) {
      return [];
    }
    
    // Get teachers
    const teacherList = await db
      .select()
      .from(teachers)
      .where(and(
        inArray(teachers.id, favoriteTeacherIds),
        eq(teachers.isActive, true)
      ))
      .orderBy(desc(teachers.createdAt));
    
    // All returned teachers are favorites
    return teacherList.map(teacher => ({
      ...teacher,
      isFavorite: true,
    }));
  }

  async addFavoriteTeacher(userId: string, teacherId: string): Promise<void> {
    // Check if already favorited
    const existing = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.teacherId, teacherId)
      ))
      .limit(1);
    
    // Only insert if not already favorited
    if (existing.length === 0) {
      await db.insert(favorites).values({
        userId,
        teacherId,
      });
    }
  }

  async removeFavoriteTeacher(userId: string, teacherId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.teacherId, teacherId)
      ));
  }

  async getFavoriteCount(teacherId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.teacherId, teacherId));
    
    return Number(result[0]?.count || 0);
  }

  async getUpcomingBookings(studentId: string): Promise<(Booking & { teacher?: Teacher })[]> {
    const now = new Date();
    
    // Get future bookings with teacher info using JOIN
    const bookingsWithTeachers = await db
      .select({
        booking: bookings,
        teacher: teachers,
      })
      .from(bookings)
      .leftJoin(teachers, eq(bookings.teacherId, teachers.id))
      .where(
        and(
          eq(bookings.studentId, studentId),
          gte(bookings.date, now),
          or(
            eq(bookings.status, "pending"),
            eq(bookings.status, "confirmed")
          )
        )
      )
      .orderBy(asc(bookings.date))
      .limit(10);

    // Combine booking and teacher info
    return bookingsWithTeachers.map(({ booking, teacher }) => ({
      ...booking,
      teacher: teacher || undefined,
    }));
  }

  async getUserTotalLessons(userId: string): Promise<number> {
    const [user] = await db
      .select({ totalLessons: users.totalLessons })
      .from(users)
      .where(eq(users.id, userId));
    
    return user?.totalLessons ?? 0;
  }

  async decrementUserTotalLessons(userId: string): Promise<void> {
    // Use atomic decrement with validation to prevent negative values and race conditions
    const [result] = await db
      .update(users)
      .set({
        totalLessons: sql`GREATEST(${users.totalLessons} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, userId),
          sql`${users.totalLessons} > 0`
        )
      )
      .returning();
    
    // Verify the update was successful
    if (!result) {
      throw new Error('Failed to decrement lessons: no remaining lessons available');
    }
  }

  async createBooking(data: {
    studentId: string;
    teacherId: string;
    lessonType: string;
    date: Date;
    startTime: string;
    endTime: string;
    format?: string;
    notes?: string;
    price?: number;
  }): Promise<Booking> {
    const [booking] = await db.insert(bookings)
      .values({
        studentId: data.studentId,
        teacherId: data.teacherId,
        lessonType: data.lessonType,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        format: data.format || "online",
        status: "pending",
        notes: data.notes,
        price: data.price !== null && data.price !== undefined ? data.price.toString() : null,
      })
      .returning();
    return booking;
  }

  async getBookingHistory(studentId: string, params: { status?: string; page?: number; limit?: number }): Promise<{
    bookings: (Booking & { teacher?: Teacher; hasReview?: boolean })[];
    total: number;
  }> {
    const { status, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(bookings.studentId, studentId)];
    
    // Add status filter if provided
    if (status && status !== 'all') {
      conditions.push(eq(bookings.status, status));
    }

    const whereClause = and(...conditions);

    // Get bookings with teacher info using JOIN
    const bookingsWithTeachers = await db
      .select({
        booking: bookings,
        teacher: teachers,
        review: reviews,
      })
      .from(bookings)
      .leftJoin(teachers, eq(bookings.teacherId, teachers.id))
      .leftJoin(reviews, eq(bookings.id, reviews.bookingId))
      .where(whereClause)
      .orderBy(desc(bookings.date))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(whereClause);
    
    const total = Number(countResult?.count || 0);

    // Combine booking and teacher info
    const formattedBookings = bookingsWithTeachers.map(({ booking, teacher, review }) => ({
      ...booking,
      teacher: teacher || undefined,
      hasReview: !!review,
    }));

    return { bookings: formattedBookings, total };
  }

  async getLatestReviews(limit: number): Promise<(Review & { teacher?: Teacher })[]> {
    // Get latest reviews with teacher info using JOIN
    const reviewsWithTeachers = await db
      .select({
        review: reviews,
        teacher: teachers,
      })
      .from(reviews)
      .leftJoin(teachers, eq(reviews.teacherId, teachers.id))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);

    // Combine review and teacher info
    return reviewsWithTeachers.map(({ review, teacher }) => ({
      ...review,
      teacher: teacher || undefined,
    }));
  }

  async createReview(reviewData: {
    bookingId: string;
    studentId: string;
    teacherId: string;
    rating: number;
    content: string;
    userType?: string;
  }): Promise<Review> {
    // Check if review already exists for this booking
    const existingReview = await db
      .select()
      .from(reviews)
      .where(eq(reviews.bookingId, reviewData.bookingId))
      .limit(1);

    if (existingReview.length > 0) {
      throw new Error('Review already exists for this booking');
    }

    // Create the review
    const [review] = await db
      .insert(reviews)
      .values({
        bookingId: reviewData.bookingId,
        studentId: reviewData.studentId,
        teacherId: reviewData.teacherId,
        rating: reviewData.rating,
        content: reviewData.content,
        userType: reviewData.userType,
      })
      .returning();

    // Update teacher's rating and reviewCount using SQL aggregation
    const aggregationResult = await db
      .select({
        count: sql<number>`count(*)::int`,
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      })
      .from(reviews)
      .where(eq(reviews.teacherId, reviewData.teacherId));

    const { count: totalReviews, avgRating } = aggregationResult[0] || { count: 0, avgRating: 0 };
    const averageRating = avgRating.toFixed(2);

    // Update teacher record
    await db
      .update(teachers)
      .set({
        rating: averageRating,
        reviewCount: totalReviews,
        updatedAt: new Date(),
      })
      .where(eq(teachers.id, reviewData.teacherId));

    // Calculate and update teacher compensation based on the rating
    const compensation = calculateTeacherCompensation(reviewData.rating);
    await db
      .update(bookings)
      .set({
        price: compensation.toString(),
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, reviewData.bookingId));

    return review;
  }

  async getTeacherBookings(teacherId: string, params: { status?: string; page?: number; limit?: number }): Promise<{
    bookings: (Booking & { student?: User; hasReview?: boolean; review?: Review })[];
    total: number;
  }> {
    // Validate teacherId
    if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
      throw new Error('Invalid teacherId parameter');
    }

    const { status, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(bookings.teacherId, teacherId)];
    
    // Add status filter if provided
    if (status && status !== 'all') {
      conditions.push(eq(bookings.status, status));
    }

    const whereClause = and(...conditions);

    // Get bookings with student info using JOIN
    const bookingsWithStudents = await db
      .select({
        booking: bookings,
        student: users,
        review: reviews,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.studentId, users.id))
      .leftJoin(reviews, eq(bookings.id, reviews.bookingId))
      .where(whereClause)
      .orderBy(desc(bookings.date))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(bookings)
      .where(whereClause);

    // Format the results
    const formattedBookings = bookingsWithStudents.map(({ booking, student, review }) => ({
      ...booking,
      student: student || undefined,
      hasReview: !!review,
      review: review || undefined,
    }));

    return { bookings: formattedBookings, total };
  }

  async updateBookingStatus(bookingId: string, status: string, cancelReason?: string): Promise<Booking> {
    const updateData: Partial<Booking> = {
      status,
      updatedAt: new Date(),
    };

    if (cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();

    return updatedBooking;
  }

  async hasTeacherStudentBooking(teacherId: string, studentId: string): Promise<boolean> {
    // Check if there's any booking (past or present) between this teacher and student
    const bookingExists = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.teacherId, teacherId),
          eq(bookings.studentId, studentId)
        )
      )
      .limit(1);

    return bookingExists.length > 0;
  }

  async getTeacherReviews(teacherId: string, params: { filter?: string; page?: number; limit?: number }): Promise<{
    reviews: (Review & { student?: User })[];
    stats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<string, number>;
    };
    total: number;
  }> {
    const { filter, page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [eq(reviews.teacherId, teacherId)];
    
    // Add filter condition if provided (rating filter)
    if (filter && filter !== 'all') {
      const rating = parseInt(filter, 10);
      if (!isNaN(rating) && rating >= 1 && rating <= 5) {
        conditions.push(eq(reviews.rating, rating));
      }
    }

    const whereClause = and(...conditions);

    // Get reviews with pagination
    const reviewsWithStudents = await db
      .select({
        review: reviews,
        student: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.studentId, users.id))
      .where(whereClause)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(reviews)
      .where(whereClause);
    
    const total = countResult?.count || 0;

    // Get stats for all reviews of this teacher (not just filtered ones)
    const allReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.teacherId, teacherId));

    // Calculate stats
    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution: Record<string, number> = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };

    allReviews.forEach((review) => {
      const rating = String(review.rating);
      if (rating in ratingDistribution) {
        ratingDistribution[rating]++;
      }
    });

    // Format reviews with student info
    const formattedReviews = reviewsWithStudents.map(({ review, student }) => ({
      ...review,
      student: student || undefined,
    }));

    return {
      reviews: formattedReviews,
      stats: {
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews,
        ratingDistribution,
      },
      total,
    };
  }

  // Inquiry methods
  async createInquiry(inquiryData: InsertInquiry): Promise<Inquiry> {
    const [inquiry] = await db.insert(inquiries).values(inquiryData).returning();
    return inquiry;
  }

  async getAllInquiries(params: { page: number; limit: number; status?: string }): Promise<{ inquiries: Inquiry[]; total: number; page: number; totalPages: number }> {
    const { page, limit, status } = params;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status) {
      conditions.push(eq(inquiries.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [inquiriesResult, countResult] = await Promise.all([
      db.select()
        .from(inquiries)
        .where(whereClause)
        .orderBy(desc(inquiries.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(inquiries)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      inquiries: inquiriesResult,
      total,
      page,
      totalPages,
    };
  }

  async updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db.update(inquiries)
      .set({ status })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry;
  }

  // Chat methods implementation
  async getUserChats(userId: string): Promise<(Chat & { participant?: User | Teacher; lastMessage?: ChatMessage; unreadCount?: number })[]> {
    const userChats = await db.select().from(chats)
      .where(or(eq(chats.participant1Id, userId), eq(chats.participant2Id, userId)))
      .orderBy(desc(chats.lastMessageAt));

    const chatsWithDetails = await Promise.all(
      userChats.map(async (chat) => {
        const participantId = chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;
        
        // Try to get participant from users table first
        let participant: User | Teacher | undefined = await this.getUser(participantId);
        
        // If not found in users, try teachers table
        if (!participant) {
          participant = await this.getTeacher(participantId);
        }

        // Get last message
        const [lastMessage] = await db.select().from(chatMessages)
          .where(eq(chatMessages.chatId, chat.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        // Count unread messages
        const [unreadResult] = await db.select({ count: count() })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.chatId, chat.id),
              eq(chatMessages.isRead, false),
              sql`${chatMessages.senderId} != ${userId}`
            )
          );

        return {
          ...chat,
          participant,
          lastMessage,
          unreadCount: Number(unreadResult?.count || 0),
        };
      })
    );

    return chatsWithDetails;
  }

  async getChat(chatId: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    return chat;
  }

  async getChatBetweenUsers(userId1: string, userId2: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats)
      .where(
        or(
          and(eq(chats.participant1Id, userId1), eq(chats.participant2Id, userId2)),
          and(eq(chats.participant1Id, userId2), eq(chats.participant2Id, userId1))
        )
      );
    return chat;
  }

  async createChat(data: InsertChat): Promise<Chat> {
    const [chat] = await db.insert(chats).values(data).returning();
    return chat;
  }

  async getChatMessages(
    chatId: string, 
    params: { before?: string; limit: number; userId?: string }
  ): Promise<{ messages: (ChatMessage & { isMe?: boolean })[]; hasMore: boolean }> {
    let query = db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId));

    if (params.before) {
      query = query.where(
        and(
          eq(chatMessages.chatId, chatId),
          sql`${chatMessages.createdAt} < ${params.before}`
        )
      ) as any;
    }

    const messages = await query
      .orderBy(desc(chatMessages.createdAt))
      .limit(params.limit + 1);

    const hasMore = messages.length > params.limit;
    const resultMessages = hasMore ? messages.slice(0, params.limit) : messages;

    // Add isMe flag if userId is provided
    const messagesWithIsMe = resultMessages.map(msg => ({
      ...msg,
      isMe: params.userId ? msg.senderId === params.userId : undefined,
    }));

    return {
      messages: messagesWithIsMe.reverse(),
      hasMore,
    };
  }

  async sendMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    
    // Update the chat's lastMessageAt
    await db.update(chats)
      .set({ lastMessageAt: message.createdAt })
      .where(eq(chats.id, data.chatId));

    return message;
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.chatId, chatId),
          sql`${chatMessages.senderId} != ${userId}`
        )
      );
  }

  async getAllChats(params: { page: number; limit: number }): Promise<{ chats: (Chat & { participant1?: User | Teacher; participant2?: User | Teacher; lastMessage?: ChatMessage; participant1Type?: string; participant2Type?: string })[], total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(chats);
    const total = Number(totalResult?.count || 0);

    // Get paginated chats
    const allChats = await db.select().from(chats)
      .orderBy(desc(chats.lastMessageAt))
      .limit(limit)
      .offset(offset);

    const chatsWithDetails = await Promise.all(
      allChats.map(async (chat) => {
        // Get participant 1
        let participant1: User | Teacher | undefined = await this.getUser(chat.participant1Id);
        let participant1Type = "user";
        if (!participant1) {
          participant1 = await this.getTeacher(chat.participant1Id);
          participant1Type = "teacher";
        }

        // Get participant 2
        let participant2: User | Teacher | undefined = await this.getUser(chat.participant2Id);
        let participant2Type = "user";
        if (!participant2) {
          participant2 = await this.getTeacher(chat.participant2Id);
          participant2Type = "teacher";
        }

        // Get last message
        const [lastMessage] = await db.select().from(chatMessages)
          .where(eq(chatMessages.chatId, chat.id))
          .orderBy(desc(chatMessages.createdAt))
          .limit(1);

        return {
          ...chat,
          participant1,
          participant1Type,
          participant2,
          participant2Type,
          lastMessage,
        };
      })
    );

    return { chats: chatsWithDetails, total };
  }

  async getChatWithParticipants(chatId: string): Promise<(Chat & { participant1?: User | Teacher; participant2?: User | Teacher }) | undefined> {
    const chat = await this.getChat(chatId);
    if (!chat) {
      return undefined;
    }

    // Get participant 1
    let participant1: User | Teacher | undefined = await this.getUser(chat.participant1Id);
    if (!participant1) {
      participant1 = await this.getTeacher(chat.participant1Id);
    }

    // Get participant 2
    let participant2: User | Teacher | undefined = await this.getUser(chat.participant2Id);
    if (!participant2) {
      participant2 = await this.getTeacher(chat.participant2Id);
    }

    return {
      ...chat,
      participant1,
      participant2,
    };
  }

  // Password reset methods
  async createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens)
      .values(data)
      .returning();
    return token;
  }

  async findPasswordResetToken(email: string, code: string, userType: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.email, email),
          eq(passwordResetTokens.code, code),
          eq(passwordResetTokens.userType, userType)
        )
      )
      .orderBy(desc(passwordResetTokens.createdAt))
      .limit(1);
    return token;
  }

  async markPasswordResetTokenAsUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ isUsed: true })
      .where(eq(passwordResetTokens.id, id));
  }

  async deletePasswordResetTokensByEmail(email: string, userType: string): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.email, email),
          eq(passwordResetTokens.userType, userType)
        )
      );
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async updateTeacherPassword(teacherId: string, hashedPassword: string): Promise<void> {
    await db.update(teachers)
      .set({ password: hashedPassword })
      .where(eq(teachers.id, teacherId));
  }

  async createEmailLog(data: InsertEmailLog): Promise<EmailLog> {
    const [emailLog] = await db.insert(emailLogs)
      .values(data)
      .returning();
    return emailLog;
  }

  // Teacher availability methods
  async createTeacherAvailability(data: InsertTeacherAvailability): Promise<TeacherAvailability> {
    const [availability] = await db.insert(teacherAvailability)
      .values(data)
      .returning();
    return availability;
  }

  async createTeacherAvailabilityBulk(data: InsertTeacherAvailability[]): Promise<TeacherAvailability[]> {
    if (data.length === 0) return [];
    
    const availabilities = await db.insert(teacherAvailability)
      .values(data)
      .returning();
    return availabilities;
  }

  async getTeacherAvailability(teacherId: string, date?: Date): Promise<TeacherAvailability[]> {
    if (date) {
      // Use DATE() function to compare only the date part, ignoring time and timezone
      // The date parameter is properly parameterized by drizzle-orm
      return await db.select()
        .from(teacherAvailability)
        .where(
          and(
            eq(teacherAvailability.teacherId, teacherId),
            sql`DATE(${teacherAvailability.date}) = DATE(${date}::timestamp)`
          )
        );
    }
    
    return await db.select()
      .from(teacherAvailability)
      .where(eq(teacherAvailability.teacherId, teacherId));
  }

  async deleteTeacherAvailability(id: string): Promise<boolean> {
    const result = await db.delete(teacherAvailability)
      .where(eq(teacherAvailability.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteTeacherAvailabilityByDate(teacherId: string, date: Date): Promise<number> {
    const result = await db.delete(teacherAvailability)
      .where(
        and(
          eq(teacherAvailability.teacherId, teacherId),
          eq(teacherAvailability.date, date)
        )
      )
      .returning();
    return result.length;
  }

  // Terms of Service methods (single record, edit only)
  async getTermsOfService(): Promise<TermsOfService | undefined> {
    const [terms] = await db
      .select()
      .from(termsOfService)
      .limit(1);
    
    // If no record exists, create default one
    if (!terms) {
      const [newTerms] = await db
        .insert(termsOfService)
        .values({
          id: 'terms_of_service_singleton',
          title: '利用規約',
          content: '<p>利用規約の内容をここに入力してください。</p>',
        })
        .returning();
      return newTerms;
    }
    
    return terms;
  }

  async updateTermsOfService(data: UpdateTermsOfService): Promise<TermsOfService> {
    // Ensure the singleton record exists
    await this.getTermsOfService();
    
    const [terms] = await db
      .update(termsOfService)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(termsOfService.id, 'terms_of_service_singleton'))
      .returning();
    return terms;
  }

  // Privacy Policy methods (single record, edit only)
  async getPrivacyPolicy(): Promise<PrivacyPolicy | undefined> {
    const [policy] = await db
      .select()
      .from(privacyPolicy)
      .limit(1);
    
    // If no record exists, create default one
    if (!policy) {
      const [newPolicy] = await db
        .insert(privacyPolicy)
        .values({
          id: 'privacy_policy_singleton',
          title: 'プライバシーポリシー',
          content: '<p>プライバシーポリシーの内容をここに入力してください。</p>',
        })
        .returning();
      return newPolicy;
    }
    
    return policy;
  }

  async updatePrivacyPolicy(data: UpdatePrivacyPolicy): Promise<PrivacyPolicy> {
    // Ensure the singleton record exists
    await this.getPrivacyPolicy();
    
    const [policy] = await db
      .update(privacyPolicy)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(privacyPolicy.id, 'privacy_policy_singleton'))
      .returning();
    return policy;
  }

  // FAQ Category methods
  async getAllFaqCategories(): Promise<FaqCategory[]> {
    return db
      .select()
      .from(faqCategories)
      .orderBy(asc(faqCategories.sortOrder), asc(faqCategories.name));
  }

  async getFaqCategory(id: string): Promise<FaqCategory | undefined> {
    const [category] = await db
      .select()
      .from(faqCategories)
      .where(eq(faqCategories.id, id));
    return category;
  }

  async createFaqCategory(data: InsertFaqCategory): Promise<FaqCategory> {
    const [category] = await db
      .insert(faqCategories)
      .values(data)
      .returning();
    return category;
  }

  async updateFaqCategory(id: string, data: UpdateFaqCategory): Promise<FaqCategory | undefined> {
    const [category] = await db
      .update(faqCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(faqCategories.id, id))
      .returning();
    return category;
  }

  async deleteFaqCategory(id: string): Promise<boolean> {
    const result = await db
      .delete(faqCategories)
      .where(eq(faqCategories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // FAQ methods
  async getAllFaqs(params?: { category?: string; isActive?: boolean }): Promise<Faq[]> {
    const conditions = [];
    
    if (params?.category && params.category !== 'すべて') {
      conditions.push(eq(faqs.category, params.category));
    }
    
    if (params?.isActive !== undefined) {
      conditions.push(eq(faqs.isActive, params.isActive));
    }
    
    const query = db
      .select()
      .from(faqs)
      .orderBy(asc(faqs.sortOrder), desc(faqs.createdAt));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    const [faq] = await db
      .select()
      .from(faqs)
      .where(eq(faqs.id, id))
      .limit(1);
    return faq;
  }

  async createFaq(data: InsertFaq): Promise<Faq> {
    const [faq] = await db
      .insert(faqs)
      .values(data)
      .returning();
    return faq;
  }

  async updateFaq(id: string, data: UpdateFaq): Promise<Faq | undefined> {
    const [faq] = await db
      .update(faqs)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();
    return faq;
  }

  async deleteFaq(id: string): Promise<boolean> {
    const result = await db
      .delete(faqs)
      .where(eq(faqs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Admin Settings methods (single record, edit only)
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [settings] = await db
      .select()
      .from(adminSettings)
      .limit(1);
    
    // If no record exists, create default one
    if (!settings) {
      const [newSettings] = await db
        .insert(adminSettings)
        .values({
          id: 'admin_settings_singleton',
          adminEmail: '',
          notifyOnNewInquiry: true,
        })
        .returning();
      return newSettings;
    }
    
    return settings;
  }

  async updateAdminSettings(data: UpdateAdminSettings): Promise<AdminSettings> {
    // Ensure the singleton record exists
    await this.getAdminSettings();
    
    const [settings] = await db
      .update(adminSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminSettings.id, 'admin_settings_singleton'))
      .returning();
    return settings;
  }

  // Teacher Credentials methods
  async getTeacherCredentials(teacherId: string): Promise<TeacherCredential[]> {
    const credentials = await db
      .select()
      .from(teacherCredentials)
      .where(eq(teacherCredentials.teacherId, teacherId))
      .orderBy(asc(teacherCredentials.sortOrder), desc(teacherCredentials.createdAt));
    return credentials;
  }

  async getTeacherCredential(id: string): Promise<TeacherCredential | undefined> {
    const [credential] = await db
      .select()
      .from(teacherCredentials)
      .where(eq(teacherCredentials.id, id))
      .limit(1);
    return credential;
  }

  async createTeacherCredential(data: InsertTeacherCredential): Promise<TeacherCredential> {
    const [credential] = await db
      .insert(teacherCredentials)
      .values(data)
      .returning();
    return credential;
  }

  async updateTeacherCredential(id: string, data: UpdateTeacherCredential): Promise<TeacherCredential | undefined> {
    const [credential] = await db
      .update(teacherCredentials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teacherCredentials.id, id))
      .returning();
    return credential;
  }

  async deleteTeacherCredential(id: string): Promise<boolean> {
    const result = await db
      .delete(teacherCredentials)
      .where(eq(teacherCredentials.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Subject Category methods
  async getAllSubjectCategories(): Promise<SubjectCategory[]> {
    return db
      .select()
      .from(subjectCategories)
      .orderBy(asc(subjectCategories.sortOrder), asc(subjectCategories.name));
  }

  async getSubjectCategory(id: string): Promise<SubjectCategory | undefined> {
    const [category] = await db
      .select()
      .from(subjectCategories)
      .where(eq(subjectCategories.id, id));
    return category;
  }

  async createSubjectCategory(data: InsertSubjectCategory): Promise<SubjectCategory> {
    const [category] = await db
      .insert(subjectCategories)
      .values(data)
      .returning();
    return category;
  }

  async updateSubjectCategory(id: string, data: UpdateSubjectCategory): Promise<SubjectCategory | undefined> {
    const [category] = await db
      .update(subjectCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subjectCategories.id, id))
      .returning();
    return category;
  }

  async deleteSubjectCategory(id: string): Promise<boolean> {
    const result = await db
      .delete(subjectCategories)
      .where(eq(subjectCategories.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Subject methods
  async getAllSubjects(categoryId?: string): Promise<Subject[]> {
    if (categoryId) {
      return db
        .select()
        .from(subjects)
        .where(eq(subjects.categoryId, categoryId))
        .orderBy(asc(subjects.sortOrder), asc(subjects.name));
    }
    return db
      .select()
      .from(subjects)
      .orderBy(asc(subjects.sortOrder), asc(subjects.name));
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(data: InsertSubject): Promise<Subject> {
    const [subject] = await db
      .insert(subjects)
      .values(data)
      .returning();
    return subject;
  }

  async updateSubject(id: string, data: UpdateSubject): Promise<Subject | undefined> {
    const [subject] = await db
      .update(subjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    return subject;
  }

  async deleteSubject(id: string): Promise<boolean> {
    const result = await db
      .delete(subjects)
      .where(eq(subjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Subject Group methods
  async getAllSubjectGroups(subjectId?: string): Promise<SubjectGroup[]> {
    if (subjectId) {
      return db
        .select({
          id: subjectGroups.id,
          subjectId: subjectGroups.subjectId,
          name: subjectGroups.name,
          sortOrder: subjectGroups.sortOrder,
          isActive: subjectGroups.isActive,
          createdAt: subjectGroups.createdAt,
          updatedAt: subjectGroups.updatedAt,
        })
        .from(subjectGroups)
        .where(eq(subjectGroups.subjectId, subjectId))
        .orderBy(asc(subjectGroups.sortOrder), asc(subjectGroups.name));
    }
    return db
      .select({
        id: subjectGroups.id,
        subjectId: subjectGroups.subjectId,
        name: subjectGroups.name,
        sortOrder: subjectGroups.sortOrder,
        isActive: subjectGroups.isActive,
        createdAt: subjectGroups.createdAt,
        updatedAt: subjectGroups.updatedAt,
      })
      .from(subjectGroups)
      .innerJoin(subjects, eq(subjectGroups.subjectId, subjects.id))
      .orderBy(asc(subjects.name), asc(subjectGroups.sortOrder), asc(subjectGroups.name));
  }

  async getSubjectGroup(id: string): Promise<SubjectGroup | undefined> {
    const [group] = await db
      .select()
      .from(subjectGroups)
      .where(eq(subjectGroups.id, id));
    return group;
  }

  async createSubjectGroup(data: InsertSubjectGroup): Promise<SubjectGroup> {
    const [group] = await db
      .insert(subjectGroups)
      .values(data)
      .returning();
    return group;
  }

  async updateSubjectGroup(id: string, data: UpdateSubjectGroup): Promise<SubjectGroup | undefined> {
    const [group] = await db
      .update(subjectGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subjectGroups.id, id))
      .returning();
    return group;
  }

  async deleteSubjectGroup(id: string): Promise<boolean> {
    const result = await db
      .delete(subjectGroups)
      .where(eq(subjectGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DatabaseStorage();
