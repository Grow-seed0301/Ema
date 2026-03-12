import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileEditScreen from '@/screens/ProfileEditScreen';
import StudentProfileEditScreen from '@/screens/StudentProfileEditScreen';
import TeacherProfileEditScreen from '@/screens/TeacherProfileEditScreen';
import SubjectSelectionScreen from '@/screens/SubjectSelectionScreen';
import { getThemedStackOptions } from './screenOptions';
import { useTheme } from '@/hooks/useTheme';

export type OnboardingStackParamList = {
  OnboardingProfile: { userRole: 'student' | 'teacher' };
  OnboardingLearningInfo: undefined;
  OnboardingTeacherInfo: undefined;
  SubjectSelection: {
    selectedSubjects: string[];
    selectedGroups?: Record<string, string[]>;
    onSelect: (subjects: string[], groups: Record<string, string[]>) => void;
  };
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStackNavigator() {
  const { theme } = useTheme();
  const themedOptions = getThemedStackOptions(theme);

  return (
    <Stack.Navigator
      screenOptions={{
        ...themedOptions,
        gestureEnabled: false, // Disable swipe back during onboarding
      }}
    >
      <Stack.Screen
        name="OnboardingProfile"
        component={ProfileEditScreen}
        options={{
          title: 'プロフィール編集',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="OnboardingLearningInfo"
        component={StudentProfileEditScreen}
        options={{
          title: '学習情報の編集',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="OnboardingTeacherInfo"
        component={TeacherProfileEditScreen}
        options={{
          title: '指導情報',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="SubjectSelection"
        component={SubjectSelectionScreen}
        options={{
          title: '専門科目を選択',
        }}
      />
    </Stack.Navigator>
  );
}
