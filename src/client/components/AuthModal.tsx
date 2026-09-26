import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BUTTON_PRIMARY, FIELD_CLASSES, FIELD_LABEL, FOCUS_VISIBLE, NOTIFICATION_ERROR } from '../styles';

const AuthModal = () => {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    login, 
    signup, 
    closeAuthModal, 
    error, 
    loading,

  } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setFormError(null);
  };

  const handleModeToggle = () => {
    const newMode = mode === 'login' ? 'signup' : 'login';
    setMode(newMode);
    setFormError(null);
  };

  const validateForm = (): boolean => {
    setFormError(null);

    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      setFormError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return false;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setFormError('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await signup({ email, password, name: name.trim() || undefined });
      }
      resetForm();
    } catch (error) {
      // Error is already handled by AuthContext
      console.error('Auth error:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    closeAuthModal();
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/90 backdrop-blur-sm">
      <div 
        className={`relative w-full max-w-md rounded-2xl bg-surface border border-line shadow-xl transition-all duration-300 ${
          isAuthModalOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-ink-dim hover:text-ink hover:bg-surface-raised transition-colors duration-200"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-6 border-b border-line">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">
                {mode === 'login' ? 'Sign in to FlyWise' : 'Create your account'}
              </h2>
              <p className="text-sm text-ink-dim">
                {mode === 'login' 
                  ? 'Sign in to access delay predictions' 
                  : 'Join FlyWise for personalized flight delay predictions'}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 rounded-xl border border-line bg-surface-raised p-1 mt-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${FOCUS_VISIBLE} ${
                mode === 'login'
                  ? 'bg-amber text-bg shadow-lg'
                  : 'text-ink-dim hover:bg-surface hover:text-ink'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${FOCUS_VISIBLE} ${
                mode === 'signup'
                  ? 'bg-amber text-bg shadow-lg'
                  : 'text-ink-dim hover:bg-surface hover:text-ink'
              }`}
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error display */}
          {(error || formError) && (
            <div className={NOTIFICATION_ERROR}>
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-medium">{error || formError}</p>
                  <p className="text-xs mt-1 opacity-80">
                    Note: The backend auth endpoints are not implemented yet. This is a frontend-only implementation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Name field (signup only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className={FIELD_LABEL}>
                Full name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={FIELD_CLASSES}
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className={FIELD_LABEL}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD_CLASSES}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className={FIELD_LABEL}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD_CLASSES}
              placeholder={mode === 'login' ? 'Enter your password' : 'Create a password (min. 6 characters)'}
              required
              disabled={loading}
            />
          </div>

          {/* Confirm password (signup only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className={FIELD_LABEL}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={FIELD_CLASSES}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`${BUTTON_PRIMARY} w-full justify-center mt-6 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-bg/30 border-t-bg rounded-full" />
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
            )}
          </button>

          {/* Toggle hint */}
          <div className="text-center pt-4 border-t border-line/50">
            <p className="text-sm text-ink-dim">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={handleModeToggle}
                className="text-amber font-medium hover:text-amber/80 transition-colors duration-200"
                disabled={loading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;