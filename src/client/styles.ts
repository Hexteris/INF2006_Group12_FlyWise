// Enhanced design system with 8px spacing scale, improved accessibility,
// and comprehensive animation system for modern UI/UX
//
// Palette: ported from the FlyWise.html prototype's dark navy/amber theme
// (see tailwind.config.js for the raw color values: bg, surface,
// surface-raised, line, ink, ink-dim, amber, good, bad).
// All colors checked for WCAG AA contrast compliance (4.5:1 minimum).

/** 8px spacing scale foundation for consistent visual rhythm */
export const SPACING = {
  xs: '0.5rem',    // 8px
  sm: '1rem',      // 16px
  md: '1.5rem',    // 24px
  lg: '2rem',      // 32px
  xl: '3rem',      // 48px
} as const;

/** Animation timing constants for consistent micro-interactions */
export const ANIMATION = {
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
} as const;

/** Base card recipe shared by every section: elevated, rounded, clearly separated from the page. */
export const PANEL = 'bg-surface rounded-2xl shadow-lg border border-line transition-all duration-250 hover:shadow-xl';

/** Panel padding using 8px scale, kept separate so tables can opt out. */
export const PANEL_PADDING = 'p-6 md:p-8';

/** Full section shorthand for the common case: panel + padding. */
export const PANEL_WITH_PADDING = `${PANEL} ${PANEL_PADDING}`;

/**
 * Enhanced colored top accent strip for section headers with animation support.
 * Applied as a border-t-4 on the panel itself with hover animation.
 *
 * Keys are semantic roles, not literal colors. All colors meet WCAG AA contrast requirements.
 */
export const ACCENT_BORDER: Record<'blue' | 'violet' | 'teal' | 'amber' | 'rose' | 'slate', string> = {
  blue: 'border-t-4 border-t-amber transition-colors duration-250 hover:border-t-amber/80',
  violet: 'border-t-4 border-t-amber transition-colors duration-250 hover:border-t-amber/80',
  teal: 'border-t-4 border-t-good transition-colors duration-250 hover:border-t-good/80',
  amber: 'border-t-4 border-t-amber transition-colors duration-250 hover:border-t-amber/80',
  rose: 'border-t-4 border-t-bad transition-colors duration-250 hover:border-t-bad/80',
  slate: 'border-t-4 border-t-line transition-colors duration-250 hover:border-t-ink-dim/60',
};

export type AccentColor = keyof typeof ACCENT_BORDER;

/** Enhanced section heading style with better hierarchy and focus styles */
export const SECTION_HEADING = 'text-lg md:text-xl font-semibold text-ink tracking-tight focus:outline-none focus:ring-2 focus:ring-amber/50 focus:ring-offset-2 focus:ring-offset-surface rounded';

/** Enhanced form control styling with better accessibility and interaction states */
export const FIELD_CLASSES =
  'w-full rounded-lg border border-line bg-surface-raised px-4 py-3 text-ink shadow-sm font-mono text-base ' +
  'transition-all duration-250 focus:border-amber focus:ring-3 focus:ring-amber/30 focus:ring-offset-1 focus:ring-offset-surface ' +
  'hover:border-ink-dim/40 hover:bg-surface-raised/80 ' +
  'disabled:bg-surface disabled:text-ink-dim/50 disabled:cursor-not-allowed ' +
  'aria-invalid:border-bad aria-invalid:ring-bad/30 aria-invalid:focus:border-bad';

/** Enhanced field label styling with better spacing and accessibility */
export const FIELD_LABEL = 'block text-sm font-semibold text-ink-dim mb-2 tracking-wide';

/** Skeleton loading animation for async content */
export const SKELETON_CLASSES = 'animate-pulse bg-surface-raised text-transparent rounded select-none';

/** Enhanced primary call-to-action button with improved accessibility and interaction states */
export const BUTTON_PRIMARY =
  'rounded-lg bg-amber px-5 py-3.5 font-semibold text-bg shadow-md transition-all duration-250 ' +
  'hover:bg-amber/90 hover:shadow-lg hover:-translate-y-0.5 ' +
  'active:scale-[0.98] active:shadow-sm ' +
  'focus:outline-none focus:ring-3 focus:ring-amber/40 focus:ring-offset-2 focus:ring-offset-surface ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md ' +
  'min-h-[44px] min-w-[44px] flex items-center justify-center'; // WCAG touch target minimum

/** Secondary button variant for less prominent actions */
export const BUTTON_SECONDARY =
  'rounded-lg bg-surface-raised px-5 py-3.5 font-semibold text-ink shadow-sm border border-line transition-all duration-250 ' +
  'hover:bg-surface hover:shadow-md hover:-translate-y-0.5 hover:border-ink-dim/60 ' +
  'active:scale-[0.98] active:shadow-sm ' +
  'focus:outline-none focus:ring-3 focus:ring-amber/30 focus:ring-offset-2 focus:ring-offset-surface ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ' +
  'min-h-[44px] min-w-[44px] flex items-center justify-center';

/** Danger button variant for destructive actions */
export const BUTTON_DANGER =
  'rounded-lg bg-bad px-5 py-3.5 font-semibold text-bg shadow-md border border-bad/30 transition-all duration-250 ' +
  'hover:bg-bad/90 hover:shadow-lg hover:-translate-y-0.5 ' +
  'active:scale-[0.98] active:shadow-sm ' +
  'focus:outline-none focus:ring-3 focus:ring-bad/40 focus:ring-offset-2 focus:ring-offset-surface ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md ' +
  'min-h-[44px] min-w-[44px] flex items-center justify-center gap-2';

/** Loading spinner animation for async operations */
export const LOADING_SPINNER = 'animate-spin h-5 w-5 border-2 border-amber/30 border-t-amber rounded-full';

/** Success/error notification styles for form feedback */
export const NOTIFICATION_SUCCESS = 'rounded-lg border border-good/30 bg-good/10 px-4 py-3 text-sm text-good';
export const NOTIFICATION_ERROR = 'rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad';
export const NOTIFICATION_INFO = 'rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-ink';
export const NOTIFICATION_WARNING = 'rounded-lg border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-ink';

/** Focus management styles for keyboard navigation */
export const FOCUS_VISIBLE = 'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-amber/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

/** Mobile-specific responsive utilities */
export const MOBILE_HIDDEN = 'hidden md:block';
export const MOBILE_ONLY = 'md:hidden';
export const DESKTOP_ONLY = 'hidden lg:block';

/** Grid system for consistent layouts */
export const GRID_RESPONSIVE = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
export const GRID_FORM = 'grid grid-cols-1 md:grid-cols-2 gap-6';

/** Typography scale for consistent text hierarchy */
export const TEXT_XL = 'text-2xl md:text-3xl font-bold tracking-tight text-ink';
export const TEXT_LG = 'text-xl md:text-2xl font-semibold text-ink';
export const TEXT_MD = 'text-base md:text-lg font-medium text-ink';
export const TEXT_SM = 'text-sm md:text-base font-normal text-ink-dim';
