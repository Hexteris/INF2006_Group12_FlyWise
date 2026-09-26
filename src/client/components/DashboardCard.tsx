import { memo } from 'react';
import { SKELETON_CLASSES, FOCUS_VISIBLE } from '../styles';

export type CardColor = 'blue' | 'green' | 'red' | 'purple' | 'yellow';

interface DashboardCardProps {
  title: string;
  value: string;
  description?: string;
  color?: CardColor;
  isLoading?: boolean;
  loadingWidth?: number;
}

// Enhanced color mapping with animations and hover effects
// All colors meet WCAG AA contrast requirements (4.5:1 minimum)
const COLOR_CLASSES: Record<CardColor, { 
  card: string; 
  rail: string; 
  value: string; 
  dot: string;
  hover: string;
}> = {
  blue: {
    card: 'bg-surface border-line',
    rail: 'bg-amber',
    value: 'text-ink',
    dot: 'bg-amber',
    hover: 'hover:border-amber/30',
  },
  green: {
    card: 'bg-surface border-line',
    rail: 'bg-good',
    value: 'text-good',
    dot: 'bg-good',
    hover: 'hover:border-good/30',
  },
  red: {
    card: 'bg-surface border-line',
    rail: 'bg-bad',
    value: 'text-bad',
    dot: 'bg-bad',
    hover: 'hover:border-bad/30',
  },
  purple: {
    card: 'bg-surface border-line',
    rail: 'bg-amber',
    value: 'text-ink',
    dot: 'bg-amber',
    hover: 'hover:border-amber/30',
  },
  yellow: {
    card: 'bg-surface border-line',
    rail: 'bg-amber',
    value: 'text-ink',
    dot: 'bg-amber',
    hover: 'hover:border-amber/30',
  },
};

/** A single headline metric with enhanced UX and skeleton loading. */
function DashboardCard({
  title,
  value,
  description,
  color = 'blue',
  isLoading = false,
  loadingWidth = 80,
}: DashboardCardProps) {
  const palette = COLOR_CLASSES[color];

  // Skeleton loader for value
  const renderValue = () => {
    if (isLoading) {
      return (
        <div 
          className={`${SKELETON_CLASSES} h-10`} 
          style={{ width: `${loadingWidth}%` }}
          aria-label="Loading value"
        >
          {value}
        </div>
      );
    }
    return (
      <p 
        className={`text-3xl md:text-4xl font-bold mt-3 md:mt-4 tabular-nums font-mono ${palette.value}`}
        aria-live="polite"
      >
        {value}
      </p>
    );
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-6 md:p-7 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 ${palette.card} ${palette.hover} ${FOCUS_VISIBLE}`}
      tabIndex={0}
      aria-label={`${title}: ${value}${description ? `, ${description}` : ''}`}
    >
      {/* Enhanced animated left rail */}
      <span 
        className={`absolute inset-y-0 left-0 w-2 md:w-2.5 ${palette.rail} transition-all duration-300 hover:w-3`} 
        aria-hidden="true" 
      />
      
      {/* Header with enhanced spacing and skeleton support */}
      <div className="flex items-center gap-2.5 mb-3 md:mb-4">
        <span 
          className={`h-2.5 w-2.5 rounded-full ${palette.dot} transition-transform duration-300 hover:scale-125`} 
          aria-hidden="true" 
        />
        <h3 className="font-semibold text-sm md:text-base text-ink-dim tracking-wide">
          {isLoading ? (
            <span className={`${SKELETON_CLASSES} w-24 h-4 block`} aria-label="Loading title">
              {title}
            </span>
          ) : title}
        </h3>
      </div>

      {/* Value with skeleton loading */}
      {renderValue()}

      {/* Description with skeleton support */}
      {description && (
        <p className="text-sm text-ink-dim/80 mt-2 md:mt-3">
          {isLoading ? (
            <span className={`${SKELETON_CLASSES} w-32 h-3 block`} aria-label="Loading description">
              {description}
            </span>
          ) : description}
        </p>
      )}

      {/* Focus indicator for keyboard navigation */}
      <div className="absolute inset-0 pointer-events-none border-2 border-transparent rounded-2xl focus-within:border-amber/50 transition-colors duration-200" />
    </article>
  );
}

// Memoized component to prevent unnecessary re-renders
export default memo(DashboardCard, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.description === nextProps.description &&
    prevProps.color === nextProps.color &&
    prevProps.isLoading === nextProps.isLoading
  );
});
