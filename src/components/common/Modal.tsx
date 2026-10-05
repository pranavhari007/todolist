import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    /*
     * Overlay: full-screen flex centering.
     * On mobile we shift the modal toward the top so the virtual keyboard doesn't
     * push it fully off screen. `items-start sm:items-center` + top padding handles this.
     * `pb-safe` / padding-bottom accounts for iOS home-indicator safe area.
     */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className={[
          'w-full',
          widthClasses[maxWidth] ?? 'max-w-lg',
          'bg-white dark:bg-gray-800',
          // Full-width sheet on mobile, rounded dialog on sm+
          'rounded-t-2xl sm:rounded-2xl',
          'shadow-xl border border-gray-200 dark:border-gray-700',
          'flex flex-col',
          // Mobile: up to 92vh with safe-area bottom; Desktop: up to 90vh
          'max-h-[92dvh] sm:max-h-[90vh]',
          'overflow-hidden transform transition-all',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Drag handle visible on mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <h3
              id="modal-title"
              className="text-base font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable body — pb-safe handles iOS home indicator */}
        <div
          className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
