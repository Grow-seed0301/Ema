import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://education-matching-api-idea-dev.replit.app/api";

const TOKEN_KEY = "@auth_token";
const REFRESH_TOKEN_KEY = "@refresh_token";
const USER_ROLE_KEY = "@user_role";

/**
 * Standard API response format
 * @template T The type of the data field
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  /**
   * Error object containing code and message.
   * Used by screens for manual error handling.
   */
  error?: {
    code: string;
    message: string;
  };
  /**
   * Optional top-level message field.
   * When present in error responses, this message is prioritized in error.message
   * for display to users. This allows the backend to send special user-facing messages.
   */
  message?: string;
}

class ApiService {
  private accessToken: string | null = null;
  private userRole: string | null = null;

  async init() {
    this.accessToken = await AsyncStorage.getItem(TOKEN_KEY);
    this.userRole = await AsyncStorage.getItem(USER_ROLE_KEY);
  }

  async setUserRole(role: string) {
    this.userRole = role;
    await AsyncStorage.setItem(USER_ROLE_KEY, role);
  }

  /**
   * Get the current user's role.
   * Returns 'student' as default if role is not set.
   * This default ensures that API calls work even if role is not initialized.
   * Note: This role is stored locally to determine which API endpoints to use,
   * as the backend has separate tables for students and teachers.
   */
  getUserRole(): string {
    return this.userRole || "student";
  }

  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async clearTokens() {
    this.accessToken = null;
    this.userRole = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_ROLE_KEY);
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem(TOKEN_KEY);
    }
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = options.method || "GET";

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${this.accessToken}`;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📡 [API CALL] ${method} ${endpoint}`);
    console.log(`🔗 Full URL: ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📥 [API RESPONSE] ${method} ${endpoint}`);
      console.log(`📊 Status: ${response.status} ${response.ok ? "✅" : "❌"}`);
      console.log(`📦 Response Data:`, JSON.stringify(data, null, 2));
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      if (!response.ok) {
        // Use data.message if available, otherwise use error.message or fallback
        const errorMessage =
          data.message || data.error?.message || "An error occurred";

        const errorResponse = {
          success: false,
          error: data.error || {
            code: "UNKNOWN",
            message: errorMessage,
          },
          message: data.message,
        };

        return errorResponse;
      }

      // Wrap successful response with success flag if not already present
      if (data.success === undefined) {
        return {
          success: true,
          data: data,
        };
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      const errorMessage = "ネットワークエラーが発生しました";

      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: errorMessage,
        },
      };
    }
  }

  async login(email: string, password: string, role: string = "student") {
    const endpoint = `/${role}/login`;
    const response = await this.request<{
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
        totalLessons?: number;
        plan?: {
          id: string;
          name: string;
          remainingLessons: number;
        };
        rank?: {
          level: string;
          points: number;
        };
      };
      accessToken: string;
      refreshToken: string;
    }>(endpoint, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data) {
      await this.setTokens(
        response.data.accessToken,
        response.data.refreshToken,
      );
      // Store the role locally to know which endpoints to use in future API calls
      // The role parameter determines which endpoint was called and thus which table
      // the user is in: 'student' -> users table, 'teacher' -> teachers table
      await this.setUserRole(role);
    }

    return response;
  }

  async register(
    name: string,
    email: string,
    password: string,
    role: string = "student",
  ) {
    const endpoint = `/${role}/register`;
    const response = await this.request<{
      user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        createdAt: string;
      };
      message: string;
    }>(endpoint, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    // Note: Registration now returns user info without tokens
    // User needs to verify email before getting access tokens
    if (response.success && response.data) {
      // Store the role locally for later use
      await this.setUserRole(role);
    }

    return response;
  }

  async sendOtp(email: string, name: string, role: string = "student") {
    const endpoint = `/${role}/send-otp`;
    return this.request<{
      message: string;
      email: string;
    }>(endpoint, {
      method: "POST",
      body: JSON.stringify({ email, name }),
    });
  }

  async verifyOtp(email: string, code: string, role: string = "student") {
    const endpoint = `/${role}/verify-otp`;
    const response = await this.request<{
      message: string;
      user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
      };
      accessToken: string;
      refreshToken: string;
    }>(endpoint, {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });

    if (response.success && response.data) {
      await this.setTokens(
        response.data.accessToken,
        response.data.refreshToken,
      );
      await this.setUserRole(role);
    }

    return response;
  }

  async logout() {
    const role = this.getUserRole();
    await this.request(`/${role}/logout`, { method: "POST" });
    await this.clearTokens();
  }

  async getMe() {
    const role = this.getUserRole();
    return this.request<{
      id: string;
      name: string;
      email: string;
      nickname: string | null;
      phone: string | null;
      avatarUrl: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      address: string | null;
      bio: string | null;
      learningGoal?: string | null;
      totalLessons?: number;
      plan?: {
        id: string;
        name: string;
        remainingLessons: number;
        totalLessons: number;
        expiryDate: string;
      };
      rank?: {
        level: string;
        points: number;
        nextLevelPoints: number;
      };
      // Teacher-specific fields
      experience?: string | null;
      subjects?: string[] | null;
      subjectGroups?: Record<string, string[]> | null;
      specialty?: string | null;
      experienceYears?: number | null;
      teachingStyles?: string[] | null;
      // Onboarding tracking
      isProfileComplete?: boolean;
      isLearningInfoComplete?: boolean;
      isCredentialsComplete?: boolean;
    }>(`/${role}/user`);
  }

  async updateProfile(data: {
    name?: string;
    nickname?: string;
    avatarUrl?: string;
    dateOfBirth?: string;
    bio?: string;
    phone?: string;
    gender?: string;
    address?: string;
    learningGoal?: string;
    // Teacher-specific fields
    experience?: string;
    subjects?: string[];
    subjectGroups?: Record<string, string[]>;
    specialty?: string;
    experienceYears?: number;
    teachingStyles?: string[];
  }) {
    const role = this.getUserRole();
    return this.request<{
      id: string;
      name: string;
      email: string;
      nickname: string | null;
      phone: string | null;
      avatarUrl: string | null;
      dateOfBirth: string | null;
      gender: string | null;
      address: string | null;
      bio: string | null;
      learningGoal: string | null;
      totalLessons?: number;
      // Teacher-specific fields
      experience?: string | null;
      subjects?: string[] | null;
      subjectGroups?: Record<string, string[]> | null;
      specialty?: string | null;
      experienceYears?: number | null;
      teachingStyles?: string[] | null;
    }>(`/${role}/user`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async getTeacherSchedule(year: number, month: number) {
    return this.request<{
      schedule: Record<
        string,
        {
          date: string;
          timeSlots: Array<{ id: string; startTime: string; endTime: string }>;
          repeatEnabled: boolean;
          dayOfWeek: string | null;
        }
      >;
      year: number;
      month: number;
    }>(`/teacher/schedule?year=${year}&month=${month}`, {
      method: "GET",
    });
  }

  async updateTeacherSchedule(data: {
    date: string;
    timeSlots: Array<{ id: string; startTime: string; endTime: string }>;
    dayStatuses: Record<number, string>;
    repeatEnabled: boolean;
    dayOfWeek: string;
  }) {
    return this.request<{
      message: string;
      schedule: {
        date: string;
        timeSlots: Array<{ id: string; startTime: string; endTime: string }>;
        dayStatuses: Record<number, string>;
        repeatEnabled: boolean;
        dayOfWeek: string;
      };
    }>("/teacher/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProfileImageUploadUrl() {
    const role = this.getUserRole();
    return this.request<{
      uploadURL: string;
    }>(`/${role}/profile-image/upload`, {
      method: "POST",
    });
  }

  async updateProfileImage(profileImageURL: string) {
    const role = this.getUserRole();
    return this.request<{
      message: string;
      objectPath: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl: string | null;
      };
    }>(`/${role}/profile-image`, {
      method: "PUT",
      body: JSON.stringify({ profileImageURL }),
    });
  }

  async getRecommendedTeachers(limit: number = 10) {
    return this.request<
      Array<{
        id: string;
        name: string;
        age: number;
        avatarUrl: string | null;
        avatarColor: string;
        specialty: string;
        subjects: string[];
        rating: number;
        reviewCount: number;
        favorites: string;
        isFavorite: boolean;
        experienceYears: number;
      }>
    >(`/student/teachers/recommended?limit=${limit}`);
  }

  async searchTeachers(
    params: {
      q?: string;
      subjects?: string;
      subjectGroups?: string;
      ratingMin?: number;
      gender?: string;
      experienceYears?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return this.request<{
      teachers: Array<{
        id: string;
        name: string;
        age: number;
        avatarUrl: string | null;
        avatarColor: string;
        specialty: string;
        subjects: string[];
        subjectGroups: Record<string, string[]>;
        rating: number;
        reviewCount: number;
        totalLessons: number;
        favorites: string;
        isFavorite: boolean;
        experienceYears: number;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/student/teachers/search?${queryParams.toString()}`);
  }

  async getTeacherDetails(teacherId: string) {
    return this.request<{
      id: string;
      name: string;
      age: number;
      gender: string;
      avatarUrl: string | null;
      avatarColor: string;
      bio: string;
      specialty: string;
      subjects: string[];
      subjectGroups: Record<string, string[]>;
      rating: number;
      reviewCount: number;
      totalStudents: number;
      totalLessons: number;
      isFavorite: boolean;
      experience: string;
      experienceYears: number;
      teachingStyles: string[];
      credentials: Array<{
        id: string;
        teacherId: string;
        type: string;
        title: string;
        organization?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        sortOrder: number;
      }>;
    }>(`/student/teachers/${teacherId}`);
  }

  async getTeacherReviews(
    teacherId: string,
    params: { filter?: string; page?: number; limit?: number } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });

    return this.request<{
      reviews: Array<{
        id: string;
        userId: string;
        userType: string;
        gender: string;
        avatarColor: string;
        rating: number;
        content: string;
        createdAt: string;
        timeAgo: string;
      }>;
      stats: {
        averageRating: number;
        totalReviews: number;
        ratingDistribution: Record<string, number>;
      };
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
      };
    }>(`/student/teachers/${teacherId}/reviews?${queryParams.toString()}`);
  }

  async toggleFavoriteTeacher(teacherId: string, isFavorite: boolean) {
    return this.request<{
      isFavorite: boolean;
      totalFavorites: number;
    }>(`/student/teachers/${teacherId}/favorite`, {
      method: "POST",
      body: JSON.stringify({ isFavorite }),
    });
  }

  async getTeacherScheduleForStudent(
    teacherId: string,
    year: number,
    month: number,
  ) {
    return this.request<{
      schedule: Record<
        string,
        {
          date: string;
          timeSlots: Array<{
            id: string;
            startTime: string;
            endTime: string;
            isBooked?: boolean;
          }>;
          repeatEnabled: boolean;
          dayOfWeek: string | null;
          hasBookedSlots?: boolean;
          hasAvailableSlots?: boolean;
        }
      >;
      year: number;
      month: number;
    }>(`/student/teachers/${teacherId}/schedule?year=${year}&month=${month}`, {
      method: "GET",
    });
  }

  async getFavoriteTeachers() {
    return this.request<
      Array<{
        id: string;
        name: string;
        age: number;
        avatarUrl: string | null;
        avatarColor: string;
        specialty: string;
        rating: number;
        reviewCount: number;
        favorites: string;
        isFavorite: boolean;
        experienceYears: number;
      }>
    >("/student/users/me/favorite-teachers");
  }

  async getUpcomingBookings() {
    return this.request<
      Array<{
        id: string;
        teacherId: string;
        teacherName: string;
        teacherAvatar: string | null;
        avatarColor: string;
        lessonTitle: string;
        date: string;
        time: string;
        dayOfWeek: string;
        format: string;
        status: string;
      }>
    >("/student/bookings/upcoming");
  }

  async getBookingHistory(
    params: { status?: string; page?: number; limit?: number } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });

    return this.request<{
      bookings: Array<{
        id: string;
        teacherId: string;
        teacherName: string;
        avatarColor: string;
        lessonTitle: string;
        date: string;
        time: string;
        dayOfWeek: string;
        isCompleted: boolean;
        hasReview: boolean;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
      };
    }>(`/student/bookings/history?${queryParams.toString()}`);
  }

  async createBooking(data: {
    teacherId: string;
    lessonType: string;
    date: string;
    timeSlot: string;
    format: string;
  }) {
    return this.request<{
      id: string;
      teacherId: string;
      teacherName: string;
      lessonType: string;
      date: string;
      time: string;
      dayOfWeek: string;
      format: string;
      status: string;
      price: number;
      createdAt: string;
    }>("/student/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelBooking(bookingId: string, reason?: string) {
    return this.request<void>(`/student/bookings/${bookingId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  }

  async getChats() {
    const role = this.getUserRole();
    return this.request<
      Array<{
        id: string;
        participantId: string;
        participantName: string;
        participantAvatar: string | null;
        participantAvatarColor: string;
        lastMessage: string;
        lastMessageTime: string;
        timeAgo: string;
        unreadCount: number;
        subjects: Array<{
          label: string;
          color: string;
        }>;
      }>
    >(`/${role}/chats`);
  }

  async getOrCreateChat(participantId: string) {
    const role = this.getUserRole();
    return this.request<{
      id: string;
      participant1Id: string;
      participant2Id: string;
      createdAt: string;
    }>(`/${role}/chats/with/${participantId}`);
  }

  async getChatMessages(
    chatId: string,
    params: { before?: string; limit?: number } = {},
  ) {
    const role = this.getUserRole();
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });

    return this.request<{
      messages: Array<{
        id: string;
        senderId: string;
        senderType: string;
        text: string;
        createdAt: string;
        time: string;
        isMe: boolean;
        isRead: boolean;
        isImage: boolean;
        imageUrl: string | null;
      }>;
      hasMore: boolean;
    }>(`/${role}/chats/${chatId}/messages?${queryParams.toString()}`);
  }

  async sendMessage(chatId: string, text: string) {
    const role = this.getUserRole();
    return this.request<{
      id: string;
      senderId: string;
      senderType: string;
      text: string;
      createdAt: string;
      time: string;
    }>(`/${role}/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  async markMessagesAsRead(chatId: string) {
    const role = this.getUserRole();
    return this.request<{ success: boolean }>(`/${role}/chats/${chatId}/read`, {
      method: "POST",
    });
  }

  async getChatImageUploadUrl(chatId: string) {
    const role = this.getUserRole();
    return this.request<{
      uploadURL: string;
    }>(`/${role}/chats/${chatId}/image/upload`, {
      method: "POST",
    });
  }

  async sendChatImage(chatId: string, imageURL: string) {
    const role = this.getUserRole();
    return this.request<{
      id: string;
      senderId: string;
      senderType: string;
      text: string;
      imageUrl: string | null;
      createdAt: string;
      time: string;
    }>(`/${role}/chats/${chatId}/image`, {
      method: "POST",
      body: JSON.stringify({ imageURL }),
    });
  }

  async getNotifications() {
    return this.request<
      Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        isRead: boolean;
        createdAt: string;
        timeAgo: string;
        data: Record<string, string>;
      }>
    >("/student/notifications");
  }

  async markNotificationRead(notificationId: string) {
    return this.request<void>(`/student/notifications/${notificationId}/read`, {
      method: "POST",
    });
  }

  async getPlans() {
    return this.request<
      Array<{
        id: string;
        name: string;
        price: number;
        durationDays: number;
        lessonsPerMonth: number;
        features: string[];
        isRecommended: boolean;
      }>
    >("/student/plans");
  }

  async getAdditionalOptions() {
    return this.request<
      Array<{
        id: string;
        name: string;
        price: number;
        unit: string;
        description: string;
        features: string[];
      }>
    >("/student/plans/options");
  }

  async subscribePlan(planId: string, paymentMethod: string) {
    return this.request<{
      subscriptionId: string;
      planId: string;
      startDate: string;
      endDate: string;
    }>("/student/subscriptions", {
      method: "POST",
      body: JSON.stringify({ planId, paymentMethod }),
    });
  }

  async getCurrentSubscription() {
    return this.request<{
      id: string;
      planId: string;
      planName: string;
      price: number;
      remainingLessons: number;
      totalLessons: number;
      startDate: string;
      expiryDate: string;
      status: string;
    } | null>("/student/subscriptions/current");
  }

  async unsubscribePlan(subscriptionId: string) {
    return this.request<{
      message: string;
      subscriptionId: string;
    }>("/student/subscriptions/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    });
  }

  async createCheckoutSession(planId: string, quantity: number = 1) {
    return this.request<{
      sessionId: string;
      url: string;
    }>("/student/create-checkout-session", {
      method: "POST",
      body: JSON.stringify({ planId, quantity }),
    });
  }

  async getPaymentStatus(sessionId: string) {
    return this.request<{
      payment: {
        id: string;
        amount: string;
        currency: string;
        status: string;
        description: string;
        createdAt: string;
      };
      plan: {
        id: string;
        name: string;
        price: string;
        totalLessons: number;
      } | null;
    }>(`/student/payment-status/${sessionId}`);
  }

  async verifyPayment(sessionId: string) {
    return this.request<{
      payment: {
        id: string;
        amount: string;
        currency: string;
        status: string;
        description: string;
        createdAt: string;
      };
      plan: {
        id: string;
        name: string;
        price: string;
        totalLessons: number;
      } | null;
    }>(`/student/payments/verify`, {
      method: "POST",
      body: JSON.stringify({ sessionId }),
    });
  }

  async postReview(data: {
    bookingId: string;
    teacherId: string;
    rating: number;
    content: string;
  }) {
    return this.request<{
      id: string;
      rating: number;
      content: string;
      createdAt: string;
    }>("/student/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getLatestReviews(limit: number = 10) {
    return this.request<
      Array<{
        id: string;
        teacherId: string;
        teacherName: string;
        rating: number;
        content: string;
        userType: string;
        createdAt: string;
        timeAgo: string;
        avatarColor: string;
      }>
    >(`/student/reviews/latest?limit=${limit}`);
  }

  async submitInquiry(data: { name: string; email: string; message: string }) {
    return this.request<{
      id: string;
      name: string;
      email: string;
      message: string;
      status: string;
      createdAt: string;
    }>("/inquiries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(email: string, role: string = "student") {
    const endpoint = `/${role}/forgot-password`;
    return this.request<{ message: string }>(endpoint, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetCode(email: string, code: string, role: string = "student") {
    const endpoint = `/${role}/verify-code`;
    return this.request<{ message: string }>(endpoint, {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
    role: string = "student",
  ) {
    const endpoint = `/${role}/reset-password`;
    return this.request<{ message: string }>(endpoint, {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    });
  }

  // Terms of Service
  async getTermsOfService() {
    return this.request<{
      id: string;
      title: string;
      content: string;
      updatedAt: Date;
    }>("/terms-of-service");
  }

  // Privacy Policy
  async getPrivacyPolicy() {
    return this.request<{
      id: string;
      title: string;
      content: string;
      updatedAt: Date;
    }>("/privacy-policy");
  }

  // FAQs
  // Note: The API endpoint filters by isActive: true on the server side
  async getFaqCategories() {
    return this.request<
      Array<{
        id: string;
        name: string;
        sortOrder: number;
        isActive: boolean;
      }>
    >("/faq-categories");
  }

  async getFAQs(category?: string) {
    const url = category
      ? `/faqs?category=${encodeURIComponent(category)}`
      : "/faqs";
    return this.request<
      Array<{
        id: string;
        question: string;
        answer: string;
        category: string;
        sortOrder: number;
        isActive: boolean;
      }>
    >(url);
  }

  // Subjects
  async getSubjects() {
    return this.request<{
      categories: Array<{
        id: string;
        name: string;
        sortOrder: number;
        subjects: Array<{
          id: string;
          name: string;
          isPopular: boolean;
          targetElementary: boolean;
          targetJuniorHigh: boolean;
          targetHighSchool: boolean;
          targetUniversityAdult: boolean;
          sortOrder: number;
          groups: Array<{
            id: string;
            name: string;
            sortOrder: number;
          }>;
        }>;
      }>;
    }>("/subjects");
  }

  // Teacher Credentials
  async getTeacherCredentials() {
    return this.request<{
      credentials: Array<{
        id: string;
        teacherId: string;
        type: string;
        title: string;
        organization?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
      }>;
    }>("/teacher/credentials");
  }

  async createTeacherCredential(data: {
    type: string;
    title: string;
    organization?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    sortOrder?: number;
  }) {
    return this.request<{
      credential: {
        id: string;
        teacherId: string;
        type: string;
        title: string;
        organization?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
      };
    }>("/teacher/credentials", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTeacherCredential(
    id: string,
    data: {
      type?: string;
      title?: string;
      organization?: string;
      startDate?: string;
      endDate?: string;
      description?: string;
      sortOrder?: number;
    },
  ) {
    return this.request<{
      credential: {
        id: string;
        teacherId: string;
        type: string;
        title: string;
        organization?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
      };
    }>(`/teacher/credentials/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTeacherCredential(id: string) {
    return this.request<{ success: boolean }>(`/teacher/credentials/${id}`, {
      method: "DELETE",
    });
  }

  // Teacher Booking Methods
  async getTeacherBookings(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    const endpoint = `/teacher/bookings${query ? `?${query}` : ""}`;

    return this.request<{
      bookings: Array<{
        id: string;
        studentId: string;
        studentName: string;
        studentAvatar: string | null;
        avatarColor: string;
        lessonType: string;
        date: string;
        startTime: string;
        endTime: string;
        time: string;
        dayOfWeek: string;
        format: string;
        status: string;
        notes: string;
        cancelReason: string | null;
        hasReview: boolean;
        createdAt: Date;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
      };
    }>(endpoint);
  }

  async approveBooking(bookingId: string) {
    return this.request<{
      booking: {
        id: string;
        status: string;
      };
      message: string;
    }>(`/teacher/bookings/${bookingId}/approve`, {
      method: "POST",
    });
  }

  async rejectBooking(bookingId: string, reason: string) {
    return this.request<{
      booking: {
        id: string;
        status: string;
      };
      message: string;
    }>(`/teacher/bookings/${bookingId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Get detailed profile information for a specific student.
   * This endpoint is for teachers to view student profiles from their bookings.
   * Returns the same format as /student/user endpoint.
   *
   * @param studentId - The unique identifier of the student
   * @returns Student profile data (full user object)
   */
  async getStudentDetails(studentId: string) {
    return this.request<{
      id: string;
      name: string;
      email: string;
      nickname: string | null;
      phone: string | null;
      avatarUrl: string | null;
      avatarColor?: string;
      dateOfBirth: string | null;
      gender: string | null;
      address: string | null;
      bio: string | null;
      learningGoal?: string | null;
      totalLessons?: number;
      plan?: {
        id: string;
        name: string;
        remainingLessons: number;
        totalLessons: number;
        expiryDate: string;
      };
      rank?: {
        level: string;
        points: number;
        nextLevelPoints: number;
      };
      // Onboarding tracking
      isProfileComplete?: boolean;
      isLearningInfoComplete?: boolean;
    }>(`/teacher/students/${studentId}`);
  }

  // Reward Management APIs
  async getRewardSummary() {
    return this.request<{
      availableBalance: number;
      predictedEarnings: number;
      monthlyData: Array<{
        month: string;
        amount: number;
        height: number;
      }>;
    }>("/teacher/rewards/summary");
  }

  async getRewardHistory(
    params: { month?: string; page?: number; limit?: number } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });

    return this.request<{
      month: string;
      monthlyTotal: number;
      count: number;
      items: Array<{
        id: string;
        date: string;
        studentName: string;
        lessonType: string;
        amount: number;
        status: string;
      }>;
      hasMore: boolean;
    }>(`/teacher/rewards/history?${queryParams.toString()}`);
  }

  async getBankAccount() {
    return this.request<{
      bankName: string;
      branchName: string;
      branchCode: string;
      accountType: string;
      accountNumber: string;
      accountHolder: string;
    }>("/teacher/rewards/bank-account");
  }

  async updateBankAccount(data: {
    bankName: string;
    branchName: string;
    branchCode: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
    }>("/teacher/rewards/bank-account", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async createTransferRequest(data: { amount: number }) {
    return this.request<{
      success: boolean;
      message: string;
      transferId: string;
      requestedAmount: number;
      transferFee: number;
      netAmount: number;
      estimatedProcessingDays: string;
    }>("/teacher/rewards/transfer-request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
