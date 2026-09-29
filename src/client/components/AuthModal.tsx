import { useState } from 'react';
import type { User } from '../../types';
import { login, setToken, signup } from '../services/api';

interface Props {
  onClose: () => void;
  onDone: (user: User) => void;
}

export default function AuthModal({ onClose, onDone }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');

    try {
      if (mode === 'signup') {
        await signup(username, email, password);
      }

      const r = await login(username, password);
      setToken(r.access_token);

      onDone({
        id: r.user_id,
        username: r.username,
        email: r.email,
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input =
    'w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 ' +
    'text-sm text-ink placeholder:text-ink-dim ' +
    'focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 ' +
    'transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-2xl"
      >
        <div>
          <h2 className="text-xl font-semibold text-ink">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </h2>

          <p className="mt-1 text-sm text-ink-dim">
            {mode === 'login'
              ? 'Log in to access your FlyWise account.'
              : 'Create an account to save and manage your flights.'}
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-ink">
            Username
            <input
              className={`${input} mt-1.5`}
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          {mode === 'signup' && (
            <label className="block text-sm font-medium text-ink">
              Email
              <input
                className={`${input} mt-1.5`}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          )}

          <label className="block text-sm font-medium text-ink">
            Password
            <input
              className={`${input} mt-1.5`}
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
            {error}
          </div>
        )}

        <button
          disabled={busy}
          className="w-full rounded-lg bg-amber px-4 py-2.5 font-semibold text-bg shadow-sm transition-all hover:bg-amber/90 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? 'Please wait…'
            : mode === 'login'
              ? 'Log in'
              : 'Sign up'}
        </button>

        <button
          type="button"
          className="w-full text-sm font-medium text-amber transition-colors hover:text-amber/80"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
        >
          {mode === 'login'
            ? 'No account? Sign up'
            : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
}