/**
 * Formatting Utilities
 * Common formatting functions for dates, numbers, and text
 */

/**
 * Format date to readable string
 */
export function formatDate(date: Date | { toDate: () => Date } | number | undefined): string {
  if (!date) return 'N/A';

  let dateObj: Date;

  if (typeof date === 'number') {
    dateObj = new Date(date);
  } else if ('toDate' in date && typeof date.toDate === 'function') {
    // Firestore Timestamp
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'N/A';
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | { toDate: () => Date } | number | undefined): string {
  if (!date) return 'N/A';

  let dateObj: Date;

  if (typeof date === 'number') {
    dateObj = new Date(date);
  } else if ('toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'N/A';
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time only
 */
export function formatTime(date: Date | { toDate: () => Date } | number | undefined): string {
  if (!date) return 'N/A';

  let dateObj: Date;

  if (typeof date === 'number') {
    dateObj = new Date(date);
  } else if ('toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'N/A';
  }

  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | { toDate: () => Date } | number | undefined): string {
  if (!date) return 'N/A';

  let dateObj: Date;

  if (typeof date === 'number') {
    dateObj = new Date(date);
  } else if ('toDate' in date && typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'N/A';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(dateObj);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert role to display name
 */
export function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return phone;

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}
