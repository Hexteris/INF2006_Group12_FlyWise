interface ErrorBannerProps {
  /** Messages to show. Falsy entries are ignored so callers can pass error slots directly. */
  errors: (string | null)[];
}

/**
 * Surfaces failed requests in the UI.
 *
 * Previously a failed fetch was only console.error'd and the affected table
 * rendered its "no data" message, which is indistinguishable from a genuinely
 * empty result. role="alert" announces the failure to screen readers.
 */
export default function ErrorBanner({ errors }: ErrorBannerProps) {
  const messages = [...new Set(errors.filter((message): message is string => Boolean(message)))];

  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex gap-3 rounded-xl border-2 border-bad/40 bg-bad/10 px-6 py-4 shadow-md"
    >
      <svg
        className="mt-0.5 h-5 w-5 flex-shrink-0 text-bad"
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
      <div>
        <p className="font-semibold text-bad">Some data could not be loaded</p>
        <ul className="mt-2 list-disc list-inside text-sm text-bad/90">
          {messages.map(message => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
