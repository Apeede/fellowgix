/**
 * Application Constants
 * Centralized definitions for commonly used constants
 */

// API & Timing Constants
export const API_TIMEOUT = 30000; // 30 seconds
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// Role Definitions
export const ADMIN_ROLES = ['super_admin', 'club_admin', 'event_manager'] as const;
export const VIEWER_ROLES = ['viewer'] as const;
export const ALL_ROLES = [...ADMIN_ROLES, ...VIEWER_ROLES] as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Validation Patterns
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 6;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  CACHED_DATA: 'cached_data',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  SAVED: 'Saved successfully.',
} as const;

// UI Constants
export const TOAST_DURATION = 4000;
export const ANIMATION_DURATION = 300;
