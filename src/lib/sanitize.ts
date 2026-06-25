import { z } from "zod";

/**
 * Shared CUID validator for entity ID parameters.
 * CUID format: starts with 'c', followed by 24+ alphanumeric characters.
 */
export const cuidSchema = z
  .string()
  .min(1, "ID is required")
  .regex(/^c[a-z0-9]{24,}$/i, "Invalid ID format");

/**
 * Strips null bytes, control characters (except newlines/tabs for content fields),
 * and trims whitespace from strings.
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars (keep \n \t \r)
    .trim();
}

/**
 * Zod preprocessor that sanitizes and trims strings.
 * Use with z.preprocess(sanitizePreprocess, z.string()...)
 */
export function sanitizePreprocess(val: unknown): unknown {
  if (typeof val === "string") {
    return sanitizeString(val);
  }
  return val;
}

/**
 * Creates a sanitized string Zod schema.
 * Automatically trims and strips dangerous characters.
 */
export function safeString() {
  return z.preprocess(sanitizePreprocess, z.string());
}

/**
 * Rate limit check for server actions.
 * Re-exports the existing checkRateLimit with a convenient wrapper.
 */
export { checkRateLimit } from "./rate-limit";
