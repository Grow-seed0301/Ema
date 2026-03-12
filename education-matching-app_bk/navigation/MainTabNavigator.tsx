import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import HomeScreen from '@/screens/HomeScreen';
import ChatListScreen from '@/screens/ChatListScreen';
import MyPageScreen from '@/screens/MyPageScreen';
import TeacherSearchScreen from '@/screens/TeacherSearchScreen';
import TeacherScheduleTabNavigator from '@/navigation/TeacherScheduleTabNavigator';
import { BlurView } from 'expo-blur';
import { getThemedTabScreenOptions } from './screenOptions';
import apiService from '@/services/api';
import type { SearchFilterParams } from './RootNavigator';

export type MainTabParamList = {
  HomeTab: undefined;
  TeacherSearch: {
    filters?: SearchFilterParams;
  };
  Schedule: undefined;
  Messages: undefined;
  MyPageTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const themedOptions = getThemedTabScreenOptions(theme);
  const insets = useSafeAreaInsets();
  
  // Check if user is a teacher
  const isTeacher = apiService.getUserRole() === 'teacher';

  return (
    <Tab.Navigator
      screenOptions={{
        ...themedOptions,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.backgroundDefault,
          borderTopWidth: 0.5,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint={isDark ? 'dark' : 'light'}
              intensity={100}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      {isTeacher ? (
        <Tab.Screen
          name="Schedule"
          component={TeacherScheduleTabNavigator}
          options={{
            headerShown: true,
            title: '予定',
            tabBarLabel: '予定',
            tabBarIcon: ({ color, size }) => (
              <Feather name="calendar" size={22} color={color} />
            ),
          }}
        />
      ) : (
        <Tab.Screen
          name="TeacherSearch"
          component={TeacherSearchScreen}
          options={{
            title: '教師を探す',
            tabBarLabel: '教師検索',
            tabBarIcon: ({ color, size }) => (
              <Feather name="search" size={22} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Messages"
        component={ChatListScreen}
        options={{
          title: 'メッセージ',
          tabBarLabel: 'メッセージ',
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-circle" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyPageTab"
        component={MyPageScreen}
        options={{
          title: 'マイページ',
          tabBarLabel: 'マイページ',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({});
