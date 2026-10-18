"use client";

import { useEffect, useMemo, useState } from "react";
import { useWindowVirtualizer } from '../../hooks/useWindowVirtualizer';
import "./Playlists.scss";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGenres, fetchMoods, fetchTracks, Genre, Mood, Track, fetchYears, fetchCountries, Year, Country } from '../../services/api';
import TrackItem from '../../components/TrackItem/TrackItem';
import TrackModal from '../../components/TrackModal/TrackModal';
import { useAppContext } from '../../context/AppContext';
import Loader from "../../components/Loader/Loader";
import MembersOnly from "../../components/MembersOnly/MembersOnly";
import PlaylistBrowser, { PLAYLIST_FILTERS, PlaylistFilter } from "../../components/PlaylistBrowser/PlaylistBrowser";
import CloseButton from "../../components/CloseButton/CloseButton";

interface Season {
  slug: string;
  name: string;
}

const SEASONS: Season[] = [
  { slug: 'winter', name: 'Winter' },
  { slug: 'spring', name: 'Spring' },
  { slug: 'summer', name: 'Summer' },
  { slug: 'autumn', name: 'Autumn' },
];

const PlaylistsPage = () => {
  const { track: currentTrack, setPlayerTrackList, setTrack, setPlaylist, isMember, authReady } = useAppContext();

  const [genres, setGenres] = useState<Genre[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  // Treat unresolved subscription status as loading so membership UI never flashes
  const isLoading = dataLoading || !authReady;
  const [error, setError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [selectedTrack] = useState<Track | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const genreParam = searchParams.get('genre');
  const moodParam = searchParams.get('mood');
  const yearParam = searchParams.get('year');
  const seasonParam = searchParams.get('season');
  const countryParam = searchParams.get('country');

  // Active category tab in the browser, kept in the URL (?tab=genre)
  const tabParam = searchParams.get('tab');
  const tab: PlaylistFilter = PLAYLIST_FILTERS.some(f => f.key === tabParam) ? (tabParam as PlaylistFilter) : 'mood';
  const setTab = (next: PlaylistFilter) => navigate(`/playlists?tab=${next}`, { replace: true });

  // Load filter options once on mount — runs in background, no loading indicator.
  // With Cache-Control headers these are served from browser cache on repeat visits.
  useEffect(() => {
    Promise.all([fetchGenres(), fetchMoods(), fetchYears(), fetchCountries()])
      .then(([g, m, y, c]) => {
        setGenres(g);
        setMoods(m);
        setYears(y);
        setCountries(c);
      })
      .catch(() => {});
  }, []);

  // Load tracks whenever the active filter changes.
  // Cancelled flag prevents stale state updates if the effect re-runs before
  // the previous fetch completes (e.g. rapid filter switching).
  useEffect(() => {
    const hasFilter = !!(genreParam || moodParam || yearParam || seasonParam || countryParam);

    if (!hasFilter) {
      setTracks([]);
      setDataLoading(false);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams();
    if (genreParam) params.append('genre', genreParam);
    if (moodParam) params.append('mood', moodParam);
    if (yearParam) params.append('year', yearParam);
    if (seasonParam) params.append('season', seasonParam);
    if (countryParam) params.append('country', countryParam);

    setDataLoading(true);
    fetchTracks(`?${params.toString()}`)
      .then(data => { if (!cancelled) setTracks(data); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load tracks'); })
      .finally(() => { if (!cancelled) setDataLoading(false); });

    return () => { cancelled = true; };
  }, [genreParam, moodParam, yearParam, seasonParam, countryParam]);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const applyFilter = (params: Record<string, string>) => {
    navigate(`/playlists?${new URLSearchParams(params).toString()}`);
  };

  // "Discover": back to the browser, on the tab of the playlist you were looking at
  const handleClearFilter = () => {
    setTracks([]);
    const activeType = genreParam ? 'genre' : moodParam ? 'mood' : yearParam ? 'year' : seasonParam ? 'season' : countryParam ? 'country' : tab;
    navigate(`/playlists?tab=${activeType}`);
  };

  const handleTrackClick = async (track: Track) => {
    if (genreParam) {
      const genre = genres.find(g => g.slug === genreParam);
      setPlaylist({ name: genre?.name || '', url: `/playlists?genre=${genre?.slug}` });
    } else if (moodParam) {
      const mood = moods.find(m => m.slug === moodParam);
      setPlaylist({ name: mood?.name || '', url: `/playlists?mood=${mood?.slug}` });
    } else if (yearParam) {
      setPlaylist({ name: yearParam, url: `/playlists?year=${yearParam}` });
    } else if (seasonParam) {
      const season = SEASONS.find(s => s.slug === seasonParam);
      setPlaylist({ name: season?.name || '', url: `/playlists?season=${season?.slug}` });
    } else if (countryParam) {
      setPlaylist({ name: countryParam, url: `/playlists?country=${countryParam}` });
    }
  
    setPlayerTrackList(tracks);
    await new Promise(resolve => setTimeout(resolve, 0));
    setTrack(track);
  };

  const handlePlayPlaylist = () => {
    if (tracks.length > 0) {
      setPlayerTrackList(tracks);
      if (genreParam) {
        const genre = genres.find(g => g.slug === genreParam);
        setPlaylist({ name: genre?.name || '', url: `/playlists?genre=${genre?.slug}` });
      } else if (moodParam) {
        const mood = moods.find(m => m.slug === moodParam);
        setPlaylist({ name: mood?.name || '', url: `/playlists?mood=${mood?.slug}` });
      } else if (yearParam) {
        setPlaylist({ name: yearParam, url: `/playlists?year=${yearParam}` });
      } else if (seasonParam) {
        const season = SEASONS.find(s => s.slug === seasonParam);
        setPlaylist({ name: season?.name || '', url: `/playlists?season=${season?.slug}` });
      } else if (countryParam) {
        setPlaylist({ name: countryParam, url: `/playlists?country=${countryParam}` });
      }
    }
  };

  const getPageTitle = useMemo(() => {
    if (genreParam) {
      const genre = genres.find(g => g.slug === genreParam);
      return genre ? `<span>${genre.name}</span>` : '';
    }
    if (moodParam) {
      const mood = moods.find(m => m.slug === moodParam);
      return mood ? `<span>${mood.name}</span>` : '';
    }
    if (yearParam) return `<span>${yearParam}</span>`;
    if (seasonParam) {
      const season = SEASONS.find(s => s.slug === seasonParam);
      return season ? `<span>${season.name}</span>` : '';
    }
    if (countryParam) return `<span>${countryParam}</span>`;
    return '';
  }, [genreParam, moodParam, yearParam, seasonParam, countryParam, genres, moods]);

  const hasActiveFilter = !!(genreParam || moodParam || yearParam || seasonParam || countryParam);

  // ── Virtualizer — only renders visible TrackItems ────────────────────────
  // TrackItem height: 52px cover + 2×0.65rem padding ≈ 73px; round up to 76.
  const { containerRef: trackListRef, visibleIndices, paddingTop, paddingBottom } =
    useWindowVirtualizer(tracks.length, 76);

  return (
    <section className={`playlistsPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <CloseButton onClick={handleClose} />

      {/* Browse: category tabs, filter field and list (like the mobile app) */}
      {!hasActiveFilter && !isLoading && (
        <PlaylistBrowser
          tab={tab}
          onTabChange={setTab}
          onSelect={(type, value) => applyFilter({ [type]: value })}
          options={{
            mood: moods.map(m => ({ value: m.slug, label: m.name })),
            genre: genres.map(g => ({ value: g.slug, label: g.name })),
            country: countries.map(c => ({ value: c.country, label: c.country })),
            year: years.map(y => ({ value: String(y.year), label: String(y.year) })),
            season: SEASONS.map(se => ({ value: se.slug, label: se.name })),
          }}
        />
      )}
      {/* Clear filter */}
      {hasActiveFilter && !isLoading &&(
        <button className="playlistsPage__clear-filter-btn" onClick={handleClearFilter}>
          <svg width="17" height="5.5" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)"/>
          </svg>
          Discover
        </button>
      )}

      {/* Playlist header (title + play) when a filter is active */}
      {hasActiveFilter && !isLoading && (
        <div className="playlistsPage__header">
          <div className="playlistsPage__header__left">
            <h1
              className="playlistsPage__header__title"
              dangerouslySetInnerHTML={{ __html: getPageTitle }}
            />
            {isMember && (
              <button className="playlistsPage__play-playlist" onClick={handlePlayPlaylist}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="var(--color-white)"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading && <Loader />}
      {error && <p className="error">{error}</p>}

      {/* Tracks list — virtualized: only renders visible rows */}
      {hasActiveFilter && !isLoading && isMember && (
        <div ref={trackListRef} className="playlistsPage__tracks">
          {tracks.length === 0 ? (
            <p>Music coming soon</p>
          ) : (
            <>
              {paddingTop > 0 && <div style={{ height: paddingTop }} />}
              {visibleIndices.map(index => (
                <TrackItem
                  key={tracks[index].id}
                  index={index}
                  track={tracks[index]}
                  onClick={() => handleTrackClick(tracks[index])}
                  isPlaying={currentTrack?.id === tracks[index].id}
                />
              ))}
              {paddingBottom > 0 && <div style={{ height: paddingBottom }} />}
            </>
          )}
        </div>
      )}

      {hasActiveFilter && !isLoading && !isMember && (
        <MembersOnly />
      )}

      <TrackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        track={selectedTrack}
      />
    </section>
  );
};

export default PlaylistsPage;