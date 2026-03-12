# Design Guidelines: Education App with Authentication

## Architecture Decisions

### Authentication
**Auth Required** - The app explicitly features user authentication with:
- Email/password authentication with form validation
- SSO integration:
  - **Google Sign-In** (primary social login)
  - **Apple Sign-In** (required for iOS App Store compliance)
- Mock auth flow in prototype using local AsyncStorage to simulate account persistence
- Login/Signup screens with privacy policy & terms of service placeholder links
- "Forgot Password" recovery flow
- Account management with logout and delete account options (nested under Settings > Account > Delete with double confirmation)

### Navigation
**Stack-Only Navigation** - Linear authentication flow:
1. Splash Screen (entry point with 2-second animation)
2. Login Screen (default landing after splash)
3. Register Screen (accessible via "新規登録" link from login)
4. Main App (post-authentication)

No tab bar needed for auth flow. Main app structure to be determined after auth completion.

## Screen Specifications

### 1. Splash Screen
**Purpose**: Brand introduction with smooth transition to login

**Layout**:
- Full-screen centered content
- Transparent status bar
- No navigation header
- Safe area insets: none (full bleed)

**Components**:
- Centered school/graduation cap icon (64x64px) in circular container with primary/10 opacity background
- App name/logo below icon
- Fade-in animation (0.5s) followed by 1.5s hold, then fade-out transition to login

**Visual Design**:
- Background: Light mode (#f6f7f8), Dark mode (#101922)
- Icon container: 64px circle with primary color (#137fec) at 10% opacity
- Icon: Material Symbols "school" in primary color, 40px size

---

### 2. Login Screen
**Purpose**: User authentication entry point

**Layout**:
- **Header**: No navigation header (authentication entry screen)
- **Main content area**: Scrollable view (ScrollView) to handle keyboard
- **Safe area insets**: 
  - Top: insets.top + 32px
  - Bottom: insets.bottom + 32px
  - Horizontal: 16px padding

**Components** (top to bottom):
1. **Branding Section** (centered):
   - Icon container: 64px circle, primary/10 background
   - School icon: Material Symbols "school", 40px
   - Title: "ログイン" (Login), 28px bold
   - Subtitle: "アカウントにアクセスしましょう", 14px, secondary text color

2. **Form Section** (32px spacing between fields):
   - **Email Input**:
     - Label: "メールアドレス", 14px medium weight, 8px margin bottom
     - Input container: 56px height, rounded-lg (12px), border
     - Left icon: Mail symbol, 24px, positioned 16px from left
     - Input text: 16px, left padding 48px, right padding 16px
     - Placeholder: "メールアドレスを入力"
   
   - **Password Input**:
     - Label: "パスワード", 14px medium weight, 8px margin bottom
     - Input container: 56px height, rounded-lg (12px), border
     - Left icon: Lock symbol, 24px, positioned 16px from left
     - Right toggle: Visibility/visibility_off icon, 24px, positioned 16px from right, touchable
     - Input text: 16px, left padding 48px, right padding 48px
     - Placeholder: "パスワードを入力"

3. **Forgot Password Link** (right-aligned, 16px margin top):
   - Text: "パスワードをお忘れの場合", 14px medium, primary color
   - Touchable with underline on press

4. **Action Buttons** (24px spacing between elements):
   - **Primary Login Button**:
     - Height: 56px, full width
     - Background: Primary color (#137fec)
     - Text: "ログイン", 16px semibold, white
     - Border radius: 12px
     - Press state: 90% opacity
   
   - **Divider**: "または" text centered with horizontal lines
   
   - **Social Login Buttons** (2-column grid, 12px gap on tablet/landscape, stacked on small phones):
     - Each button: 56px height, rounded-lg
     - Border: 1px solid border color
     - Background: White (light) / Slate-800 (dark)
     - Icon + Text layout with 12px gap
     - Google: Logo + "Googleでログイン"
     - Apple: Logo (inverted in dark mode) + "Appleでサインイン"
     - Press state: Slate-100 (light) / Slate-700 (dark)

5. **Footer Text** (centered, 24px margin top):
   - Regular text: "アカウントをお持ちでないですか？"
   - Link: "新規登録" in primary color, semibold, touchable with underline

**Form Behavior**:
- Submit button in main content (not header)
- Auto-focus email field on mount
- Tab navigation between fields
- Keyboard-aware scrolling
- Email validation on blur
- Password strength indicator (optional)

---

### 3. Register Screen
**Purpose**: New user account creation

**Layout**: Mirror login screen structure with additional fields

**Header**: 
- Back button (left): Chevron-left icon to return to login
- Title: "新規登録" (Sign Up), centered

**Components**: Same structure as login with modifications:
1. Branding section (smaller, 48px icon)
2. Extended form fields:
   - Full Name (person icon)
   - Email (mail icon)
   - Password (lock icon with visibility toggle)
   - Confirm Password (lock icon with visibility toggle)
3. Terms acceptance checkbox: "利用規約とプライバシーポリシーに同意します"
4. Primary register button: "アカウントを作成"
5. Footer: "既にアカウントをお持ちですか？ログイン"

**Safe area insets**:
- Top: headerHeight + 16px
- Bottom: insets.bottom + 32px

---

## Design System

### Color Palette
**Light Mode**:
- Primary: #137fec
- Background: #f6f7f8
- Card/Surface: #ffffff
- Text Primary: #0d141b
- Text Secondary: #4c739a
- Border: #cfdbe7
- Icon Inactive: #94a3b8

**Dark Mode**:
- Primary: #137fec (same)
- Background: #101922
- Card/Surface: #1e293b
- Text Primary: #ffffff
- Text Secondary: #94a3b8
- Border: #334155
- Icon Inactive: #64748b

### Typography
- Font Family: System font (iOS: SF Pro, Android: Roboto)
- Fallback: Manrope for custom branding elements

**Scale**:
- Display: 28px, bold (screen titles)
- Title: 20px, semibold (section headers)
- Body: 16px, regular (input text, button labels)
- Caption: 14px, medium (labels, links)
- Small: 12px, regular (helper text)

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px

### Border Radius
- sm: 8px (small cards, chips)
- DEFAULT: 12px (buttons, inputs)
- lg: 16px (large cards)
- full: 9999px (circles, pills)

### Input States
**Default**:
- Border: 1px solid border color
- Background: Card/surface color

**Focus**:
- Border: 2px solid primary
- Ring: Primary at 20% opacity, 4px spread
- No outline

**Error**:
- Border: 2px solid #ef4444
- Helper text below in red

**Disabled**:
- Opacity: 60%
- Cursor: not-allowed

### Touchable Feedback
- **Buttons**: Opacity 90% on press, 150ms transition
- **Links**: Underline on press
- **Inputs**: Focus ring animation
- **Social buttons**: Background color change (see specs above)
- **Icons**: No shadow, opacity 70% on press

### Visual Design
**Icons**: Use @expo/vector-icons with "MaterialCommunityIcons" set
- Common icons: mail, lock, person, visibility, visibility-off, school
- Size: 24px for form icons, 40px for branding
- Color: Icon inactive color, primary on active inputs

**Shadows**: Minimal use
- Card elevation: shadowOffset {0, 1}, shadowOpacity 0.05, shadowRadius 2
- Modals only: shadowOffset {0, 4}, shadowOpacity 0.1, shadowRadius 8

**No custom image assets needed** - Uses system icons and Material Symbols exclusively

### Accessibility
- Minimum touch target: 44x44px (iOS HIG)
- Color contrast: WCAG AA compliant (4.5:1 for text)
- Screen reader labels for all interactive elements
- Support dynamic type sizing
- Keyboard navigation support
- Form field error announcements