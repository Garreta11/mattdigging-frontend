import React from 'react';
import type { Selection, TrackListItem, SelectionFormData } from '../types';
import { initialSelectionForm } from '../types';
import { adminFetch } from '../hooks/useAdminApi';

interface SelectionsPanelProps {
  selections: Selection[];
  tracks: TrackListItem[];
  onRefresh: () => Promise<void>;
  onStatus: (status: { type: 'success' | 'error'; message: string } | null) => void;
  isBusy: boolean;
  setIsBusy: (busy: boolean) => void;
}

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function SelectionsPanel({
  selections,
  tracks,
  onRefresh,
  onStatus,
  isBusy,
  setIsBusy,
}: SelectionsPanelProps) {
  const [selectionForm, setSelectionForm] = React.useState<SelectionFormData>({ ...initialSelectionForm });
  const [selectionTracks, setSelectionTracks] = React.useState<string[]>([]);
  const [selectionTrackToAdd, setSelectionTrackToAdd] = React.useState('');
  const [selectionFilter, setSelectionFilter] = React.useState('');

  const filteredSelections = React.useMemo(() => {
    if (!selectionFilter.trim()) return selections;
    return selections.filter((selection) =>
      (selection.title ?? '').toLowerCase().includes(selectionFilter.toLowerCase()),
    );
  }, [selections, selectionFilter]);

  function resetForm() {
    setSelectionForm({ ...initialSelectionForm });
    setSelectionTracks([]);
  }

  function selectSelection(selection: Selection) {
    setSelectionForm({
      id: selection.id,
      title: selection.title ?? '',
      week_number: selection.week_number ? String(selection.week_number) : '',
      year: selection.year ? String(selection.year) : '',
      description: selection.description ?? '',
      is_published: selection.is_published,
      published_at: selection.published_at ? toLocalInputValue(selection.published_at) : '',
      cover: null,
    });
    const orderedTracks = (selection.tracks ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => item.track_id);
    setSelectionTracks(orderedTracks);
  }

  async function submitSelection(e: React.FormEvent) {
    e.preventDefault();
    setIsBusy(true);
    onStatus(null);
    try {
      const form = new FormData();
      if (selectionForm.title) form.append('title', selectionForm.title);
      if (selectionForm.week_number) form.append('week_number', selectionForm.week_number);
      if (selectionForm.year) form.append('year', selectionForm.year);
      if (selectionForm.description) form.append('description', selectionForm.description);
      form.append('is_published', String(selectionForm.is_published));
      if (selectionForm.published_at) {
        const iso = new Date(selectionForm.published_at).toISOString();
        form.append('published_at', iso);
      }
      if (selectionForm.cover) form.append('cover', selectionForm.cover);
      const method = selectionForm.id ? 'PUT' : 'POST';
      const path = selectionForm.id ? `/admin/selections/${selectionForm.id}` : '/admin/selections';
      const res = await adminFetch(path, { method, body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Selection save failed');
      await onRefresh();
      setSelectionForm((prev) => ({ ...prev, id: json.id ?? prev.id }));
      onStatus({ type: 'success', message: selectionForm.id ? 'Selection updated' : 'Selection created' });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Selection error' });
    } finally {
      setIsBusy(false);
    }
  }

  async function submitSelectionTracks() {
    if (!selectionForm.id) {
      onStatus({ type: 'error', message: 'Save selection details first' });
      return;
    }
    setIsBusy(true);
    onStatus(null);
    try {
      const res = await adminFetch(`/admin/selections/${selectionForm.id}/tracks`, {
        method: 'PUT',
        body: JSON.stringify({
          tracks: selectionTracks.map((trackId, index) => ({ track_id: trackId, position: index + 1 })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Track order save failed');
      await onRefresh();
      onStatus({ type: 'success', message: 'Selection tracks updated' });
    } catch (err) {
      onStatus({ type: 'error', message: err instanceof Error ? err.message : 'Selection tracks error' });
    } finally {
      setIsBusy(false);
    }
  }

  function addTrackToSelection() {
    if (!selectionTrackToAdd) return;
    setSelectionTracks((prev) => (prev.includes(selectionTrackToAdd) ? prev : [...prev, selectionTrackToAdd]));
    setSelectionTrackToAdd('');
  }

  function removeTrackFromSelection(trackId: string) {
    setSelectionTracks((prev) => prev.filter((id) => id !== trackId));
  }

  function moveTrack(trackId: string, direction: -1 | 1) {
    setSelectionTracks((prev) => {
      const index = prev.indexOf(trackId);
      if (index === -1) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  }

  function trackLabel(trackId: string) {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return trackId;
    return `${track.title} — ${track.artist?.name ?? 'Unknown'}`;
  }

  return (
    <div className="admin-panel">
      <aside className="admin-panel__list">
        <div className="admin-panel__list-header">
          <h3>Selections</h3>
          <button type="button" onClick={resetForm}>
            + New
          </button>
        </div>
        <input
          type="search"
          placeholder="Search selections..."
          value={selectionFilter}
          onChange={(e) => setSelectionFilter(e.target.value)}
        />
        <ul>
          {filteredSelections.map((selection) => (
            <li
              key={selection.id}
              className={selectionForm.id === selection.id ? 'active' : ''}
              onClick={() => selectSelection(selection)}
            >
              <div>
                <strong>{selection.title ?? 'Untitled'}</strong>
                <span>
                  Week {selection.week_number ?? '—'} / {selection.year ?? '—'}
                </span>
              </div>
              <span className={selection.is_published ? 'badge badge--live' : 'badge'}>
                {selection.is_published ? 'Published' : 'Draft'}
              </span>
            </li>
          ))}
        </ul>
      </aside>
      <section className="admin-panel__detail selection-panel">
        <form onSubmit={submitSelection} className="selection-form">
          <h3 className="admin-form-title">
            {selectionForm.id ? `Edit: ${selectionForm.title || 'Untitled'}` : 'Create new selection'}
          </h3>
          <div className="admin-grid">
            <label>
              Title
              <input
                type="text"
                value={selectionForm.title}
                onChange={(e) => setSelectionForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>
            <label>
              Week number
              <input
                type="number"
                value={selectionForm.week_number}
                onChange={(e) => setSelectionForm((prev) => ({ ...prev, week_number: e.target.value }))}
              />
            </label>
            <label>
              Year
              <input
                type="number"
                value={selectionForm.year}
                onChange={(e) => setSelectionForm((prev) => ({ ...prev, year: e.target.value }))}
              />
            </label>
            <label>
              Published at
              <input
                type="datetime-local"
                value={selectionForm.published_at}
                onChange={(e) => setSelectionForm((prev) => ({ ...prev, published_at: e.target.value }))}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              value={selectionForm.description}
              onChange={(e) => setSelectionForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <div className="admin-checkbox">
            <input
              id="selection-published"
              type="checkbox"
              checked={selectionForm.is_published}
              onChange={(e) => setSelectionForm((prev) => ({ ...prev, is_published: e.target.checked }))}
            />
            <label htmlFor="selection-published">Mark as published</label>
          </div>
          <label>
            Cover image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectionForm((prev) => ({ ...prev, cover: e.target.files?.[0] ?? null }))}
            />
          </label>
          <div className="admin-form-actions">
            <button type="submit" disabled={isBusy}>
              {selectionForm.id ? 'Save selection' : 'Create selection'}
            </button>
            {selectionForm.id ? (
              <button type="button" onClick={resetForm}>
                Clear
              </button>
            ) : null}
          </div>
        </form>
        <div className="selection-tracks">
          <header>
            <h4>Weekly selection tracks</h4>
            <button type="button" onClick={submitSelectionTracks} disabled={isBusy || !selectionForm.id}>
              Save order
            </button>
          </header>
          <div className="selection-track-add">
            <select value={selectionTrackToAdd} onChange={(e) => setSelectionTrackToAdd(e.target.value)}>
              <option value="">Choose track</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.title} — {track.artist?.name ?? 'Unknown'}
                </option>
              ))}
            </select>
            <button type="button" onClick={addTrackToSelection} disabled={!selectionTrackToAdd}>
              Add
            </button>
          </div>
          <ol>
            {selectionTracks.map((trackId, index) => (
              <li key={trackId}>
                <div className="selection-track-row">
                  <span>
                    {index + 1}. {trackLabel(trackId)}
                  </span>
                  <div className="selection-track-actions">
                    <button type="button" onClick={() => moveTrack(trackId, -1)} disabled={index === 0}>
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTrack(trackId, 1)}
                      disabled={index === selectionTracks.length - 1}
                    >
                      ↓
                    </button>
                    <button type="button" onClick={() => removeTrackFromSelection(trackId)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {selectionTracks.length === 0 ? (
            <p className="muted">No tracks yet. Add up to ten tracks per weekly drop.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
