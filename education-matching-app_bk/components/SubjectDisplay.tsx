import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface SubjectDisplayProps {
  subjects: string[];
  subjectGroups?: Record<string, string[]>;
}

/**
 * Shared component for displaying subjects and their subgroups consistently
 * across different screens as tags/badges.
 *
 * @param subjects - Array of subject names
 * @param subjectGroups - Optional mapping of subject to its subgroups
 */
export function SubjectDisplay({
  subjects,
  subjectGroups = {},
}: SubjectDisplayProps) {
  const { theme } = useTheme();

  if (subjects.length === 0) {
    return null;
  }

  return (
    <View style={styles.tagsContainer}>
      {subjects.map((subject) => {
        const groups = subjectGroups[subject] || [];
        const displayText =
          groups.length > 0 ? `${subject} (${groups.join(", ")})` : subject;

        return (
          <View
            key={subject}
            style={[
              styles.tag,
              {
                backgroundColor: theme.primary + "1A",
                borderColor: theme.primary,
              },
            ]}
          >
            <ThemedText style={[styles.tagText, { color: theme.primary }]}>
              {displayText}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
