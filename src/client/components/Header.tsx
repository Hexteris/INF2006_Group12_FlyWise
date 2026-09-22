interface HeaderProps {
  title?: string;
  subtitle?: string;
}

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
}: HeaderProps) {
  return (
    <header className="bg-surface border-b border-line shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-ink tracking-tight">{title}</h1>
        <p className="text-ink-dim mt-1">{subtitle}</p>
      </div>
    </header>
  );
}
