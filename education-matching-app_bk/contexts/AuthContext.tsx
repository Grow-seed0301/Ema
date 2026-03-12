import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import { useOAuth, type OAuthProvider, type UserRole } from '../hooks/useOAuth';

interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  bio?: string | null;
  learningGoalText?: string | null;
  totalLessons?: number;
  plan?: {
    id: string;
    name: string;
    remainingLessons: number;
    totalLessons?: number;
    expiryDate?: string;
  };
  rank?: {
    level: string;
    points: number;
    nextLevelPoints?: number;
  };
  // Teacher-specific fields
  subjects?: string[] | null;
  subjectGroups?: Record<string, string[]> | null;
  experience?: string | null;
  experienceYears?: number | null;
  // Onboarding tracking
  userRole?: 'student' | 'teacher';
  isProfileComplete?: boolean;
  isLearningInfoComplete?: boolean;
  isCredentialsComplete?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  /**
   * Login with email and password.
   * @param email - User's email address
   * @param password - User's password
   * @param role - User type to login as (student or teacher) - determines which endpoint to use
   */
  login: (email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithFacebook: (role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithTwitter: (role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithInstagram: (role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithApple: () => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: {
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
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = '@auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { startOAuthFlow } = useOAuth();

  /**
   * Helper to construct a User object from API response
   */
  const constructUser = (data: any, role?: string): User => {
    // Ensure role is valid or default to 'student'
    const validRole = (role === 'student' || role === 'teacher') ? role : 'student';
    
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      nickname: data.nickname,
      avatarUrl: data.avatarUrl,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      bio: data.bio,
      totalLessons: data.totalLessons,
      plan: data.plan,
      rank: data.rank,
      learningGoalText: data.learningGoal,
      subjects: data.subjects,
      subjectGroups: data.subjectGroups,
      experience: data.experience,
      experienceYears: data.experienceYears,
      userRole: validRole,
      isProfileComplete: data.isProfileComplete,
      isLearningInfoComplete: data.isLearningInfoComplete,
      isCredentialsComplete: data.isCredentialsComplete,
    };
  };

  /**
   * Helper function to handle OAuth login for any provider
   */
  const handleOAuthLogin = async (
    provider: OAuthProvider,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await startOAuthFlow(provider, role);
      
      if (result.success && result.accessToken && result.refreshToken) {
        // Store tokens
        await apiService.setTokens(result.accessToken, result.refreshToken);
        await apiService.setUserRole(result.userType || role);
        
        // Fetch user data
        const response = await apiService.getMe();
        if (response.success && response.data) {
          const userData = constructUser(response.data, result.userType || role);
          setUser(userData);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
          return { success: true };
        }
      }
      
      return { 
        success: false, 
        error: result.error || `${provider}ログインに失敗しました`
      };
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      return { success: false, error: `${provider}ログインに失敗しました` };
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      await apiService.init();
      const token = await apiService.getAccessToken();
      
      if (token) {
        const response = await apiService.getMe();
        if (response.success && response.data) {
          const userData = constructUser(response.data, apiService.getUserRole());
          setUser(userData);
          await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        } else {
          await apiService.clearTokens();
          await AsyncStorage.removeItem(AUTH_USER_KEY);
        }
      } else {
        const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        if (cachedUser) {
          await AsyncStorage.removeItem(AUTH_USER_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to init auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getMe();
      if (response.success && response.data) {
        const userData = constructUser(response.data, apiService.getUserRole());
        setUser(userData);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const login = async (email: string, password: string, role: string = "student"): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.login(email, password, role);
      
      if (response.success && response.data) {
        const userData = constructUser(response.data.user, role);
        setUser(userData);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error?.message || 'ログインに失敗しました' 
      };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  };

  const loginWithGoogle = async (role: UserRole = 'student'): Promise<{ success: boolean; error?: string }> => {
    return handleOAuthLogin('google', role);
  };

  const loginWithFacebook = async (role: UserRole = 'student'): Promise<{ success: boolean; error?: string }> => {
    return handleOAuthLogin('facebook', role);
  };

  const loginWithTwitter = async (role: UserRole = 'student'): Promise<{ success: boolean; error?: string }> => {
    return handleOAuthLogin('twitter', role);
  };

  const loginWithInstagram = async (role: UserRole = 'student'): Promise<{ success: boolean; error?: string }> => {
    return handleOAuthLogin('instagram', role);
  };

  const loginWithApple = async (): Promise<{ success: boolean; error?: string }> => {
    return { success: false, error: 'Appleログインは現在実装中です' };
  };

  const register = async (
    name: string, 
    email: string, 
    password: string,
    role: string = 'student'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.register(name, email, password, role);
      
      if (response.success && response.data) {
        // Note: We no longer log the user in immediately
        // User needs to verify their email first
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error?.message || '登録に失敗しました' 
      };
    } catch (error) {
      console.error('Register failed:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout API failed:', error);
    }
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  };

  const updateProfile = async (data: {
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
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.updateProfile(data);
      
      if (response.success && response.data) {
        const userData = constructUser(response.data, apiService.getUserRole());
        setUser(userData);
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error?.message || 'プロフィールの更新に失敗しました' 
      };
    } catch (error) {
      console.error('Update profile failed:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        loginWithFacebook,
        loginWithTwitter,
        loginWithInstagram,
        loginWithApple,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
