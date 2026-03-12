import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useTheme } from "@/hooks/useTheme";
import ScheduleScreen from "@/screens/ScheduleScreen";
import TeacherLessonManagementScreen from "@/screens/TeacherLessonManagementScreen";

export type TeacherScheduleTabParamList = {
  LessonManagement: undefined;
  ScheduleSetting: undefined;
};

const Tab = createMaterialTopTabNavigator<TeacherScheduleTabParamList>();

export default function TeacherScheduleTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundDefault,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        tabBarIndicatorStyle: {
          backgroundColor: theme.primary,
          height: 2,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "700",
          textTransform: "none",
        },
        swipeEnabled: true,
      }}
    >
      <Tab.Screen
        name="LessonManagement"
        component={TeacherLessonManagementScreen}
        options={{
          tabBarLabel: "授業管理",
        }}
      />
      <Tab.Screen
        name="ScheduleSetting"
        component={ScheduleScreen}
        options={{
          tabBarLabel: "スケジュール設定",
        }}
      />
    </Tab.Navigator>
  );
}
