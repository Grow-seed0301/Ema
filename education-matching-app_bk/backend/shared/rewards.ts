/**
 * Backend-specific copy of rewards constants.
 * This file is separate from the root-level version (constants/rewards.ts) to ensure 
 * proper module resolution during backend build/deployment with esbuild.
 * The root-level version is used by the React Native frontend.
 * 
 * Constants for Reward Management
 */

// Bank Account Types
export const ACCOUNT_TYPES = {
  ORDINARY: '1', // 普通
  CURRENT: '2',  // 当座
} as const;

export const ACCOUNT_TYPE_LABELS = {
  [ACCOUNT_TYPES.ORDINARY]: '普通',
  [ACCOUNT_TYPES.CURRENT]: '当座',
} as const;

// Transfer Configuration
export const TRANSFER_FEE = 250; // Transfer fee in JPY
export const MAX_TRANSFERS_PER_MONTH = 1; // Maximum number of transfer requests per month
export const ESTIMATED_PROCESSING_DAYS = '3〜5営業日以内'; // Estimated processing time

// Validation Rules
export const BANK_ACCOUNT_VALIDATION = {
  ACCOUNT_NUMBER_LENGTH: 7,
  ACCOUNT_NUMBER_PATTERN: /^\d{7}$/,
  BRANCH_CODE_PATTERN: /^\d{1,4}$/,
} as const;
