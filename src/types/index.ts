/**
 * Types Barrel Export
 * Centralized exports for all type definitions
 */

export * from './attendance';
export * from './club';
export * from './event';
export * from './guest';
export * from './member';

/**
 * Common API Types
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}
