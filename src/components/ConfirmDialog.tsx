/**
 * Confirmation Dialog Component
 * Reusable confirmation dialog with better UX than window.confirm()
 */

import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import React, { useState } from 'react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  type?: ConfirmationType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const typeConfig: Record<ConfirmationType, { icon: React.ReactNode; bgColor: string; buttonColor: string }> = {
  danger: {
    icon: <AlertTriangle className="w-6 h-6" />,
    bgColor: 'bg-red-50 border-red-200',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: <HelpCircle className="w-6 h-6" />,
    bgColor: 'bg-yellow-50 border-yellow-200',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
  },
  info: {
    icon: <HelpCircle className="w-6 h-6" />,
    bgColor: 'bg-blue-50 border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    icon: <CheckCircle className="w-6 h-6" />,
    bgColor: 'bg-green-50 border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const config = typeConfig[type];

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        {/* Header with type indicator */}
        <div className={`p-6 border-b ${config.bgColor} border-2 rounded-t-lg flex items-start gap-4`}>
          <div className="text-current flex-shrink-0">{config.icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-gray-600 text-base">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${config.buttonColor}`}
          >
            {isLoading && <Spinner size="sm" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple spinner for loading state
const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return <div className={`${sizeClass} border-2 border-white border-t-transparent rounded-full animate-spin`} />;
};

// Hook for easier usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirm = (
    options: Omit<ConfirmDialogProps, 'isOpen' | 'onConfirm' | 'onCancel' | 'isLoading'>,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(options);
      setIsOpen(true);

      const resolveWithCleanup = (result: boolean) => {
        setIsOpen(false);
        setConfig(null);
        setIsLoading(false);
        resolve(result);
      };

      // Store these for use in the buttons
      (window as any).__confirmResolve = resolveWithCleanup;
    });
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await config?.onConfirm?.();
      (window as any).__confirmResolve?.(true);
    } catch (error) {
      console.error('Confirmation error:', error);
      (window as any).__confirmResolve?.(false);
    }
  };

  const handleCancel = () => {
    (window as any).__confirmResolve?.(false);
  };

  return {
    isOpen,
    config,
    isLoading,
    confirm,
    handleConfirm,
    handleCancel,
    ConfirmDialogComponent: (
      <ConfirmDialog
        isOpen={isOpen}
        {...(config as any)}
        isLoading={isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
  };
}
