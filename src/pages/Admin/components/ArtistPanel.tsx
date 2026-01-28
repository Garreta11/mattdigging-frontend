import React from 'react';
import type { Artist, ArtistFormData } from '../types';
import { initialArtistForm } from '../types';
import { adminFetch } from '../hooks/useAdminApi';
import { StorageImage } from './StorageImage';
import { hasStoragePath } from '../hooks/useStorageUrl';

interface ArtistPanelProps {
  artists: Artist[];
  onRefresh: () => Promise<void>;
  onStatus: (status: { type: 'success' | 'error'; message: string } | null) => void;
  isBusy: boolean;
  setIsBusy: (busy: boolean) => void;
}

export function ArtistPanel({ artists, onRefresh, onStatus, isBusy, setIsBusy }: ArtistPanelProps) {
  const [artistForm, setArtistForm] = React.useState<ArtistFormData>({ ...initialArtistForm });
  const [artistFilter, setArtistFilter] = React.useState('');

  const filteredArtists = React.useMemo(() => {
    if (!artistFilter.trim()) return artists;
    return artists.filter((artist) => artist.name.toLowerCase().includes(artistFilter.toLowerCase()));
  }, [artists, artistFilter]);

  function resetForm() {
    setArtistForm({ ...initialArtistForm });
  }

  function selectArtist(artist: Artist) {
    setArtistForm({
      id: artist.id,
      name: artist.name,
      bio: artist.bio ?? '',
      country: artist.country ?? '',
      photo: null,
      photo_url: artist.photo_url ?? null,
    });
  }

  async function submitArtist(e: React.FormEvent) {
    e.preventDefault();
    setIsBusy(true);
    onStatus(null);
    try {
      const form = new FormData();
      form.append('name', artistForm.name);
      if (artistForm.bio) form.append('bio', artistForm.bio);
      if (artistForm.country) form.append('country', artistForm.country);
      if (artistForm.photo) form.append('photo', artistForm.photo);
      const method = artistForm.id ? 'PUT' : 'POST';
      const path = artistForm.id ? `/admin/artists/${artistForm.id}` : '/admin/artists';
      const res = await adminFetch(path, { method, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Artist save failed');
      await onRefresh();
      if (!artistForm.id && json?.id) {
        setArtistForm((prev) => ({ ...prev, id: json.id, photo_url: json.photo_url ?? prev.photo_url, photo: null }));
      } else if (json?.photo_url) {
        setArtistForm((prev) => ({ ...prev, photo_url: json.photo_url, photo: null }));
      }
      onStatus({ type: 'success', message: artistForm.id ? 'Artist updated' : 'Artist created' });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Artist error' });
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteArtist(id: string) {
    if (!window.confirm('Delete this artist?')) return;
    setIsBusy(true);
    onStatus(null);
    try {
      const res = await adminFetch(`/admin/artists/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      await onRefresh();
      if (artistForm.id === id) resetForm();
      onStatus({ type: 'success', message: 'Artist deleted' });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Delete error' });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="admin-panel">
      <aside className="admin-panel__list">
        <div className="admin-panel__list-header">
          <h3>Artists</h3>
          <button type="button" onClick={resetForm}>
            + New
          </button>
        </div>
        <input
          type="search"
          placeholder="Search artists..."
          value={artistFilter}
          onChange={(e) => setArtistFilter(e.target.value)}
        />
        <ul>
          {filteredArtists.map((artist) => (
            <li
              key={artist.id}
              className={artistForm.id === artist.id ? 'active' : ''}
              onClick={() => selectArtist(artist)}
            >
              <div className="admin-list-item-with-image">
                {hasStoragePath(artist.photo_url) && (
                  <StorageImage
                    bucket="artist_photos"
                    path={artist.photo_url}
                    alt={artist.name}
                    className="admin-list-thumb"
                  />
                )}
                <div>
                  <strong>{artist.name}</strong>
                  {artist.country ? <span>{artist.country}</span> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteArtist(artist.id);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="admin-panel__detail">
        <form onSubmit={submitArtist}>
          <h3 className="admin-form-title">
            {artistForm.id ? `Edit: ${artistForm.name || 'Untitled'}` : 'Create new artist'}
          </h3>

          {/* Photo preview */}
          {(artistForm.photo || hasStoragePath(artistForm.photo_url)) && (
            <div className="admin-media-preview">
              <StorageImage
                bucket="artist_photos"
                path={artistForm.photo_url}
                localFile={artistForm.photo}
                alt="Artist photo preview"
                className="admin-photo-preview"
              />
            </div>
          )}

          <div className="admin-form-row">
            <label htmlFor="artist-name">Name</label>
            <input
              id="artist-name"
              type="text"
              value={artistForm.name}
              onChange={(e) => setArtistForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="admin-form-row">
            <label htmlFor="artist-bio">Bio</label>
            <textarea
              id="artist-bio"
              value={artistForm.bio}
              onChange={(e) => setArtistForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <label htmlFor="artist-country">Country</label>
            <input
              id="artist-country"
              type="text"
              value={artistForm.country}
              onChange={(e) => setArtistForm((prev) => ({ ...prev, country: e.target.value }))}
            />
          </div>
          <div className="admin-form-row">
            <label htmlFor="artist-photo">
              Photo {artistForm.photo_url ? <small>(upload to replace)</small> : null}
            </label>
            <input
              id="artist-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setArtistForm((prev) => ({ ...prev, photo: e.target.files?.[0] ?? null }))}
            />
          </div>
          <div className="admin-form-actions">
            <button type="submit" disabled={isBusy}>
              {artistForm.id ? 'Save changes' : 'Create artist'}
            </button>
            {artistForm.id ? (
              <button type="button" onClick={resetForm}>
                Clear
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
