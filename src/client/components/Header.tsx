import { useState, useEffect, memo, useCallback } from 'react';
import { MOBILE_ONLY, DESKTOP_ONLY, FOCUS_VISIBLE, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../styles';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  activeView?: AppView;
  onNavigate?: (view: AppView) => void;
}

export type AppView = 'overview' | 'flights' | 'live' | 'analytics';

// Professional SVG icon components
const Icons = {
  Overview: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Flights: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  Live: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Analytics: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Menu: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  ChevronRight: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  User: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Logout: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Settings: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const NAV_ITEMS: { id: AppView; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', Icon: Icons.Overview },
  { id: 'flights', label: 'Search', Icon: Icons.Flights },
  { id: 'live', label: 'Live', Icon: Icons.Live },
  { id: 'analytics', label: 'Analytics', Icon: Icons.Analytics },
];

/**
 * Sleek, compact page header with professional icons and minimal height.
 * Features mobile-responsive navigation with hamburger menu and improved UX.
 */
function Header({
  title = 'FlyWise',
  subtitle = 'Flight Delay Intelligence Platform',
  activeView = 'overview',
  onNavigate,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState<AppView>(activeView);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const {
    user,
    isAuthenticated,
    loading,
    logout,
    openAuthModal,
    openSettingsModal,
  } = useAuth();

  // Handle scroll effect for subtle header shadow
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 5);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active item when prop changes
  useEffect(() => {
    setActiveItem(activeView);
  }, [activeView]);

  const handleNavigation = useCallback((view: AppView) => {
    setActiveItem(view);
    setIsMobileMenuOpen(false);
    onNavigate?.(view);
  }, [onNavigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAccountDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative > button') && !target.closest('.absolute[role="menu"]')) {
          setIsAccountDropdownOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isAccountDropdownOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
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
          {/* Compact header layout - reduced height */}
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Logo and title - more compact */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Minimal logo without extra animations */}
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-amber to-good flex items-center justify-center shadow-sm">
                <span className="text-sm md:text-base font-bold text-bg">FW</span>
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-ink">
                  {title}
                </h1>
                <p className="text-xs md:text-sm text-ink-dim/80">{subtitle}</p>
              </div>
            </div>

            {/* Desktop navigation and auth */}
            <div className={`${DESKTOP_ONLY} flex items-center gap-3`}>
              {/* Compact navigation */}
              <nav 
                aria-label="Primary navigation" 
                className="flex items-center gap-1 rounded-xl border border-line/50 bg-surface-raised p-1"
              >
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigation(item.id)}
                    className={`
                      whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium
                      flex items-center gap-1.5 transition-all duration-200
                      ${FOCUS_VISIBLE}
                      ${activeItem === item.id
                        ? 'bg-amber text-bg shadow-sm'
                        : 'text-ink-dim hover:bg-surface hover:text-ink'
                      }
                      active:scale-[0.98]
                    `}
                    aria-current={activeItem === item.id ? 'page' : undefined}
                    aria-label={`Navigate to ${item.label}`}
                  >
                    <item.Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Auth UI */}
              <div className="relative">
                {loading ? (
                  <div className="w-8 h-8 rounded-full border-2 border-amber border-t-transparent animate-spin"></div>
                ) : isAuthenticated ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg
                        border border-line/50 bg-surface hover:bg-surface-raised
                        transition-all duration-200 ${FOCUS_VISIBLE}
                      `}
                      aria-label="Account menu"
                      aria-expanded={isAccountDropdownOpen}
                    >
                      <div className="w-7 h-7 rounded-full bg-amber/20 flex items-center justify-center">
                        <Icons.User className="w-3.5 h-3.5 text-amber" />
                      </div>
                      <div className="text-xs font-medium text-ink truncate max-w-20">
                        {user?.name || user?.email.split('@')[0]}
                      </div>
                    </button>

                    {/* Account dropdown */}
                    {isAccountDropdownOpen && (
                      <div 
                        className="absolute right-0 mt-1 w-48 bg-surface border border-line/50 rounded-lg shadow-lg py-1 z-50"
                        role="menu"
                      >
                        <div className="px-3 py-2 border-b border-line/50">
                          <div className="text-xs font-semibold text-ink">
                            {user?.name || user?.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-ink-dim truncate">
                            {user?.email}
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            openSettingsModal();
                            setIsAccountDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-ink-dim hover:bg-surface-raised flex items-center gap-2"
                          role="menuitem"
                        >
                          <Icons.Settings className="w-3.5 h-3.5" />
                          Account Settings
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setShowLogoutConfirm(true);
                            setIsAccountDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-bad hover:bg-surface-raised flex items-center gap-2"
                          role="menuitem"
                        >
                          <Icons.Logout className="w-3.5 h-3.5" />
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-lg
                      border border-line/50 bg-surface hover:bg-surface-raised
                      text-ink hover:text-ink transition-all duration-200
                      ${FOCUS_VISIBLE}
                    `}
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu toggle - more compact */}
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
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <Icons.Close className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay - compact design */}
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
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    w-full rounded-lg p-4 text-left
                    flex items-center gap-3 transition-all duration-200
                    ${FOCUS_VISIBLE}
                    ${activeItem === item.id
                      ? 'bg-amber text-bg shadow-sm'
                      : 'bg-surface border border-line/50 text-ink-dim hover:bg-surface-raised hover:text-ink'
                    }
                    active:scale-[0.98]
                  `}
                  aria-current={activeItem === item.id ? 'page' : undefined}
                >
                  <item.Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs opacity-80 mt-0.5">
                      {item.id === 'overview' && 'Dashboard and metrics'}
                      {item.id === 'flights' && 'Search and filter flights'}
                      {item.id === 'live' && 'Real-time flight data'}
                      {item.id === 'analytics' && 'Analytics and insights'}
                    </div>
                  </div>
                  {activeItem === item.id && (
                    <Icons.ChevronRight className="w-4 h-4 animate-pulse" />
                  )}
                </button>
              ))}

              {/* Mobile auth section */}
              <div className="pt-4 mt-4 border-t border-line/50">
                {loading ? (
                  <div className="flex justify-center py-3">
                    <div className="w-6 h-6 rounded-full border-2 border-amber border-t-transparent animate-spin"></div>
                  </div>
                ) : isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 bg-surface border border-line/50 rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center">
                          <Icons.User className="w-4 h-4 text-amber" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-ink">
                            {user?.name || user?.email.split('@')[0]}
                          </div>
                          <div className="text-xs text-ink-dim truncate">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        openSettingsModal();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full p-3 text-left bg-surface border border-line/50 rounded-lg hover:bg-surface-raised flex items-center gap-3"
                    >
                      <Icons.Settings className="w-4 h-4" />
                      <span className="text-sm">Account Settings</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full p-3 text-left bg-surface border border-bad/20 rounded-lg hover:bg-bad/5 text-bad mt-1 flex items-center gap-3"
                    >
                      <Icons.Logout className="w-4 h-4" />
                      <span className="text-sm">Log out</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      openAuthModal('login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full p-3 text-center bg-surface border border-line/50 rounded-lg hover:bg-surface-raised text-ink font-medium"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </nav>

            <div className="mt-6 pt-4 border-t border-line/50">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className={`${BUTTON_SECONDARY} w-full justify-center text-sm py-2.5`}
                aria-label="Close menu"
              >
                Close menu
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-amber focus:text-bg focus:rounded focus:font-medium focus:shadow-sm text-xs"
      >
        Skip to main content
      </a>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/95 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-surface border border-line/50 rounded-xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-bad/20 flex items-center justify-center">
                  <Icons.Logout className="w-5 h-5 text-bad" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Sign Out</h3>
                  <p className="text-sm text-ink-dim mt-1">Are you sure you want to sign out?</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-surface-raised border border-line/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber/20 flex items-center justify-center">
                      <Icons.User className="w-4 h-4 text-amber" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-ink">
                        {user?.name || user?.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-ink-dim truncate">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowLogoutConfirm(false);
                    }}
                    className={`${BUTTON_PRIMARY} flex-1 justify-center bg-bad hover:bg-bad/90`}
                  >
                    <Icons.Logout className="w-4 h-4" />
                    Sign out
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`${BUTTON_SECONDARY} flex-1 justify-center`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Memoized component to prevent unnecessary re-renders
export default memo(Header, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.subtitle === nextProps.subtitle &&
    prevProps.activeView === nextProps.activeView
  );
});