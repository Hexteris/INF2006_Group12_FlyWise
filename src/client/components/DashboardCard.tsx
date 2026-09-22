export type CardColor = 'blue' | 'green' | 'red' | 'purple' | 'yellow';

interface DashboardCardProps {
  title: string;
  value: string;
  description?: string;
  color?: CardColor;
}

// Full class strings, not interpolated fragments: Tailwind scans source text, so
// a constructed name like `bg-${color}-50` would be purged from the build.
//
// The FlyWise.html prototype's palette has exactly three semantic colors
// (amber/good/bad) on top of dark neutral surfaces - no five-way rainbow like
// stock Tailwind. Every CardColor variant is mapped onto that same three-color
// vocabulary rather than inventing new hues the theme doesn't have: blue and
// purple and yellow all read as "amber" (the theme's one general-purpose
// accent), green reads as "good", red reads as "bad". Each variant keeps a
// saturated left rail and icon dot so the card still reads as distinctly
// colored at a glance.
const COLOR_CLASSES: Record<CardColor, { card: string; rail: string; value: string; dot: string }> = {
  blue: {
    card: 'bg-surface border-line',
    rail: 'bg-amber',
    value: 'text-ink',
    dot: 'bg-amber',
  },
  green: {
    card: 'bg-surface border-line',
    rail: 'bg-good',
    value: 'text-good',
    dot: 'bg-good',
  },
  red: {
    card: 'bg-surface border-line',
    rail: 'bg-bad',
    value: 'text-bad',
    dot: 'bg-bad',
  },
  purple: {
    card: 'bg-surface border-line',
    rail: 'bg-amber',
    value: 'text-ink',
    dot: 'bg-amber',
  },
  yellow: {
    card: 'bg-surface border-line',
    rail: 'bg-amber',
    value: 'text-ink',
    dot: 'bg-amber',
  },
};

/** A single headline metric. */
export default function DashboardCard({
  title,
  value,
  description,
  color = 'blue',
}: DashboardCardProps) {
  const palette = COLOR_CLASSES[color];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 shadow-md transition-shadow hover:shadow-lg ${palette.card}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${palette.rail}`} aria-hidden="true" />
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${palette.dot}`} aria-hidden="true" />
        <h3 className="font-medium text-ink-dim">{title}</h3>
      </div>
      <p className={`text-3xl font-bold mt-3 tabular-nums font-mono ${palette.value}`}>{value}</p>
      {description && <p className="text-sm text-ink-dim/80 mt-2">{description}</p>}
    </div>
  );
}
