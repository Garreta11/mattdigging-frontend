import React from 'react';
import './Admin.scss';
import type { Tab, Artist, TrackListItem, Genre, Mood, Selection } from './types';
import { useAdminApi } from './hooks/useAdminApi';
import { ArtistPanel, TrackPanel, TagsPanel, SelectionsPanel } from './components';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const AdminLogin = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-gate">
      <div className="admin-gate__card">
        <h1 className="admin-gate__title">Admin Access</h1>
        <p className="admin-gate__message">This area is restricted to admin members only.</p>
        <form className="admin-gate__form" onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com"
              disabled={loading}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              placeholder="••••••••"
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="admin-gate__error">{error}</p>}
          <button type="submit" className="admin-gate__submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminContent = () => {
  const [activeTab, setActiveTab] = React.useState<Tab>('artists');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBusy, setIsBusy] = React.useState(false);

  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [tracks, setTracks] = React.useState<TrackListItem[]>([]);
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [moods, setMoods] = React.useState<Mood[]>([]);
  const [selections, setSelections] = React.useState<Selection[]>([]);

  const api = useAdminApi();

  const refreshArtists = React.useCallback(async () => {
    setArtists(await api.refreshArtists());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshTracks = React.useCallback(async () => {
    setTracks(await api.refreshTracks());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshTags = React.useCallback(async () => {
    const data = await api.refreshTags();
    setGenres(data.genres);
    setMoods(data.moods);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshSelections = React.useCallback(async () => {
    setSelections(await api.refreshSelections());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    (async () => {
      try {
        const [artistData, trackData, tagData, selectionData] = await Promise.all([
          api.refreshArtists(),
          api.refreshTracks(),
          api.refreshTags(),
          api.refreshSelections(),
        ]);
        setArtists(artistData);
        setTracks(trackData);
        setGenres(tagData.genres);
        setMoods(tagData.moods);
        setSelections(selectionData);
      } catch (err) {
        setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load data' });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function renderStatus() {
    if (!status) return null;
    return (
      <div className={`admin-toast admin-toast--${status.type}`}>
        <span>{status.message}</span>
        <button type="button" onClick={() => setStatus(null)}>
          ×
        </button>
      </div>
    );
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'artists':
        return (
          <ArtistPanel
            artists={artists}
            onRefresh={refreshArtists}
            onStatus={setStatus}
            isBusy={isBusy}
            setIsBusy={setIsBusy}
          />
        );
      case 'tracks':
        return (
          <TrackPanel
            tracks={tracks}
            artists={artists}
            genres={genres}
            moods={moods}
            onRefresh={refreshTracks}
            onStatus={setStatus}
            isBusy={isBusy}
            setIsBusy={setIsBusy}
          />
        );
      case 'tags':
        return (
          <TagsPanel
            genres={genres}
            moods={moods}
            onRefresh={refreshTags}
            onStatus={setStatus}
            isBusy={isBusy}
            setIsBusy={setIsBusy}
          />
        );
      case 'selections':
        return (
          <SelectionsPanel
            selections={selections}
            tracks={tracks}
            onRefresh={refreshSelections}
            onStatus={setStatus}
            isBusy={isBusy}
            setIsBusy={setIsBusy}
          />
        );
      default:
        return null;
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Admin</h2>
        <nav>
          <button className={activeTab === 'artists' ? 'active' : ''} onClick={() => setActiveTab('artists')}>
            Artists
          </button>
          <button className={activeTab === 'tracks' ? 'active' : ''} onClick={() => setActiveTab('tracks')}>
            Tracks
          </button>
          <button className={activeTab === 'tags' ? 'active' : ''} onClick={() => setActiveTab('tags')}>
            Tags
          </button>
          <button className={activeTab === 'selections' ? 'active' : ''} onClick={() => setActiveTab('selections')}>
            Selections
          </button>
        </nav>
        <button className="admin-sidebar__logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="admin-content">
        {renderStatus()}
        {renderActiveTab()}
      </main>
    </div>
  );
};

const Admin = () => {
  const { isAuthed, loading: authLoading } = useAppContext();

  if (authLoading) return <div className="admin-gate admin-gate--loading">Loading…</div>;
  if (!isAuthed) return <AdminLogin />;
  return <AdminContent />;
};

export default Admin;