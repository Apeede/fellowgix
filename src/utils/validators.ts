/**
 * Validation Utilities
 * Common validation functions for data integrity
 */

import { EMAIL_PATTERN, NAME_MAX_LENGTH, NAME_MIN_LENGTH, PASSWORD_MIN_LENGTH } from './constants';

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

/**
 * Validates name format and length
 */
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= NAME_MIN_LENGTH && trimmed.length <= NAME_MAX_LENGTH;
}

/**
 * Validates non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates if value is a valid UUID
 */
export function isValidUUID(value: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(value);
}

/**
 * Validates if value is a date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Validates if object is not empty
 */
export function isNonEmptyObject<T extends object>(obj: T): obj is T & Record<string, unknown> {
  return Object.keys(obj).length > 0;
}

/**
 * Validates if array is not empty
 */
export function isNonEmptyArray<T>(arr: T[]): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validates if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validates URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}
