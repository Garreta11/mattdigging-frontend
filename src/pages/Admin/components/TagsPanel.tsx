import React from 'react';
import type { Genre, Mood } from '../types';
import { adminFetch } from '../hooks/useAdminApi';

interface TagsPanelProps {
  genres: Genre[];
  moods: Mood[];
  onRefresh: () => Promise<void>;
  onStatus: (status: { type: 'success' | 'error'; message: string } | null) => void;
  isBusy: boolean;
  setIsBusy: (busy: boolean) => void;
}

export function TagsPanel({ genres, moods, onRefresh, onStatus, isBusy, setIsBusy }: TagsPanelProps) {
  const [newGenreName, setNewGenreName] = React.useState('');
  const [newMoodName, setNewMoodName] = React.useState('');
  const [genreEdit, setGenreEdit] = React.useState<{ id: string | null; name: string }>({ id: null, name: '' });
  const [moodEdit, setMoodEdit] = React.useState<{ id: string | null; name: string }>({ id: null, name: '' });

  async function submitTag(type: 'genre' | 'mood', name: string) {
    if (!name.trim()) return;
    setIsBusy(true);
    onStatus(null);
    try {
      const res = await adminFetch(`/admin/${type === 'genre' ? 'genres' : 'moods'}`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Save failed');
      await onRefresh();
      if (type === 'genre') setNewGenreName('');
      else setNewMoodName('');
      onStatus({ type: 'success', message: `${type === 'genre' ? 'Genre' : 'Mood'} created` });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Tag error' });
    } finally {
      setIsBusy(false);
    }
  }

  async function updateTag(type: 'genre' | 'mood', id: string, name: string) {
    if (!name.trim()) return;
    setIsBusy(true);
    onStatus(null);
    try {
      const res = await adminFetch(`/admin/${type === 'genre' ? 'genres' : 'moods'}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Save failed');
      await onRefresh();
      if (type === 'genre') setGenreEdit({ id: null, name: '' });
      else setMoodEdit({ id: null, name: '' });
      onStatus({ type: 'success', message: `${type === 'genre' ? 'Genre' : 'Mood'} updated` });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Tag error' });
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteTag(type: 'genre' | 'mood', id: string) {
    if (!window.confirm('Delete this item?')) return;
    setIsBusy(true);
    onStatus(null);
    try {
      const res = await adminFetch(`/admin/${type === 'genre' ? 'genres' : 'moods'}/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      await onRefresh();
      if (type === 'genre' && genreEdit.id === id) setGenreEdit({ id: null, name: '' });
      if (type === 'mood' && moodEdit.id === id) setMoodEdit({ id: null, name: '' });
      onStatus({ type: 'success', message: 'Tag deleted' });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Delete error' });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="admin-panels">
      <section className="admin-card">
        <header>
          <h3>Genres</h3>
        </header>
        <div className="admin-card__body">
          <div className="admin-form-row">
            <label htmlFor="new-genre">Add genre</label>
            <div className="admin-inline">
              <input
                id="new-genre"
                type="text"
                value={newGenreName}
                onChange={(e) => setNewGenreName(e.target.value)}
              />
              <button type="button" onClick={() => submitTag('genre', newGenreName)} disabled={isBusy}>
                Add
              </button>
            </div>
          </div>
          <ul className="admin-tag-list">
            {genres.map((genre) => (
              <li key={genre.id}>
                <span>{genre.name}</span>
                <div className="admin-tag-actions">
                  <button type="button" onClick={() => setGenreEdit({ id: genre.id, name: genre.name })}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteTag('genre', genre.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {genreEdit.id ? (
            <div className="admin-form-row">
              <label htmlFor="edit-genre">Edit genre</label>
              <div className="admin-inline">
                <input
                  id="edit-genre"
                  type="text"
                  value={genreEdit.name}
                  onChange={(e) => setGenreEdit((prev) => ({ ...prev, name: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => updateTag('genre', genreEdit.id!, genreEdit.name)}
                  disabled={isBusy}
                >
                  Save
                </button>
                <button type="button" onClick={() => setGenreEdit({ id: null, name: '' })}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <section className="admin-card">
        <header>
          <h3>Moods</h3>
        </header>
        <div className="admin-card__body">
          <div className="admin-form-row">
            <label htmlFor="new-mood">Add mood</label>
            <div className="admin-inline">
              <input
                id="new-mood"
                type="text"
                value={newMoodName}
                onChange={(e) => setNewMoodName(e.target.value)}
              />
              <button type="button" onClick={() => submitTag('mood', newMoodName)} disabled={isBusy}>
                Add
              </button>
            </div>
          </div>
          <ul className="admin-tag-list">
            {moods.map((mood) => (
              <li key={mood.id}>
                <span>{mood.name}</span>
                <div className="admin-tag-actions">
                  <button type="button" onClick={() => setMoodEdit({ id: mood.id, name: mood.name })}>
                    Edit
                  </button>
                  <button type="button" onClick={() => deleteTag('mood', mood.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {moodEdit.id ? (
            <div className="admin-form-row">
              <label htmlFor="edit-mood">Edit mood</label>
              <div className="admin-inline">
                <input
                  id="edit-mood"
                  type="text"
                  value={moodEdit.name}
                  onChange={(e) => setMoodEdit((prev) => ({ ...prev, name: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => updateTag('mood', moodEdit.id!, moodEdit.name)}
                  disabled={isBusy}
                >
                  Save
                </button>
                <button type="button" onClick={() => setMoodEdit({ id: null, name: '' })}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
