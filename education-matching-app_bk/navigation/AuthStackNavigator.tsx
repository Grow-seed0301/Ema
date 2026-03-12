import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import ForgotPasswordScreen from '@/screens/ForgotPasswordScreen';
import VerifyCodeScreen from '@/screens/VerifyCodeScreen';
import ResetPasswordScreen from '@/screens/ResetPasswordScreen';
import EmailVerificationScreen from '@/screens/EmailVerificationScreen';
import { getThemedStackOptions } from './screenOptions';
import { useTheme } from '@/hooks/useTheme';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: { userRole?: 'student' | 'teacher' };
  EmailVerification: { email: string; name: string; userRole: 'student' | 'teacher' };
  ForgotPassword: { userRole: 'student' | 'teacher' };
  VerifyCode: { email: string; userRole: 'student' | 'teacher' };
  ResetPassword: { email: string; code: string; userRole: 'student' | 'teacher' };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStackNavigator() {
  const { theme } = useTheme();
  const themedOptions = getThemedStackOptions(theme);

  return (
    <Stack.Navigator
      screenOptions={themedOptions}
      initialRouteName="Splash"
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
        options={{
          title: 'メール認証',
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: 'パスワードをお忘れの場合',
        }}
      />
      <Stack.Screen
        name="VerifyCode"
        component={VerifyCodeScreen}
        options={{
          title: '認証コードを入力',
        }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          title: '',
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
