/**
 * Admin URL Configuration
 *
 * SECURITY: The admin URL uses an obscure prefix to prevent unauthorized access attempts.
 * This prefix should be:
 * - Kept secret and not shared publicly
 * - Changed periodically (recommend quarterly)
 * - Different between staging and production environments
 *
 * To change the admin URL prefix:
 * 1. Set NEXT_PUBLIC_ADMIN_PREFIX in your .env.local file
 * 2. Set ADMIN_URL_PREFIX in your backend .env file (must match)
 * 3. Restart both frontend and backend servers
 */

// Default admin prefix - should be overridden via environment variable
const DEFAULT_ADMIN_PREFIX = "nucleus-admin-x7k9m2";

/**
 * Get the admin URL prefix from environment or use default
 */
export function getAdminPrefix(): string {
  return process.env.NEXT_PUBLIC_ADMIN_PREFIX || DEFAULT_ADMIN_PREFIX;
}

/**
 * Check if a given path segment matches the admin prefix
 */
export function isValidAdminPrefix(prefix: string): boolean {
  return prefix === getAdminPrefix();
}

/**
 * Generate admin URL path
 */
export function getAdminPath(subPath?: string): string {
  const prefix = getAdminPrefix();
  if (subPath) {
    return `/${prefix}/${subPath.replace(/^\//, "")}`;
  }
  return `/${prefix}`;
}

/**
 * Generate admin API URL prefix
 */
export function getAdminApiPrefix(): string {
  return getAdminPrefix();
}
