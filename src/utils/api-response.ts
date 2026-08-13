/**
 * API Response Validation Utility
 * Provides type-safe handling and validation of Firebase responses
 */

import { logger } from './logger';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

/**
 * Wraps async API calls with error handling and logging
 */
export async function apiCall<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<ApiResponse<T>> {
  try {
    logger.debug(`Starting operation: ${operationName}`);
    const data = await fn();
    logger.info(`Completed operation: ${operationName}`, { dataType: typeof data });
    
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Failed operation: ${operationName}`, error);
    
    return {
      success: false,
      error: errorMessage,
      timestamp: new Date(),
    };
  }
}

/**
 * Type guard for API responses
 */
export function isApiResponse<T>(value: any): value is ApiResponse<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.success === 'boolean' &&
    'timestamp' in value
  );
}

/**
 * Type guard for successful API responses
 */
export function isSuccessResponse<T>(response: ApiResponse<T>): response is Required<ApiResponse<T>> {
  return response.success && response.data !== undefined;
}

/**
 * Type guard for error API responses
 */
export function isErrorResponse<T>(response: ApiResponse<T>): boolean {
  return !response.success && response.error !== undefined;
}

/**
 * Validates and safely casts unknown data to expected type
 */
export function validateResponse<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  errorMessage: string = 'Invalid response format'
): ValidationResult<T> {
  if (validator(data)) {
    return {
      isValid: true,
      data,
      errors: [],
    };
  }

  logger.warn(`Response validation failed: ${errorMessage}`, { data });
  return {
    isValid: false,
    errors: [errorMessage],
  };
}
