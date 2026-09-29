import { useCallback, useEffect, useState } from 'react';
import type { Page, User } from '../types';
import {
  deleteUpcoming, fetchAirlines, fetchAirports, fetchMe, fetchSummary,
  fetchUpcomingSaved, hasToken, saveUpcoming, setToken,
} from './services/api';
import { useApiResource } from './hooks/useApiResource';
import { count } from './format';
import { fromSaved, toSaveBody, type TripFlight } from './trip';
import Header from './components/Header';
import LiveFlightsPage from './components/LiveFlightsPage';
import AnalyticsPage from './components/AnalyticsPage';
import PredictionPage from './components/PredictionPage';
import AuthModal from './components/AuthModal';

export default function App() {
  const [page, setPage] = useState<Page>('live');
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [searched, setSearched] = useState<TripFlight[]>([]);
  const [saved, setSaved] = useState<TripFlight[]>([]);
  const [notice, setNotice] = useState('');

  // dropdown sources shared by every page
  const { data: dims } = useApiResource(
    async () => {
      const [airports, airlines] = await Promise.all([fetchAirports(), fetchAirlines()]);
      return { airports, airlines };
    },
    []
  );
  const { data: summary } = useApiResource(fetchSummary, []);

  // restore session from the stored token
  useEffect(() => {
    if (!hasToken()) return;
    fetchMe()
      .then((u) => setUser({ id: u.user_id, username: u.username, email: u.email }))
      .catch(() => setToken(null));
  }, []);

  const loadSaved = useCallback(async () => {
    try { setSaved((await fetchUpcomingSaved()).map(fromSaved)); }
    catch { setSaved([]); }
  }, []);
  useEffect(() => { if (user) loadSaved(); else setSaved([]); }, [user, loadSaved]);

  const openAuth = useCallback(() => setShowAuth(true), []);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  const toggleSave = async (f: TripFlight) => {
    if (!user) { setShowAuth(true); return; }
    try {
      const existing = saved.find((s) => s.key === f.key);
      if (existing?.savedId) await deleteUpcoming(existing.savedId);
      else await saveUpcoming(toSaveBody(f));
      await loadSaved();
    } catch (e) {
      setNotice((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header
        subtitle="Live Flight Delay Prediction & Historical Delay Analytics"
        activeView={page}
        onNavigate={setPage}
        user={user}
        onLogin={openAuth}
        onLogout={logout}
      />

      <main id="main-content" className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
        {notice && (
          <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-3 text-sm text-ink">
            {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">✕</button>
          </div>
        )}

        {page === 'live' && (
          <LiveFlightsPage dims={dims} flights={searched} onResults={setSearched}
                           saved={saved} onToggleSave={toggleSave} />
        )}
        {page === 'analytics' && <AnalyticsPage dims={dims} />}
        {page === 'predict' && (
          <PredictionPage dims={dims} searched={searched} saved={saved} user={user}
                          onToggleSave={toggleSave} onLogin={openAuth} />
        )}
      </main>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onDone={(u) => { setUser(u); setShowAuth(false); }}
        />
      )}

      <footer className="mt-8 border-t border-line bg-surface py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-ink-dim sm:px-6 lg:px-8">
          <p>FlyWise Flight Delay Prediction Intelligence Platform</p>
          {summary && (
            <p className="mt-1 font-mono text-ink-dim/70">
              {count(summary.totalFlights)} flights across {count(summary.routeCount)} routes
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}