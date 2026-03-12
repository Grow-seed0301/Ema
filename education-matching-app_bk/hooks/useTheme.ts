import { Colors } from "@/constants/theme";
import { useThemeContext } from "@/contexts/ThemeContext";

export function useTheme() {
  const { themeMode, setThemeMode, effectiveColorScheme } = useThemeContext();
  const isDark = effectiveColorScheme === "dark";
  const theme = Colors[effectiveColorScheme];

  return {
    theme,
    isDark,
    themeMode,
    setThemeMode,
  };
}
