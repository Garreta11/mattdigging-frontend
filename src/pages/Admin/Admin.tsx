import React from 'react';
import './Admin.scss';
import type { Tab, Artist, TrackListItem, Genre, Mood, Selection } from './types';
import { useAdminApi } from './hooks/useAdminApi';
import { ArtistPanel, TrackPanel, TagsPanel, SelectionsPanel } from './components';

const Admin = () => {
  const [activeTab, setActiveTab] = React.useState<Tab>('artists');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isBusy, setIsBusy] = React.useState(false);

  const [artists, setArtists] = React.useState<Artist[]>([]);
  const [tracks, setTracks] = React.useState<TrackListItem[]>([]);
  const [genres, setGenres] = React.useState<Genre[]>([]);
  const [moods, setMoods] = React.useState<Mood[]>([]);
  const [selections, setSelections] = React.useState<Selection[]>([]);

  console.log('ADMIN PAGE');

  const api = useAdminApi();

  const refreshArtists = React.useCallback(async () => {
    const data = await api.refreshArtists();
    setArtists(data);
  }, [api]);

  const refreshTracks = React.useCallback(async () => {
    const data = await api.refreshTracks();
    setTracks(data);
  }, [api]);

  const refreshTags = React.useCallback(async () => {
    const data = await api.refreshTags();
    setGenres(data.genres);
    setMoods(data.moods);
  }, [api]);

  const refreshSelections = React.useCallback(async () => {
    const data = await api.refreshSelections();
    setSelections(data);
  }, [api]);

  React.useEffect(() => {
    (async () => {
      try {
        await Promise.all([refreshArtists(), refreshTracks(), refreshTags(), refreshSelections()]);
      } catch (err) {
        setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to load data' });
      }
    })();
  }, [refreshArtists, refreshTracks, refreshTags, refreshSelections]);

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
      </aside>
      <main className="admin-content">
        {renderStatus()}
        {renderActiveTab()}
      </main>
    </div>
  );
};

export default Admin;
