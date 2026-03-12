"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./Playlists.scss";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGenres, fetchMoods, fetchTracks, Genre, Mood, Track, fetchYears, fetchCountries, Year, Country } from '../../services/api';
import TrackItem from '../../components/TrackItem/TrackItem';
import TrackModal from '../../components/TrackModal/TrackModal';
import { useAppContext } from '../../context/AppContext';
import Loader from "../../components/Loader/Loader";
import MembersOnly from "../../components/MembersOnly/MembersOnly";

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

type DropdownKey = 'genre' | 'mood' | 'country' | 'season' | 'year' | null;

const PlaylistsPage = () => {
  const { track: currentTrack, setPlayerTrackList, setTrack, setPlaylist, isAuthed } = useAppContext();
  
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const genreParam = searchParams.get('genre');
  const moodParam = searchParams.get('mood');
  const yearParam = searchParams.get('year');
  const seasonParam = searchParams.get('season');
  const countryParam = searchParams.get('country');

  const isPlaylistLoaded = !isLoading && tracks.length > 0 && 
    (genreParam || moodParam || yearParam || seasonParam || countryParam);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        if (genreParam || moodParam || yearParam || seasonParam || countryParam) {
          const params = new URLSearchParams();
          if (genreParam) params.append('genre', genreParam);
          if (moodParam) params.append('mood', moodParam);
          if (yearParam) params.append('year', yearParam);
          if (seasonParam) params.append('season', seasonParam);
          if (countryParam) params.append('country', countryParam);
          
          const data = await fetchTracks(`?${params.toString()}`);
          setTracks(data);
        } else {
          const [genresData, moodsData, yearsData, countriesData] = await Promise.all([
            fetchGenres(),
            fetchMoods(),
            fetchYears(),
            fetchCountries()
          ]);
          setGenres(genresData);
          setMoods(moodsData);
          setYears(yearsData);
          setCountries(countriesData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [genreParam, moodParam, yearParam, seasonParam, countryParam]);

  useEffect(() => {
    hasFetched.current = false;
  }, [genreParam, moodParam, yearParam, seasonParam, countryParam]);

  // Always load filter options (for dropdowns to work even in filtered state)
  useEffect(() => {
    if (genres.length || moods.length || years.length || countries.length) return;
    Promise.all([fetchGenres(), fetchMoods(), fetchYears(), fetchCountries()])
      .then(([g, m, y, c]) => {
        setGenres(g);
        setMoods(m);
        setYears(y);
        setCountries(c);
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const applyFilter = async (params: Record<string, string>) => {
    try {
      setIsLoading(true);
      setOpenDropdown(null);
      const query = new URLSearchParams(params);
      const data = await fetchTracks(`?${query.toString()}`);
      setTracks(data);
      navigate(`/playlists?${query.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilter = () => {
    setTracks([]);
    navigate('/playlists');
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

  const toggleDropdown = (key: DropdownKey) => {
    setOpenDropdown(prev => prev === key ? null : key);
  };

  return (
    <section className={`playlistsPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button main-content__close__button--reverse" onClick={handleClose}>
          HOME
          <svg width="17" height="6" viewBox="0 0 17 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_47_2)">
              <path d="M16.898 3.1701C17.0347 3.03342 17.0347 2.81181 16.898 2.67513L14.6706 0.447756C14.5339 0.311057 14.3123 0.311057 14.1756 0.447757C14.0389 0.584422 14.0389 0.806031 14.1756 0.942716L16.1555 2.92261L14.1756 4.90251C14.0389 5.0392 14.0389 5.2608 14.1756 5.39749C14.3123 5.53417 14.5339 5.53417 14.6706 5.39749L16.898 3.1701ZM0.0567477 2.92261L0.0567477 3.27261L16.6505 3.27261L16.6505 2.92261L16.6505 2.57261L0.0567477 2.57261L0.0567477 2.92261Z" fill="var(--color-white)"/>
            </g>
            <defs>
            <clipPath id="clip0_47_2">
            <rect width="17" height="5.5" fill="white" transform="translate(17 5.5) rotate(180)"/>
            </clipPath>
            </defs>
          </svg>

        </button>
      </div>

      {/* Filter bar — always visible */}
      {!hasActiveFilter && !isLoading && (
        <div className="playlistsPage__filters" ref={dropdownRef}>
          {/* Genre dropdown */}
          <div className={`playlistsPage__dropdown ${openDropdown === 'genre' ? 'is-open' : ''} ${genreParam ? 'is-active' : ''}`}>
            <button
              className="playlistsPage__dropdown__trigger"
              onClick={() => toggleDropdown('genre')}
            >
              {genreParam ? genres.find(g => g.slug === genreParam)?.name || 'Genre' : 'Genre'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.34469 7.34471C3.07842 7.61091 3.05422 8.02761 3.27207 8.32121L3.34469 8.40531L11.5947 16.6553C11.8609 16.9216 12.2776 16.9458 12.5712 16.728L12.6553 16.6553L20.9053 8.40531C21.1982 8.11241 21.1982 7.63761 20.9053 7.34471C20.6391 7.07841 20.2224 7.05421 19.9288 7.27211L19.8447 7.34471L12.125 15.0643L4.40535 7.34471C4.11246 7.05181 3.63758 7.05181 3.34469 7.34471Z" fill="var(--color-white)"/>
              </svg>

            </button>
            {openDropdown === 'genre' && (
              <ul className="playlistsPage__dropdown__menu" data-lenis-prevent>
                {genres.map(genre => (
                  <li
                    key={genre.id}
                    className={genre.slug === genreParam ? 'is-selected' : ''}
                    onClick={() => applyFilter({ genre: genre.slug })}
                  >
                    {genre.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mood dropdown */}
          <div className={`playlistsPage__dropdown ${openDropdown === 'mood' ? 'is-open' : ''} ${moodParam ? 'is-active' : ''}`}>
            <button
              className="playlistsPage__dropdown__trigger"
              onClick={() => toggleDropdown('mood')}
            >
              {moodParam ? moods.find(m => m.slug === moodParam)?.name || 'Mood' : 'Mood'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.34469 7.34471C3.07842 7.61091 3.05422 8.02761 3.27207 8.32121L3.34469 8.40531L11.5947 16.6553C11.8609 16.9216 12.2776 16.9458 12.5712 16.728L12.6553 16.6553L20.9053 8.40531C21.1982 8.11241 21.1982 7.63761 20.9053 7.34471C20.6391 7.07841 20.2224 7.05421 19.9288 7.27211L19.8447 7.34471L12.125 15.0643L4.40535 7.34471C4.11246 7.05181 3.63758 7.05181 3.34469 7.34471Z" fill="var(--color-white)"/>
              </svg>
            </button>
            {openDropdown === 'mood' && (
              <ul className="playlistsPage__dropdown__menu" data-lenis-prevent>
                {moods.map(mood => (
                  <li
                    key={mood.id}
                    className={mood.slug === moodParam ? 'is-selected' : ''}
                    onClick={() => applyFilter({ mood: mood.slug })}
                  >
                    {mood.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Country dropdown */}
          <div className={`playlistsPage__dropdown ${openDropdown === 'country' ? 'is-open' : ''} ${countryParam ? 'is-active' : ''}`}>
            <button
              className="playlistsPage__dropdown__trigger"
              onClick={() => toggleDropdown('country')}
            >
              {countryParam || 'Country'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.34469 7.34471C3.07842 7.61091 3.05422 8.02761 3.27207 8.32121L3.34469 8.40531L11.5947 16.6553C11.8609 16.9216 12.2776 16.9458 12.5712 16.728L12.6553 16.6553L20.9053 8.40531C21.1982 8.11241 21.1982 7.63761 20.9053 7.34471C20.6391 7.07841 20.2224 7.05421 19.9288 7.27211L19.8447 7.34471L12.125 15.0643L4.40535 7.34471C4.11246 7.05181 3.63758 7.05181 3.34469 7.34471Z" fill="var(--color-white)"/>
              </svg>
            </button>
            {openDropdown === 'country' && (
              <ul className="playlistsPage__dropdown__menu" data-lenis-prevent>
                {countries.map(c => (
                  <li
                    key={c.country}
                    className={c.country === countryParam ? 'is-selected' : ''}
                    onClick={() => applyFilter({ country: c.country })}
                  >
                    {c.country}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Season dropdown */}
          <div className={`playlistsPage__dropdown ${openDropdown === 'season' ? 'is-open' : ''} ${seasonParam ? 'is-active' : ''}`}>
            <button
              className="playlistsPage__dropdown__trigger"
              onClick={() => toggleDropdown('season')}
            >
              {seasonParam ? SEASONS.find(s => s.slug === seasonParam)?.name || 'Season' : 'Season'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.34469 7.34471C3.07842 7.61091 3.05422 8.02761 3.27207 8.32121L3.34469 8.40531L11.5947 16.6553C11.8609 16.9216 12.2776 16.9458 12.5712 16.728L12.6553 16.6553L20.9053 8.40531C21.1982 8.11241 21.1982 7.63761 20.9053 7.34471C20.6391 7.07841 20.2224 7.05421 19.9288 7.27211L19.8447 7.34471L12.125 15.0643L4.40535 7.34471C4.11246 7.05181 3.63758 7.05181 3.34469 7.34471Z" fill="var(--color-white)"/>
              </svg>
            </button>
            {openDropdown === 'season' && (
              <ul className="playlistsPage__dropdown__menu" data-lenis-prevent>
                {SEASONS.map(season => (
                  <li
                    key={season.slug}
                    className={season.slug === seasonParam ? 'is-selected' : ''}
                    onClick={() => applyFilter({ season: season.slug })}
                  >
                    {season.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Year dropdown */}
          <div className={`playlistsPage__dropdown ${openDropdown === 'year' ? 'is-open' : ''} ${yearParam ? 'is-active' : ''}`}>
            <button
              className="playlistsPage__dropdown__trigger"
              onClick={() => toggleDropdown('year')}
            >
              {yearParam || 'Year'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.34469 7.34471C3.07842 7.61091 3.05422 8.02761 3.27207 8.32121L3.34469 8.40531L11.5947 16.6553C11.8609 16.9216 12.2776 16.9458 12.5712 16.728L12.6553 16.6553L20.9053 8.40531C21.1982 8.11241 21.1982 7.63761 20.9053 7.34471C20.6391 7.07841 20.2224 7.05421 19.9288 7.27211L19.8447 7.34471L12.125 15.0643L4.40535 7.34471C4.11246 7.05181 3.63758 7.05181 3.34469 7.34471Z" fill="var(--color-white)"/>
              </svg>
            </button>
            {openDropdown === 'year' && (
              <ul className="playlistsPage__dropdown__menu" data-lenis-prevent>
                {years.map(y => (
                  <li
                    key={y.year}
                    className={String(y.year) === yearParam ? 'is-selected' : ''}
                    onClick={() => applyFilter({ year: String(y.year) })}
                  >
                    {y.year}
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
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
            {isAuthed && (
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

      {/* Tracks list */}
      {hasActiveFilter && !isLoading && isAuthed && (
        <div className="playlistsPage__tracks">
          {tracks.length === 0 ? (
            <p>Music coming soon</p>
          ) : (
            tracks.map((track, index) => (
              <TrackItem
                key={track.id}
                index={index}
                track={track}
                onClick={() => handleTrackClick(track)}
                isPlaying={currentTrack?.id === track.id}
              />
            ))
          )}
        </div>
      )}

      {hasActiveFilter && !isLoading && !isAuthed && (
        <MembersOnly />
      )}

      {/* Empty state when no filter selected */}
      {!hasActiveFilter && !isLoading && (
        <div className="playlistsPage__empty">
          <p>Select a filter to explore the archive.</p>
        </div>
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