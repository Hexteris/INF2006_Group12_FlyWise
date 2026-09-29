import { useState, useEffect, memo, useCallback } from 'react';
import type { Page, User } from '../../types';
import { MOBILE_ONLY, DESKTOP_ONLY, FOCUS_VISIBLE, BUTTON_SECONDARY } from '../styles';
import logo from '/src/Flywise Logo.jpg';

export type AppView = Page;

interface HeaderProps {
  title?: string;
  subtitle?: string;
  activeView?: AppView;
  onNavigate?: (view: AppView) => void;
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

const Icons = {
  Live: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Analytics: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Predict: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8M14 7h7v7" />
    </svg>
  ),
  Menu: ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronRight: ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

const NAV_ITEMS: {
  id: AppView; label: string; hint: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'live', label: 'Live Flights', hint: 'Search upcoming US domestic flights', Icon: Icons.Live },
  { id: 'analytics', label: 'Analytics', hint: 'Delay trends and reliability', Icon: Icons.Analytics },
  { id: 'predict', label: 'Prediction', hint: 'Delay forecasts and past flights', Icon: Icons.Predict },
];

const LOGIN_BTN =
  'rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:bg-slate-300 active:scale-[0.98]';

function Header({
  title = 'FlyWise',
  subtitle = 'Flight Delay Intelligence Platform',
  activeView = 'live',
  onNavigate,
  user = null,
  onLogin,
  onLogout,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 5);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavigation = useCallback((view: AppView) => {
    setIsMobileMenuOpen(false);
    onNavigate?.(view);
  }, [onNavigate]);

  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((p) => !p), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`
          sticky top-0 z-50 bg-surface border-b border-line/50
          transition-all duration-200 ${hasScrolled ? 'shadow-md' : 'shadow-sm'}
          backdrop-blur-sm bg-surface/95
        `}
        role="banner"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 py-3 md:py-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="FlyWise Logo" className="w-30 h-10 rounded-full" />
              <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-ink">{title}</h1>
                <p className="text-xs md:text-sm text-ink-dim/80">{subtitle}</p>
              </div>
            </div>

            <div className={`${DESKTOP_ONLY} flex items-center shrink-0`}>
              <nav
                aria-label="Primary navigation"
                className="flex items-center gap-0.5 rounded-xl border border-line/50 bg-surface-raised p-1"
              >
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigation(item.id)}
                    className={`
                      whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium
                      flex items-center gap-1.5 transition-all duration-200
                      ${FOCUS_VISIBLE}
                      ${activeView === item.id
                        ? 'bg-amber text-bg shadow-sm'
                        : 'text-ink-dim hover:bg-surface hover:text-ink'}
                      active:scale-[0.98]
                    `}
                    aria-current={activeView === item.id ? 'page' : undefined}
                  >
                    <item.Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}

                <div className="mx-1 h-6 w-px bg-line/50" />

                {user ? (
                  <>
                    <span className="px-2 text-xs text-ink-dim whitespace-nowrap">
                      Signed in as <b className="text-ink">{user.username}</b>
                    </span>

                    <button
                      type="button"
                      onClick={onLogout}
                      className={`${BUTTON_SECONDARY} ${FOCUS_VISIBLE} px-3 py-2 text-xs whitespace-nowrap`}
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onLogin}
                    className={`${LOGIN_BTN} ${FOCUS_VISIBLE} whitespace-nowrap`}
                  >
                    Log in / Sign up
                  </button>
                )}
              </nav>
            </div>

            <button
              type="button"
              onClick={toggleMobileMenu}
              className={`
                ${MOBILE_ONLY}
                w-10 h-10 rounded-lg border border-line/50 bg-surface
                flex items-center justify-center transition-all duration-200
                ${FOCUS_VISIBLE}
                hover:bg-surface-raised active:scale-95
                ${isMobileMenuOpen ? 'bg-amber text-bg' : 'text-ink-dim'}
              `}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={`
            ${MOBILE_ONLY}
            fixed inset-0 z-40 bg-bg/95 backdrop-blur-sm
            transition-all duration-300 transform
            ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}
          `}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="flex flex-col h-full pt-16 px-4 pb-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-ink mb-1">Navigation</h2>
              <p className="text-sm text-ink-dim">Select a section</p>
            </div>

            <nav className="flex-1 space-y-1" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    w-full rounded-lg p-4 text-left
                    flex items-center gap-3 transition-all duration-200
                    ${FOCUS_VISIBLE}
                    ${activeView === item.id
                      ? 'bg-amber text-bg shadow-sm'
                      : 'bg-surface border border-line/50 text-ink-dim hover:bg-surface-raised hover:text-ink'}
                    active:scale-[0.98]
                  `}
                  aria-current={activeView === item.id ? 'page' : undefined}
                >
                  <item.Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs opacity-80 mt-0.5">{item.hint}</div>
                  </div>
                  {activeView === item.id && <Icons.ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </nav>

            <div className="mt-6 space-y-2 border-t border-line/50 pt-4">
              {user ? (
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); onLogout?.(); }}
                  className={`${BUTTON_SECONDARY} w-full justify-center text-sm py-2.5`}
                >
                  Log out ({user.username})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); onLogin?.(); }}
                  className={`${LOGIN_BTN} w-full py-2.5 text-sm`}
                >
                  Log in / Sign up
                </button>
              )}

              <button
                type="button"
                onClick={toggleMobileMenu}
                className={`${BUTTON_SECONDARY} w-full justify-center text-sm py-2.5`}
              >
                Close menu
              </button>
            </div>
          </div>
        </div>
      </header>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber focus:text-bg focus:rounded focus:font-medium focus:shadow-sm text-xs"
      >
        Skip to main content
      </a>
    </>
  );
}

export default memo(Header, (prev, next) =>
  prev.title === next.title &&
  prev.subtitle === next.subtitle &&
  prev.activeView === next.activeView &&
  prev.user === next.user &&
  prev.onNavigate === next.onNavigate &&
  prev.onLogin === next.onLogin &&
  prev.onLogout === next.onLogout
);