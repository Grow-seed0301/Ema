import { Platform } from "react-native";

const primaryColor = "#059669";

export const Colors = {
  light: {
    primary: primaryColor,
    text: "#0d141b",
    textSecondary: "#4c739a",
    textTertiary: "#64748b",
    buttonText: "#FFFFFF",
    tabIconDefault: "#94a3b8",
    tabIconSelected: primaryColor,
    link: primaryColor,
    backgroundRoot: "#f6f7f8",
    backgroundDefault: "#ffffff",
    backgroundSecondary: "#ffffff",
    backgroundTertiary: "#f6f7f8",
    border: "#cfdbe7",
    iconInactive: "#94a3b8",
    danger: "#ef4444",
    error: "#ef4444",
    warning: "#f59e0b",
  },
  dark: {
    primary: primaryColor,
    text: "#ffffff",
    textSecondary: "#94a3b8",
    textTertiary: "#cbd5e1",
    buttonText: "#FFFFFF",
    tabIconDefault: "#64748b",
    tabIconSelected: primaryColor,
    link: primaryColor,
    backgroundRoot: "#101922",
    backgroundDefault: "#1e293b",
    backgroundSecondary: "#1e293b",
    backgroundTertiary: "#101922",
    border: "#334155",
    iconInactive: "#64748b",
    danger: "#ef4444",
    error: "#ef4444",
    warning: "#f59e0b",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
  inputHeight: 56,
  buttonHeight: 56,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
