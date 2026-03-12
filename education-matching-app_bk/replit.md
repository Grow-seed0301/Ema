# Education App

## Overview
A mobile application built with Expo React Native featuring authentication screens (splash, login, register) with a Japanese-style interface design. The app connects to a real backend API for data.

## API Configuration
- **Base URL**: `https://education-matching-api-idea-dev.replit.app/api`
- **API Service**: `services/api.ts` - Centralized API client with token management
- **Authentication**: Bearer token stored in AsyncStorage

## Project Architecture

### Tech Stack
- **Framework**: Expo SDK 54 with React Native
- **Navigation**: React Navigation 7 (Stack Navigator)
- **State Management**: React Context (AuthContext)
- **Storage**: AsyncStorage for local authentication persistence
- **Icons**: MaterialCommunityIcons from @expo/vector-icons

### Directory Structure
```
/
├── App.tsx                    # Root component with providers
├── contexts/
│   └── AuthContext.tsx       # Authentication context and hooks
├── navigation/
│   ├── AuthStackNavigator.tsx # Auth flow navigation (Splash → Login → Register)
│   ├── RootNavigator.tsx      # Root navigator (Auth or Main)
│   └── screenOptions.ts       # Common screen options
├── screens/
│   ├── SplashScreen.tsx       # Animated splash screen
│   ├── LoginScreen.tsx        # Login form with social options
│   ├── RegisterScreen.tsx     # Registration form
│   └── HomeScreen.tsx         # Main home screen after login
├── components/
│   ├── ErrorBoundary.tsx      # Error boundary wrapper
│   ├── ErrorFallback.tsx      # Error fallback UI
│   ├── ScreenScrollView.tsx   # Safe area scroll view
│   ├── ScreenKeyboardAwareScrollView.tsx # Keyboard aware scroll view
│   ├── ThemedText.tsx         # Themed text component
│   └── ThemedView.tsx         # Themed view component
├── constants/
│   └── theme.ts               # Colors, spacing, typography
└── hooks/
    ├── useTheme.ts            # Theme hook
    ├── useColorScheme.ts      # Color scheme detection
    └── useScreenInsets.ts     # Safe area insets hook
```

### Authentication Flow
1. **Splash Screen**: 2.5s animated intro with school icon
2. **Login Screen**: Email/password form + Google/Apple social login buttons
3. **Register Screen**: Full registration form with name, email, password confirmation
4. **Home Screen**: User profile with logout option

### Design System

#### Colors
- Primary: #137fec (Blue)
- Background Light: #f6f7f8
- Background Dark: #101922
- Text Primary Light: #0d141b
- Text Secondary: #4c739a

#### Typography
- Japanese text throughout UI
- Font weights: 400, 500, 600, 700

#### Spacing
- xs: 4, sm: 8, md: 12, lg: 16, xl: 24, 2xl: 32

#### Border Radius
- sm: 12 (inputs, buttons)
- full: 9999 (circular elements)

## Running the App
```bash
npm run dev
```
- Web: http://localhost:8081
- Expo Go: Scan QR code with Expo Go app

## Key Features
- Animated splash screen with fade transitions
- Form validation with error alerts
- Show/hide password toggle
- Social login buttons (Google, Apple)
- Terms and conditions checkbox
- Responsive design for all screen sizes
- Dark mode support
- Japanese language interface

## User Preferences
- Language: Japanese (日本語)
- Design style: iOS 26 Liquid Glass inspired
- Primary accent: Blue (#137fec)
