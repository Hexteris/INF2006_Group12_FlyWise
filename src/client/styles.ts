// Shared visual tokens for section-level presentation. Every top-level section
// (FilterPanel, PredictionForm, PredictionPanel, DataTable, AboutPanel) used to
// repeat the same literal `bg-white rounded-xl shadow-sm border` string, which
// is exactly why every section looked identical to every other one and to the
// page background. Centralizing the recipe here means a single place controls
// how "a section" looks, mirroring how DashboardCard already centralizes its
// own COLOR_CLASSES rather than inlining Tailwind strings per usage site.
//
// Palette: ported from the FlyWise.html prototype's dark navy/amber theme
// (see tailwind.config.js for the raw color values: bg, surface,
// surface-raised, line, ink, ink-dim, amber, good, bad).

/** Base card recipe shared by every section: elevated, rounded, clearly separated from the page. */
export const PANEL = 'bg-surface rounded-2xl shadow-md border border-line';

/** Panel padding, kept separate from PANEL so tables (no padding, own cell padding) can opt out. */
export const PANEL_PADDING = 'p-6';

/** Full section shorthand for the common case: panel + padding. */
export const PANEL_WITH_PADDING = `${PANEL} ${PANEL_PADDING}`;

/**
 * Colored top accent strip for a section header, giving each panel a distinct
 * identity without resorting to a full colored background (which would hurt
 * table/form legibility). Applied as a border-t-4 on the panel itself.
 *
 * Keys are semantic roles, not literal colors, so callers do not need to know
 * which palette value backs "amber" vs "rose" - only that "rose" means
 * danger/delayed. Several keys intentionally share the same underlying color
 * (the prototype's palette is small): violet/teal both map to amber-adjacent
 * accents rather than inventing colors the theme does not have.
 */
export const ACCENT_BORDER: Record<'blue' | 'violet' | 'teal' | 'amber' | 'rose' | 'slate', string> = {
  blue: 'border-t-4 border-t-amber',
  violet: 'border-t-4 border-t-amber',
  teal: 'border-t-4 border-t-good',
  amber: 'border-t-4 border-t-amber',
  rose: 'border-t-4 border-t-bad',
  slate: 'border-t-4 border-t-line',
};

export type AccentColor = keyof typeof ACCENT_BORDER;

/** Section heading style, consistent across every panel. */
export const SECTION_HEADING = 'text-lg font-semibold text-ink tracking-tight';

/** Shared form control styling: visible boundary + tinted background so fields read as inputs, not text. */
export const FIELD_CLASSES =
  'w-full rounded-lg border border-line bg-bg px-3 py-2 text-ink shadow-sm font-mono ' +
  'transition-colors focus:border-amber focus:ring-2 focus:ring-amber/40 ' +
  'disabled:bg-surface disabled:text-ink-dim';

/** Field label styling, consistent across DimSelect and native inputs. */
export const FIELD_LABEL = 'block text-sm font-medium text-ink-dim mb-1.5';

/** Primary call-to-action button. */
export const BUTTON_PRIMARY =
  'rounded-lg bg-amber px-4 py-3 font-semibold text-bg shadow-sm transition-all ' +
  'hover:bg-amber/90 hover:shadow-md active:scale-[0.99] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';
