import React from 'react';
import type { Artist, TrackListItem, Genre, Mood, TrackFormData } from '../types';
import { initialTrackForm } from '../types';
import { adminFetch, getSignedUploadUrl, uploadToSignedUrl } from '../hooks/useAdminApi';
import { StorageImage } from './StorageImage';
import { StorageAudio } from './StorageAudio';
import { TagSelector } from './TagSelector';
import { hasStoragePath } from '../hooks/useStorageUrl';

interface TrackPanelProps {
  tracks: TrackListItem[];
  artists: Artist[];
  genres: Genre[];
  moods: Mood[];
  onRefresh: () => Promise<void>;
  onStatus: (status: { type: 'success' | 'error'; message: string } | null) => void;
  isBusy: boolean;
  setIsBusy: (busy: boolean) => void;
}

export function TrackPanel({
  tracks,
  artists,
  genres,
  moods,
  onRefresh,
  onStatus,
  isBusy,
  setIsBusy,
}: TrackPanelProps) {
  const [trackForm, setTrackForm] = React.useState<TrackFormData>({ ...initialTrackForm });
  const [trackFilter, setTrackFilter] = React.useState('');
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const filteredTracks = React.useMemo(() => {
    if (!trackFilter.trim()) return tracks;
    return tracks.filter((track) => {
      const label = `${track.title} ${track.artist?.name ?? ''}`.toLowerCase();
      return label.includes(trackFilter.toLowerCase());
    });
  }, [tracks, trackFilter]);

  function resetForm() {
    setTrackForm({ ...initialTrackForm });
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  function selectTrack(track: TrackListItem) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTrackForm({
      id: track.id,
      title: track.title,
      artist_id: track.artist_id,
      album_name: track.album_name ?? '',
      year: track.year ? String(track.year) : '',
      decade: track.decade ?? '',
      country: track.country ?? '',
      season: track.season ?? '',
      description: track.description ?? '',
      is_free: track.is_free,
      audio: null,
      cover: null,
      audio_url: track.audio_url ?? '',
      cover_url: track.cover_url ?? '',
      genre_ids: track.genre_ids ?? [],
      mood_ids: track.mood_ids ?? [],
    });
  }

  function setGenres(ids: string[]) {
    setTrackForm((prev) => ({ ...prev, genre_ids: ids }));
  }

  function setMoods(ids: string[]) {
    setTrackForm((prev) => ({ ...prev, mood_ids: ids }));
  }

  async function submitTrack(e: React.FormEvent) {
    e.preventDefault();
    setIsBusy(true);
    onStatus(null);
    try {
      let audioUrl = trackForm.audio_url || '';
      let coverUrl = trackForm.cover_url || '';

      if (trackForm.audio) {
        const { signedUrl, token, path } = await getSignedUploadUrl('audio', trackForm.audio);
        await uploadToSignedUrl({ signedUrl, token, file: trackForm.audio });
        audioUrl = path;
      }
      if (trackForm.cover) {
        const { signedUrl, token, path } = await getSignedUploadUrl('image', trackForm.cover);
        await uploadToSignedUrl({ signedUrl, token, file: trackForm.cover });
        coverUrl = path;
      }

      // Only require audio for new tracks
      if (!trackForm.id && !audioUrl && !trackForm.audio) {
        throw new Error('Audio file is required for new tracks');
      }

      const body = {
        title: trackForm.title || undefined,
        artist_id: trackForm.artist_id || undefined,
        album_name: trackForm.album_name || undefined,
        year: trackForm.year || undefined,
        decade: trackForm.decade || undefined,
        country: trackForm.country || undefined,
        season: trackForm.season || undefined,
        description: trackForm.description || undefined,
        is_free: trackForm.is_free,
        genre_ids: JSON.stringify(trackForm.genre_ids ?? []),
        mood_ids: JSON.stringify(trackForm.mood_ids ?? []),
        audio_url: audioUrl || undefined,
        cover_url: coverUrl || undefined,
      };

      const method = trackForm.id ? 'PUT' : 'POST';
      const path = trackForm.id ? `/admin/tracks/${trackForm.id}` : '/admin/tracks';
      const res = await adminFetch(path, { method, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Track save failed');
      await onRefresh();
      setTrackForm((prev) => ({
        ...prev,
        id: json.id ?? prev.id,
        audio_url: (json.audio_url ?? audioUrl ?? '') || '',
        cover_url: (json.cover_url ?? coverUrl ?? '') || '',
        audio: null,
        cover: null,
      }));
      onStatus({ type: 'success', message: trackForm.id ? 'Track updated' : 'Track uploaded' });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Track error' });
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteTrack(id: string) {
    if (!window.confirm('Delete this track?')) return;
    setIsBusy(true);
    onStatus(null);
    try {
      const res = await adminFetch(`/admin/tracks/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Delete failed');
      await onRefresh();
      if (trackForm.id === id) resetForm();
      onStatus({ type: 'success', message: 'Track deleted' });
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
          <h3>Tracks</h3>
          <button type="button" onClick={resetForm}>
            + New
          </button>
        </div>
        <input
          type="search"
          placeholder="Search tracks..."
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
        />
        <ul>
          {filteredTracks.map((track) => (
            <li
              key={track.id}
              className={trackForm.id === track.id ? 'active' : ''}
              onClick={() => selectTrack(track)}
            >
              <div className="admin-list-item-with-image">
                {hasStoragePath(track.cover_url) && (
                  <StorageImage
                    bucket="covers"
                    path={track.cover_url}
                    alt={track.title}
                    className="admin-list-thumb"
                  />
                )}
                <div>
                  <strong>{track.title}</strong>
                  <span>{track.artist?.name ?? 'Unknown'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTrack(track.id);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="admin-panel__detail">
        <form onSubmit={submitTrack}>
          <h3 className="admin-form-title">
            {trackForm.id ? `Edit: ${trackForm.title || 'Untitled'}` : 'Create new track'}
          </h3>

          {/* Cover image preview */}
          {(trackForm.cover || hasStoragePath(trackForm.cover_url)) && (
            <div className="admin-media-preview">
              <StorageImage
                bucket="covers"
                path={trackForm.cover_url}
                localFile={trackForm.cover}
                alt="Cover preview"
                className="admin-cover-preview"
              />
            </div>
          )}

          {/* Audio player */}
          {(trackForm.audio || hasStoragePath(trackForm.audio_url)) && (
            <StorageAudio
              bucket="tracks"
              path={trackForm.audio_url}
              localFile={trackForm.audio}
              audioRef={audioRef}
            />
          )}

          <div className="admin-grid">
            <label>
              Title
              <input
                type="text"
                value={trackForm.title}
                onChange={(e) => setTrackForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>
            <label>
              Artist
              <select
                value={trackForm.artist_id}
                onChange={(e) => setTrackForm((prev) => ({ ...prev, artist_id: e.target.value }))}
              >
                <option value="">Select artist</option>
                {artists.map((artist) => (
                  <option key={artist.id} value={artist.id}>
                    {artist.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Album
              <input
                type="text"
                value={trackForm.album_name}
                onChange={(e) => setTrackForm((prev) => ({ ...prev, album_name: e.target.value }))}
              />
            </label>
            <label>
              Year
              <input
                type="number"
                value={trackForm.year}
                onChange={(e) => setTrackForm((prev) => ({ ...prev, year: e.target.value }))}
              />
            </label>
            <label>
              Decade
              <input
                type="text"
                value={trackForm.decade}
                onChange={(e) => setTrackForm((prev) => ({ ...prev, decade: e.target.value }))}
              />
            </label>
            <label>
              Country
              <input
                type="text"
                value={trackForm.country}
                onChange={(e) => setTrackForm((prev) => ({ ...prev, country: e.target.value }))}
              />
            </label>
            <label>
              Season
              <input
                type="text"
                value={trackForm.season}
                onChange={(e) => setTrackForm((prev) => ({ ...prev, season: e.target.value }))}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              value={trackForm.description}
              onChange={(e) => setTrackForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <div className="admin-checkbox">
            <input
              id="track-free"
              type="checkbox"
              checked={trackForm.is_free}
              onChange={(e) => setTrackForm((prev) => ({ ...prev, is_free: e.target.checked }))}
            />
            <label htmlFor="track-free">Free track</label>
          </div>

          {/* Genres */}
          <TagSelector
            label="Genres"
            options={genres}
            selectedIds={trackForm.genre_ids}
            onChange={setGenres}
          />

          {/* Moods */}
          <TagSelector
            label="Moods"
            options={moods}
            selectedIds={trackForm.mood_ids}
            onChange={setMoods}
          />

          <label>
            Audio file {trackForm.id ? <small>(upload to replace)</small> : <small>(required)</small>}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setTrackForm((prev) => ({ ...prev, audio: e.target.files?.[0] ?? null }))}
            />
          </label>
          <label>
            Cover image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setTrackForm((prev) => ({ ...prev, cover: e.target.files?.[0] ?? null }))}
            />
          </label>
          <div className="admin-form-actions">
            <button type="submit" disabled={isBusy}>
              {trackForm.id ? 'Save changes' : 'Upload track'}
            </button>
            {trackForm.id ? (
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
