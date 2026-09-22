const CAPABILITIES = [
  {
    title: 'Historical analytics',
    body: 'Delay rates per route, airline, and departure hour, computed over the training window.',
  },
  {
    title: 'Delay prediction',
    body: 'A prediction for a specific flight, shown alongside the historical rates behind it.',
  },
  {
    title: 'Single deployment',
    body: 'One image serves the dashboard and the API; MySQL holds the aggregates.',
  },
];

/**
 * Static explanatory copy for first-time viewers of the dashboard.
 *
 * Kept as the one intentionally distinct "informational" panel on the page -
 * an amber-accented border rather than the neutral PANEL used elsewhere - so
 * it reads as context/documentation rather than another data section.
 */
export default function AboutPanel() {
  return (
    <section className="mt-8 rounded-2xl border border-amber/30 bg-surface-raised p-6 shadow-lg">
      <h2 className="mb-3 text-lg font-semibold text-ink">About FlyWise</h2>
      <p className="mb-4 text-ink-dim">
        FlyWise summarises historical US flight on-time performance and uses it to flag
        flights at risk of departing late. Delay means a departure 15 or more minutes
        behind schedule.
      </p>
      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
        {CAPABILITIES.map(capability => (
          <div key={capability.title} className="rounded-lg bg-bg p-3">
            <h3 className="font-medium text-amber">{capability.title}</h3>
            <p className="mt-1 text-ink-dim">{capability.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
