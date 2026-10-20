import React from 'react';
import './Admin.scss';
import type { Tab, Artist, TrackListItem, Genre, Mood, Selection } from './types';
import { useAdminApi } from './hooks/useAdminApi';
import { ArtistPanel, TrackPanel, TagsPanel, SelectionsPanel } from './components';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: 'artists', label: 'Artists', description: 'Profiles, bios and photos of the artists in the catalogue.' },
  { id: 'tracks', label: 'Tracks', description: 'Upload audio, covers and tag every track.' },
  { id: 'tags', label: 'Tags', description: 'Genres and moods used to classify tracks.' },
  { id: 'selections', label: 'Selections', description: 'Curate and publish the weekly selections.' },
];

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
        <img className="admin-gate__logo" src="/svg/logo-color.svg" alt="Matt Digging" />
        <div className="admin-gate__heading">
          <span className="admin-eyebrow">Backoffice</span>
          <h1 className="admin-gate__title">Admin access</h1>
          <p className="admin-gate__message">This area is restricted to admin members only.</p>
        </div>
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
        <button type="button" onClick={() => setStatus(null)} aria-label="Dismiss">
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

  const counts: Record<Tab, number> = {
    artists: artists.length,
    tracks: tracks.length,
    tags: genres.length + moods.length,
    selections: selections.length,
  };
  const currentTab = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <a href="/" className="admin-sidebar__logo" aria-label="Back to site">
            <img src="/svg/logo-color.svg" alt="Matt Digging" />
          </a>
          <span className="admin-eyebrow">Backoffice</span>
        </div>
        <nav className="admin-sidebar__nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-sidebar__tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="admin-sidebar__count">{counts[tab.id]}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <a href="/" className="admin-sidebar__link">View site</a>
          <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-content">
        <header className="admin-content__header">
          <span className="admin-eyebrow">Admin</span>
          <h1>{currentTab.label}</h1>
          <p>{currentTab.description}</p>
        </header>
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