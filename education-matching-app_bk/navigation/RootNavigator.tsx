import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import AuthStackNavigator from './AuthStackNavigator';
import OnboardingStackNavigator from './OnboardingStackNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import ThemeSettingsScreen from '@/screens/ThemeSettingsScreen';
import ProfileEditScreen from '@/screens/ProfileEditScreen';
import TeacherProfileEditScreen from '@/screens/TeacherProfileEditScreen';
import StudentProfileEditScreen from '@/screens/StudentProfileEditScreen';
import FavoriteTeachersScreen from '@/screens/FavoriteTeachersScreen';
import BookingHistoryScreen from '@/screens/BookingHistoryScreen';
import HelpSupportScreen from '@/screens/HelpSupportScreen';
import TermsOfServiceScreen from '@/screens/TermsOfServiceScreen';
import FAQScreen from '@/screens/FAQScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicyScreen';
import PlanSelectionScreen from '@/screens/PlanSelectionScreen';
import PaymentCompleteScreen from '@/screens/PaymentCompleteScreen';
import ChatScreen from '@/screens/ChatScreen';
import SearchFilterScreen from '@/screens/SearchFilterScreen';
import TeacherDetailScreen from '@/screens/TeacherDetailScreen';
import ChangeEmailScreen from '@/screens/ChangeEmailScreen';
import BookingConfirmationScreen from '@/screens/BookingConfirmationScreen';
import WriteReviewScreen from '@/screens/WriteReviewScreen';
import LessonBookingScreen from '@/screens/LessonBookingScreen';
import SubjectSelectionScreen from '@/screens/SubjectSelectionScreen';
import RewardManagementScreen from '@/screens/RewardManagementScreen';
import RewardHistoryScreen from '@/screens/RewardHistoryScreen';
import BankAccountEditScreen from '@/screens/BankAccountEditScreen';
import TransferRequestScreen from '@/screens/TransferRequestScreen';
import StudentDetailScreen from '@/screens/StudentDetailScreen';
import { getThemedStackOptions } from './screenOptions';

export interface SearchFilterParams {
  keyword?: string;
  subjects?: string[];
  subjectGroups?: Record<string, string[]>;
  ratingMin?: number;
  experienceYears?: string;
}

export type MainStackParamList = {
  MainTabs: undefined;
  ThemeSettings: undefined;
  ProfileEdit: undefined;
  TeacherProfileEdit: undefined;
  StudentProfileEdit: undefined;
  FavoriteTeachers: undefined;
  BookingHistory: undefined;
  HelpSupport: undefined;
  TermsOfService: undefined;
  FAQ: undefined;
  PrivacyPolicy: undefined;
  PlanSelection: undefined;
  PaymentComplete: { 
    sessionId: string;
    planName?: string;
    amount?: number;
  };
  Chat: { chatId: string; name: string; participantId: string };
  SearchFilter: {
    currentFilters?: SearchFilterParams;
  };
  TeacherSearch: {
    filters?: SearchFilterParams;
  };
  TeacherDetail: { teacherId: string };
  StudentDetail: { studentId: string };
  ChangeEmail: undefined;
  BookingConfirmation: {
    teacherName: string;
    lessonType: string;
    date: string;
    time: string;
    format: string;
    teacherAvatar?: string | null;
    avatarColor?: string;
  };
  WriteReview: {
    bookingId: string;
    teacherId: string;
    teacherName: string;
    lessonType: string;
    teacherAvatar?: string | null;
    avatarColor?: string;
  };
  LessonBooking: {
    teacherName: string;
    lessonType: string;
    teacherAvatar?: string;
    teacherId: string;
    avatarColor?: string;
  };
  SubjectSelection: {
    selectedSubjects: string[];
    selectedGroups?: Record<string, string[]>;
    onSelect: (subjects: string[], groups: Record<string, string[]>) => void;
  };
  RewardManagement: undefined;
  RewardHistory: undefined;
  BankAccountEdit: undefined;
  TransferRequest: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

function MainApp() {
  const { theme } = useTheme();
  const themedOptions = getThemedStackOptions(theme);

  return (
    <Stack.Navigator screenOptions={themedOptions}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeSettingsScreen}
        options={{
          title: 'テーマ設定',
        }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{
          title: 'プロフィール編集',
        }}
      />
      <Stack.Screen
        name="TeacherProfileEdit"
        component={TeacherProfileEditScreen}
        options={{
          title: '指導経歴',
        }}
      />
      <Stack.Screen
        name="StudentProfileEdit"
        component={StudentProfileEditScreen}
        options={{
          title: '学習情報の編集',
        }}
      />
      <Stack.Screen
        name="FavoriteTeachers"
        component={FavoriteTeachersScreen}
        options={{
          title: 'お気に入り',
        }}
      />
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{
          title: '授業履歴',
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          title: 'お問い合わせ',
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          title: '利用規約',
        }}
      />
      <Stack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{
          title: 'よくある質問',
        }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          title: 'プライバシーポリシー',
        }}
      />
      <Stack.Screen
        name="PlanSelection"
        component={PlanSelectionScreen}
        options={{
          title: 'プランを選択',
        }}
      />
      <Stack.Screen
        name="PaymentComplete"
        component={PaymentCompleteScreen}
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params.name,
        })}
      />
      <Stack.Screen
        name="SearchFilter"
        component={SearchFilterScreen}
        options={{
          title: '検索・絞り込み',
        }}
      />
      <Stack.Screen
        name="TeacherDetail"
        component={TeacherDetailScreen}
        options={{
          title: '教師詳細',
        }}
      />
      <Stack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{
          title: '生徒詳細',
        }}
      />
      <Stack.Screen
        name="ChangeEmail"
        component={ChangeEmailScreen}
        options={{
          title: 'メールアドレスの変更',
        }}
      />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WriteReview"
        component={WriteReviewScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LessonBooking"
        component={LessonBookingScreen}
        options={{
          title: 'レッスン予約',
        }}
      />
      <Stack.Screen
        name="SubjectSelection"
        component={SubjectSelectionScreen}
        options={{
          title: '専門科目を選択',
        }}
      />
      <Stack.Screen
        name="RewardManagement"
        component={RewardManagementScreen}
        options={{
          title: '報酬管理',
        }}
      />
      <Stack.Screen
        name="RewardHistory"
        component={RewardHistoryScreen}
        options={{
          title: '報酬履歴',
        }}
      />
      <Stack.Screen
        name="BankAccountEdit"
        component={BankAccountEditScreen}
        options={{
          title: '口座情報の編集',
        }}
      />
      <Stack.Screen
        name="TransferRequest"
        component={TransferRequestScreen}
        options={{
          title: '振込申請',
        }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#137fec" />
      </View>
    );
  }

  // No user - show auth flow
  if (!user) {
    return <AuthStackNavigator />;
  }

  // User exists but needs onboarding
  // Only proceed to onboarding if email is verified
  const needsOnboarding = user && user.emailVerified !== false && (
    !user.isProfileComplete ||
    (!user.isLearningInfoComplete && user.userRole === 'student') ||
    (!user.isCredentialsComplete && user.userRole === 'teacher')
  );

  if (needsOnboarding) {
    return <OnboardingStackNavigator />;
  }

  // User is logged in and onboarding is complete
  return <MainApp />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
