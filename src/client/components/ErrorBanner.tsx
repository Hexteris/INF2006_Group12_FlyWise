import { useState, useEffect } from 'react';
import { NOTIFICATION_ERROR, FOCUS_VISIBLE } from '../styles';

interface ErrorBannerProps {
  /** Messages to show. Falsy entries are ignored so callers can pass error slots directly. */
  errors: (string | null)[];
  /** Whether to auto-dismiss errors after a delay */
  autoDismiss?: boolean;
  /** Delay in milliseconds for auto-dismiss (default: 10000ms) */
  dismissDelay?: number;
  /** Callback when errors are dismissed */
  onDismiss?: () => void;
}

/**
 * Enhanced error banner with animations, dismiss functionality, and better UX.
 * Surfaces failed requests in the UI with improved visual feedback.
 */
export default function ErrorBanner({ 
  errors, 
  autoDismiss = true,
  dismissDelay = 10000,
  onDismiss 
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  
  const messages = [...new Set(errors.filter((message): message is string => Boolean(message)))];

  // Auto-dismiss errors after delay
  useEffect(() => {
    if (autoDismiss && messages.length > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, dismissDelay);
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, autoDismiss, dismissDelay]);

  // Reset visibility when errors change
  useEffect(() => {
    if (messages.length > 0) {
      setIsVisible(true);
      setIsDismissing(false);
    }
  }, [messages]);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300); // Match CSS transition duration
  };

  if (messages.length === 0 || !isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`
        mb-6 rounded-xl border-2 border-bad/50 bg-bad/10 px-6 py-4 shadow-lg
        transition-all duration-300 animate-fade-in
        ${isDismissing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        ${FOCUS_VISIBLE}
      `}
      tabIndex={0}
    >
      <div className="flex gap-3">
        {/* Animated warning icon */}
        <div className="relative flex-shrink-0">
          <svg
            className="h-6 w-6 text-bad animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <div className="absolute inset-0 bg-bad/20 rounded-full blur-sm animate-ping" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-bad text-lg flex items-center gap-2">
                Data loading issues
                <span className="text-xs font-normal bg-bad/20 px-2 py-1 rounded-full">
                  {messages.length} error{messages.length > 1 ? 's' : ''}
                </span>
              </p>
              <p className="text-sm text-bad/80 mt-1">
                Some data could not be loaded. This may affect dashboard functionality.
              </p>
            </div>
            
            {/* Dismiss button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="text-bad/70 hover:text-bad transition-colors duration-200 p-1 rounded-lg hover:bg-bad/10"
              aria-label="Dismiss error message"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error list */}
          <ul className="mt-3 space-y-2">
            {messages.map((message, index) => (
              <li 
                key={message} 
                className={`flex items-start gap-2 p-3 rounded-lg bg-bad/5 border border-bad/20 animate-slide-in-right`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-bad font-medium mt-0.5">•</span>
                <span className="text-sm text-bad/90 flex-1">{message}</span>
              </li>
            ))}
          </ul>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-bad/20 text-bad font-medium hover:bg-bad/30 transition-colors duration-200 text-sm"
            >
              Refresh page
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-lg border border-bad/30 text-bad font-medium hover:bg-bad/10 transition-colors duration-200 text-sm"
            >
              Dismiss errors
            </button>
            <button
              type="button"
              onClick={() => {
                // In a real app, this would trigger retry logic
                console.log('Retrying failed requests...');
                handleDismiss();
              }}
              className="px-4 py-2 rounded-lg bg-bad text-white font-medium hover:bg-bad/90 transition-colors duration-200 text-sm"
            >
              Retry failed requests
            </button>
          </div>

          {/* Auto-dismiss countdown */}
          {autoDismiss && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs text-bad/60">
                <span>Auto-dismissing in:</span>
                <div className="h-1.5 flex-1 bg-bad/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-bad/60 rounded-full animate-progress"
                    style={{ animationDuration: `${dismissDelay}ms` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
