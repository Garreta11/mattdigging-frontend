import { useState } from 'react';
import './PlaylistBrowser.scss';

export type PlaylistFilter = 'mood' | 'genre' | 'country' | 'year' | 'season';
export type PlaylistOption = { value: string; label: string };

export const PLAYLIST_FILTERS: { key: PlaylistFilter; tab: string; plural: string }[] = [
  { key: 'mood', tab: 'Mood', plural: 'moods' },
  { key: 'genre', tab: 'Genre', plural: 'genres' },
  { key: 'country', tab: 'Country', plural: 'countries' },
  { key: 'year', tab: 'Year', plural: 'years' },
  { key: 'season', tab: 'Season', plural: 'seasons' },
];

// Short lists (the 4 seasons) don't need a filter field.
const MIN_OPTIONS_FOR_FILTER = 10;

interface PlaylistBrowserProps {
  tab: PlaylistFilter;
  onTabChange: (tab: PlaylistFilter) => void;
  options: Record<PlaylistFilter, PlaylistOption[]>;
  onSelect: (type: PlaylistFilter, value: string) => void;
}

// Browse playlists like the mobile app: category tabs with an underline, a filter
// field for long lists and a plain list of rows. Replaces the dropdown menus.
const PlaylistBrowser = ({ tab, onTabChange, options, onSelect }: PlaylistBrowserProps) => {
  const [filter, setFilter] = useState('');
  const current = PLAYLIST_FILTERS.find(f => f.key === tab)!;
  const all = options[tab];
  const needle = filter.trim().toLowerCase();
  const visible = needle ? all.filter(o => o.label.toLowerCase().includes(needle)) : all;

  const selectTab = (next: PlaylistFilter) => {
    setFilter('');
    onTabChange(next);
  };

  return (
    <div className="playlistBrowser">
      <div className="playlistBrowser__tabs" role="tablist">
        {PLAYLIST_FILTERS.map(f => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={f.key === tab}
            className={`playlistBrowser__tab${f.key === tab ? ' playlistBrowser__tab--active' : ''}`}
            onClick={() => selectTab(f.key)}
          >
            {f.tab}
          </button>
        ))}
      </div>

      {all.length >= MIN_OPTIONS_FOR_FILTER && (
        <label className="playlistBrowser__filter">
          <svg className="playlistBrowser__filter__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setFilter(''); }}
            placeholder={`Filter ${all.length} ${current.plural}…`}
            aria-label={`Filter ${current.plural}`}
            autoComplete="off"
            spellCheck={false}
          />
          {needle && (
            <>
              {/* How much the filter narrows the list, e.g. "6 of 145" */}
              <span className="playlistBrowser__filter__count" aria-live="polite">
                {visible.length} of {all.length}
              </span>
              <button type="button" className="playlistBrowser__filter__clear" onClick={() => setFilter('')} aria-label="Clear filter">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </>
          )}
        </label>
      )}

      {all.length === 0 ? (
        <p className="playlistBrowser__empty">Loading {current.plural}…</p>
      ) : visible.length === 0 ? (
        <p className="playlistBrowser__empty">No {current.plural} match “{filter.trim()}”.</p>
      ) : (
        <ul className="playlistBrowser__list">
          {visible.map(option => (
            <li key={option.value}>
              <button type="button" className="playlistBrowser__row" onClick={() => onSelect(tab, option.value)}>
                <span>{option.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlaylistBrowser;
