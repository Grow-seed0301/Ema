import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { Spacing } from "@/constants/theme";

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  // Only add safe area top inset if there's no header
  // When header is shown, React Navigation already accounts for safe area
  const needsSafeAreaTop = headerHeight === 0;

  return {
    paddingTop: needsSafeAreaTop ? insets.top + Spacing.xl : Spacing.xl,
    paddingBottom: insets.bottom + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
  };
}
