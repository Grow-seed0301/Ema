import { DEFAULT_BASE_URL } from "../constants/env";

/**
 * Get the base URL for the application
 * Uses the BASE_URL environment variable if available,
 * otherwise defaults to the production deployment URL.
 * 
 * Note: The default URL is the actual production deployment URL for this application
 * as specified in the requirements. Set BASE_URL environment variable if deploying
 * to a different domain.
 * 
 * @returns The base URL (from env var or default)
 */
export function getBaseUrl(): string {
  return process.env.BASE_URL || DEFAULT_BASE_URL;
}

/**
 * Convert a relative object path to a full URL with the domain
 * @param relativePath - The relative path (e.g., "/objects/public/profile-images/uuid")
 * @returns The full URL including domain, or empty string if relativePath is falsy
 */
export function toFullImageUrl(relativePath: string): string {
  // Return empty string for falsy values to maintain consistent return type
  if (!relativePath) {
    return "";
  }
  
  // If already a full URL, return as is
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  
  const baseUrl = getBaseUrl();
  
  // Ensure no double slashes
  if (relativePath.startsWith("/")) {
    return `${baseUrl}${relativePath}`;
  }
  
  return `${baseUrl}/${relativePath}`;
}
