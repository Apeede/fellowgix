/**
 * Components Barrel Export
 * Centralized exports for all UI components
 */

export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbItem } from './Breadcrumbs';
export { ConfirmDialog, useConfirmDialog } from './ConfirmDialog';
export type { ConfirmationType } from './ConfirmDialog';
export { EmptyPage, EmptyState } from './EmptyState';
export { default as ErrorBoundary } from './ErrorBoundary';
export {
    CardGridSkeleton, CardSkeleton, ListItemSkeleton,
    ListSkeleton, Skeleton, TableSkeleton
} from './LoadingSkeleton';
export { default as NavHeader } from './NavHeader';
export type { NavHeaderProps } from './NavHeader';
export { default as ProtectedRoute } from './ProtectedRoute';
export { QuickActionCard, QuickActionGrid } from './QuickActionCard';
export { AttendanceStatusBadge, EventStatusBadge, StatusBadge } from './StatusBadge';
export type { StatusType } from './StatusBadge';

