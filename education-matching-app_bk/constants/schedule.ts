/**
 * Schedule-related constants
 */

// Tab identifiers for availability selection
export const AVAILABILITY_TAB = {
  AVAILABLE: "available",
  TIME: "time",
  UNAVAILABLE: "unavailable",
} as const;

// Type definitions
export type AvailabilityTab =
  (typeof AVAILABILITY_TAB)[keyof typeof AVAILABILITY_TAB];
