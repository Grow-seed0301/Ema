import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  index,
  jsonb,
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Admins table (separate from users for admin-only login)
export const admins = pgTable("admins", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table (students only)
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  name: varchar("name").notNull(),
  nickname: varchar("nickname"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  avatarUrl: varchar("avatar_url"),
  avatarColor: varchar("avatar_color").default("#3B82F6"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender"), // male, female, other
  address: text("address"),
  bio: text("bio"),
  learningGoal: text("learning_goal"),
  rankLevel: varchar("rank_level").default("bronze"), // bronze, silver, gold, platinum
  rankPoints: integer("rank_points").default(0),
  totalLessons: integer("total_lessons").default(0),
  isActive: boolean("is_active").default(true),
  // OAuth fields
  oauthProvider: varchar("oauth_provider"), // google, facebook, instagram, twitter
  oauthId: varchar("oauth_id"),
  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  verificationCode: varchar("verification_code"),
  verificationCodeExpiry: timestamp("verification_code_expiry"),
  // Onboarding tracking
  isProfileComplete: boolean("is_profile_complete").default(false),
  isLearningInfoComplete: boolean("is_learning_info_complete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teachers table (merged with teacher_profiles)
export const teachers = pgTable("teachers", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"),
  name: varchar("name").notNull(),
  nickname: varchar("nickname"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  avatarUrl: varchar("avatar_url"),
  avatarColor: varchar("avatar_color").default("#3B82F6"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender"), // male, female, other
  address: text("address"),
  bio: text("bio"),
  // Teacher-specific fields (merged from teacher_profiles)
  specialty: varchar("specialty"),
  subjects: text("subjects").array(),
  subjectGroups: jsonb("subject_groups"), // { subjectName: [groupName1, groupName2] }
  experience: text("experience"),
  experienceYears: integer("experience_years"),
  teachingStyles: text("teaching_styles").array(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("3"),
  reviewCount: integer("review_count").default(0),
  totalStudents: integer("total_students").default(0),
  totalLessons: integer("total_lessons").default(0),
  favoriteCount: integer("favorite_count").default(0),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  // OAuth fields
  oauthProvider: varchar("oauth_provider"), // google, facebook, instagram, twitter
  oauthId: varchar("oauth_id"),
  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  verificationCode: varchar("verification_code"),
  verificationCodeExpiry: timestamp("verification_code_expiry"),
  // Onboarding tracking
  isProfileComplete: boolean("is_profile_complete").default(false),
  isCredentialsComplete: boolean("is_credentials_complete").default(false),
  // Bank account fields
  bankName: varchar("bank_name"),
  branchName: varchar("branch_name"),
  branchCode: varchar("branch_code"),
  accountType: varchar("account_type"),
  accountNumber: varchar("account_number"),
  accountHolder: varchar("account_holder"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher Credentials (career history and qualifications)
export const teacherCredentials = pgTable("teacher_credentials", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // education, career, qualification
  title: varchar("title").notNull(),
  organization: varchar("organization"),
  startDate: varchar("start_date"), // e.g., "2015年4月" or "2015"
  endDate: varchar("end_date"), // e.g., "2020年3月" or "現在"
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Plans (subscription packages)
export const plans = pgTable("plans", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // ライト, スタンダード, プレミアム
  nameEn: varchar("name_en"), // Lite, Standard, Premium
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  totalLessons: integer("total_lessons").notNull(),
  durationDays: integer("duration_days").notNull().default(30),
  features: text("features").array(),
  isActive: boolean("is_active").default(true),
  isRecommended: boolean("is_recommended").default(false),
  isAdditionalOption: boolean("is_additional_option").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  planId: varchar("plan_id")
    .notNull()
    .references(() => plans.id),
  remainingLessons: integer("remaining_lessons").notNull(),
  totalLessons: integer("total_lessons").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  expiryDate: timestamp("expiry_date"), // Nullable - only set when subscription is cancelled
  status: varchar("status").default("active"), // active, expired, cancelled
  stripeSubscriptionId: varchar("stripe_subscription_id"), // Stripe subscription ID for recurring subscriptions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teacher availability slots
export const teacherAvailability = pgTable(
  "teacher_availability",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    teacherId: varchar("teacher_id")
      .notNull()
      .references(() => teachers.id),
    date: timestamp("date").notNull(),
    startTime: varchar("start_time"),
    endTime: varchar("end_time"),
    isBooked: boolean("is_booked").default(false),
    repeatEnabled: boolean("repeat_enabled").default(false),
    dayOfWeek: varchar("day_of_week"),
    createdAt: timestamp("created_at").defaultNow(),
  },
);

// Bookings (lessons)
export const bookings = pgTable("bookings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => users.id),
  teacherId: varchar("teacher_id")
    .notNull()
    .references(() => teachers.id),
  lessonType: varchar("lesson_type").notNull(),
  date: timestamp("date").notNull(),
  startTime: varchar("start_time").notNull(),
  endTime: varchar("end_time").notNull(),
  format: varchar("format").default("online"), // online, offline
  status: varchar("status").default("pending"), // pending, confirmed, completed, cancelled
  price: decimal("price", { precision: 10, scale: 2 }),
  cancelReason: text("cancel_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id),
  studentId: varchar("student_id")
    .notNull()
    .references(() => users.id),
  teacherId: varchar("teacher_id")
    .notNull()
    .references(() => teachers.id),
  rating: integer("rating").notNull(),
  content: text("content"),
  userType: varchar("user_type"), // 大学生, 高校生, 社会人
  createdAt: timestamp("created_at").defaultNow(),
});

// Transfer Requests
export const transferRequests = pgTable("transfer_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transferFee: decimal("transfer_fee", { precision: 10, scale: 2 }).notNull().default("250"),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  requestDate: timestamp("request_date").notNull().defaultNow(),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Favorites (user's favorite teachers)
export const favorites = pgTable("favorites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  teacherId: varchar("teacher_id")
    .notNull()
    .references(() => teachers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments
export const payments = pgTable("payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  planId: varchar("plan_id").references(() => plans.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("JPY"),
  paymentMethod: varchar("payment_method"), // credit_card, bank_transfer, convenience_store
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  stripePaymentId: varchar("stripe_payment_id"),
  stripeSessionId: varchar("stripe_session_id"),
  description: text("description"),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chats
export const chats = pgTable("chats", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  participant1Id: varchar("participant1_id")
    .notNull()
    .references(() => users.id),
  participant2Id: varchar("participant2_id")
    .notNull()
    .references(() => teachers.id),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat messages
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    chatId: varchar("chat_id")
      .notNull()
      .references(() => chats.id),
    senderId: varchar("sender_id").notNull(),
    senderType: varchar("sender_type").notNull().$type<"user" | "teacher">(), // 'user' or 'teacher'
    text: text("text"),
    imageUrl: varchar("image_url"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    senderTypeCheck: check(
      "sender_type_check",
      sql`${table.senderType} IN ('user', 'teacher')`,
    ),
  }),
);

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type").notNull(), // booking, payment, review, system
  title: varchar("title").notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inquiries (お問い合わせ)
export const inquiries = pgTable("inquiries", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  message: text("message").notNull(),
  status: varchar("status").default("pending"), // pending, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  code: varchar("code").notNull(),
  userType: varchar("user_type").notNull(), // student, teacher
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email logs (for tracking sent emails)
export const emailLogs = pgTable("email_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  recipient: varchar("recipient", { length: 254 }).notNull(), // Email address of recipient (max length per RFC 5321)
  subject: varchar("subject", { length: 500 }).notNull(),
  textContent: text("text_content"), // Plain text version of email
  htmlContent: text("html_content"), // HTML version of email
  status: varchar("status").default("sent"), // sent, failed
  errorMessage: text("error_message"), // Error message if failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Error logs (for tracking exceptions and errors)
export const errorLogs = pgTable("error_logs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  errorMessage: text("error_message").notNull(),
  errorStack: text("error_stack"),
  errorCode: varchar("error_code"),
  statusCode: integer("status_code"),
  method: varchar("method"), // HTTP method (GET, POST, etc.)
  url: varchar("url"), // Request URL
  userId: varchar("user_id"), // Optional user ID if available
  userType: varchar("user_type"), // student, teacher, admin
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
});

// Terms of Service (single record, edit only)
export const termsOfService = pgTable("terms_of_service", {
  id: varchar("id")
    .primaryKey()
    .default(sql`'terms_of_service_singleton'`), // Fixed ID for single record
  title: varchar("title").notNull().default("利用規約"),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Privacy Policy (single record, edit only)
export const privacyPolicy = pgTable("privacy_policy", {
  id: varchar("id")
    .primaryKey()
    .default(sql`'privacy_policy_singleton'`), // Fixed ID for single record
  title: varchar("title").notNull().default("プライバシーポリシー"),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAQ Categories
export const faqCategories = pgTable("faq_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., すべて, アカウント, レッスン予約, 料金, 先生の探し方, トラブル
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FAQs (Frequently Asked Questions)
export const faqs = pgTable("faqs", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: varchar("category").notNull().default("すべて"), // Reference to faqCategories.name
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Settings (single record, edit only)
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`'admin_settings_singleton'`), // Fixed ID for single record
  adminEmail: varchar("admin_email").notNull().default(""),
  notifyOnNewInquiry: boolean("notify_on_new_inquiry").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subject Categories (e.g., 理数系, 文系, 語学)
export const subjectCategories = pgTable("subject_categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., 理数系, 文系, 語学
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subjects (e.g., 数学、物理、化学)
export const subjects = pgTable("subjects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => subjectCategories.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // e.g., 数学、物理、化学
  isPopular: boolean("is_popular").default(false), // 人気の科目
  targetElementary: boolean("target_elementary").default(false), // 小学生
  targetJuniorHigh: boolean("target_junior_high").default(false), // 中学生
  targetHighSchool: boolean("target_high_school").default(false), // 高校生
  targetUniversityAdult: boolean("target_university_adult").default(false), // 大学生・社会人
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subject Groups (e.g., 初級, 中級, 上級、1年生、2年生)
export const subjectGroups = pgTable("subject_groups", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  subjectId: varchar("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // e.g., 初級, 中級, 上級、1年生、2年生
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  bookingsAsStudent: many(bookings, { relationName: "studentBookings" }),
  reviewsGiven: many(reviews, { relationName: "studentReviews" }),
  favorites: many(favorites, { relationName: "userFavorites" }),
  payments: many(payments),
  notifications: many(notifications),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  availability: many(teacherAvailability),
  bookingsAsTeacher: many(bookings, { relationName: "teacherBookings" }),
  reviewsReceived: many(reviews, { relationName: "teacherReviews" }),
  favoriteBy: many(favorites, { relationName: "teacherFavorites" }),
  credentials: many(teacherCredentials),
  transferRequests: many(transferRequests),
}));

export const teacherCredentialsRelations = relations(teacherCredentials, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherCredentials.teacherId],
    references: [teachers.id],
  }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
}));

export const userSubscriptionsRelations = relations(
  userSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [userSubscriptions.userId],
      references: [users.id],
    }),
    plan: one(plans, {
      fields: [userSubscriptions.planId],
      references: [plans.id],
    }),
  }),
);

export const bookingsRelations = relations(bookings, ({ one }) => ({
  student: one(users, {
    fields: [bookings.studentId],
    references: [users.id],
    relationName: "studentBookings",
  }),
  teacher: one(teachers, {
    fields: [bookings.teacherId],
    references: [teachers.id],
    relationName: "teacherBookings",
  }),
  review: one(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  student: one(users, {
    fields: [reviews.studentId],
    references: [users.id],
    relationName: "studentReviews",
  }),
  teacher: one(teachers, {
    fields: [reviews.teacherId],
    references: [teachers.id],
    relationName: "teacherReviews",
  }),
}));

export const transferRequestsRelations = relations(transferRequests, ({ one }) => ({
  teacher: one(teachers, {
    fields: [transferRequests.teacherId],
    references: [teachers.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
    relationName: "userFavorites",
  }),
  teacher: one(teachers, {
    fields: [favorites.teacherId],
    references: [teachers.id],
    relationName: "teacherFavorites",
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [payments.planId],
    references: [plans.id],
  }),
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  participant1: one(users, {
    fields: [chats.participant1Id],
    references: [users.id],
  }),
  participant2: one(teachers, {
    fields: [chats.participant2Id],
    references: [teachers.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMessages.chatId],
    references: [chats.id],
  }),
  // Note: sender can be either a user or teacher, so no direct relation
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const subjectCategoriesRelations = relations(subjectCategories, ({ many }) => ({
  subjects: many(subjects),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  category: one(subjectCategories, {
    fields: [subjects.categoryId],
    references: [subjectCategories.id],
  }),
  groups: many(subjectGroups),
}));

export const subjectGroupsRelations = relations(subjectGroups, ({ one }) => ({
  subject: one(subjects, {
    fields: [subjectGroups.subjectId],
    references: [subjects.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertUserSubscriptionSchema = createInsertSchema(
  userSubscriptions,
).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});
export const insertTransferRequestSchema = createInsertSchema(transferRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});
export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertChatSchema = createInsertSchema(chats).omit({
  id: true,
  createdAt: true,
});
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export const insertTeacherAvailabilitySchema = createInsertSchema(
  teacherAvailability,
).omit({ id: true, createdAt: true });
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
});
export const insertPasswordResetTokenSchema = createInsertSchema(
  passwordResetTokens,
).omit({
  id: true,
  createdAt: true,
});
export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  createdAt: true,
});
export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
});
export const updateTermsOfServiceSchema = createInsertSchema(
  termsOfService,
).omit({
  id: true,
  updatedAt: true,
}).partial();
export const updatePrivacyPolicySchema = createInsertSchema(
  privacyPolicy,
).omit({
  id: true,
  updatedAt: true,
}).partial();
export const insertFaqCategorySchema = createInsertSchema(faqCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateFaqCategorySchema = createInsertSchema(faqCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();
export const updateAdminSettingsSchema = createInsertSchema(
  adminSettings,
).omit({
  id: true,
  updatedAt: true,
}).partial();
export const insertTeacherCredentialSchema = createInsertSchema(
  teacherCredentials,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateTeacherCredentialSchema = createInsertSchema(
  teacherCredentials,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertSubjectCategorySchema = createInsertSchema(subjectCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSubjectCategorySchema = createInsertSchema(subjectCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export const insertSubjectGroupSchema = createInsertSchema(subjectGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const updateSubjectGroupSchema = createInsertSchema(subjectGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

// Extended User type with subscription plan data
export type UserWithPlan = User & {
  plan?: {
    id: string;
    name: string;
    remainingLessons: number;
    totalLessons: number;
    expiryDate?: string;
  };
};

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type UpsertTeacher = typeof teachers.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<
  typeof insertUserSubscriptionSchema
>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type TransferRequest = typeof transferRequests.$inferSelect;
export type InsertTransferRequest = typeof transferRequests.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type TeacherAvailability = typeof teacherAvailability.$inferSelect;
export type InsertTeacherAvailability = z.infer<
  typeof insertTeacherAvailabilitySchema
>;

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type TeacherCredential = typeof teacherCredentials.$inferSelect;
export type InsertTeacherCredential = z.infer<typeof insertTeacherCredentialSchema>;
export type UpdateTeacherCredential = z.infer<typeof updateTeacherCredentialSchema>;


export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<
  typeof insertPasswordResetTokenSchema
>;

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;

export type TermsOfService = typeof termsOfService.$inferSelect;
export type UpdateTermsOfService = z.infer<typeof updateTermsOfServiceSchema>;

export type PrivacyPolicy = typeof privacyPolicy.$inferSelect;
export type UpdatePrivacyPolicy = z.infer<typeof updatePrivacyPolicySchema>;

export type FaqCategory = typeof faqCategories.$inferSelect;
export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;
export type UpdateFaqCategory = z.infer<typeof updateFaqCategorySchema>;

export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type UpdateFaq = z.infer<typeof updateFaqSchema>;

export type AdminSettings = typeof adminSettings.$inferSelect;
export type UpdateAdminSettings = z.infer<typeof updateAdminSettingsSchema>;

export type SubjectCategory = typeof subjectCategories.$inferSelect;
export type InsertSubjectCategory = z.infer<typeof insertSubjectCategorySchema>;
export type UpdateSubjectCategory = z.infer<typeof updateSubjectCategorySchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type UpdateSubject = z.infer<typeof updateSubjectSchema>;

export type SubjectGroup = typeof subjectGroups.$inferSelect;
export type InsertSubjectGroup = z.infer<typeof insertSubjectGroupSchema>;
export type UpdateSubjectGroup = z.infer<typeof updateSubjectGroupSchema>;
