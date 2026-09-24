interface HeaderProps {
  title?: string;
  subtitle?: string;
  activeView?: AppView;
  onNavigate?: (view: AppView) => void;
}

export type AppView = 'overview' | 'flights' | 'live' | 'analytics';

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'flights', label: 'Flight search' },
  { id: 'live', label: 'Live flights' },
  { id: 'analytics', label: 'Analytics' },
];

/**
 * Page header. The previous version also rendered a "Dashboard | Predictions |
 * Analytics" nav and a "Get Prediction" button, none of which were wired to
 * anything - there is no router and there was no handler. Controls that look
 * clickable but do nothing are worse than absent ones, so they are gone until
 * there is something to navigate to.
 */
export default function Header({
  title = 'FlyWise',
  subtitle = 'Flight Delay Intelligence Platform',
  activeView = 'overview',
  onNavigate,
}: HeaderProps) {
  return (
    <header className="bg-surface border-b border-line shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
            <p className="mt-1 text-sm text-ink-dim">{subtitle}</p>
          </div>
          <nav aria-label="Primary navigation" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-bg p-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate?.(item.id)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeView === item.id
                    ? 'bg-amber text-bg shadow-sm'
                    : 'text-ink-dim hover:bg-surface-raised hover:text-ink'
                }`}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
