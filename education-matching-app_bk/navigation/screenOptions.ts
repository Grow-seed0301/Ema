import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { isLiquidGlassAvailable } from "expo-glass-effect";

export interface ThemeColors {
  primary: string;
  text: string;
  textSecondary: string;
  backgroundRoot: string;
  backgroundDefault: string;
  border: string;
}

export const getCommonScreenOptions: NativeStackNavigationOptions = {
  headerTitleAlign: "center",
  headerTransparent: false,
  gestureEnabled: true,
  gestureDirection: "horizontal",
  fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
};

export const getThemedStackOptions = (theme: ThemeColors): NativeStackNavigationOptions => ({
  ...getCommonScreenOptions,
  headerStyle: {
    backgroundColor: theme.backgroundRoot,
  },
  headerTintColor: theme.primary,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
    color: theme.text,
  },
  headerShadowVisible: false,
  headerBackTitle: '戻る',
});

export const getThemedTabScreenOptions = (theme: ThemeColors): BottomTabNavigationOptions => ({
  headerStyle: {
    backgroundColor: theme.backgroundRoot,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.border,
  },
  headerTintColor: theme.primary,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
    color: theme.text,
  },
  headerShadowVisible: false,
  headerTitleAlign: 'center',
});
