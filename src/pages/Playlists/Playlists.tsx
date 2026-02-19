"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./Playlists.scss";
import { FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGenres, fetchMoods, fetchTracks, Genre, Mood, Track, fetchYears, fetchCountries, Year, Country } from '../../services/api';
import TrackItem from '../../components/TrackItem/TrackItem';
import TrackModal from '../../components/TrackModal/TrackModal';
import { useAppContext } from '../../context/AppContext';

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
  const { track: currentTrack, setPlayerTrackList, setTrack, setPlaylistName } = useAppContext();
  
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
      setPlaylistName(genre?.name || null);
    } else if (moodParam) {
      const mood = moods.find(m => m.slug === moodParam);
      setPlaylistName(mood?.name || null);
    } else if (yearParam) {
      setPlaylistName(yearParam);
    } else if (seasonParam) {
      const season = SEASONS.find(s => s.slug === seasonParam);
      setPlaylistName(season?.name || null);
    } else if (countryParam) {
      setPlaylistName(countryParam);
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
        setPlaylistName(genre?.name || null);
      } else if (moodParam) {
        const mood = moods.find(m => m.slug === moodParam);
        setPlaylistName(mood?.name || null);
      } else if (yearParam) {
        setPlaylistName(yearParam);
      } else if (seasonParam) {
        const season = SEASONS.find(s => s.slug === seasonParam);
        setPlaylistName(season?.name || null);
      } else if (countryParam) {
        setPlaylistName(countryParam);
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
          <svg width="34" height="11" viewBox="0 0 34 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.204244 4.65981C-0.069123 4.93318 -0.069123 5.37639 0.204244 5.64976L4.65902 10.1045C4.93238 10.3779 5.3756 10.3779 5.64897 10.1045C5.92233 9.83117 5.92233 9.38795 5.64897 9.11458L1.68917 5.15479L5.64897 1.19499C5.92233 0.92162 5.92233 0.478405 5.64897 0.205038C5.3756 -0.0683293 4.93238 -0.0683293 4.65902 0.205038L0.204244 4.65981ZM33.8867 5.15479V4.45479H0.699219V5.15479V5.85479H33.8867V5.15479Z" fill="var(--color-white)"/>
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
              <ul className="playlistsPage__dropdown__menu">
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
              <ul className="playlistsPage__dropdown__menu">
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
              <ul className="playlistsPage__dropdown__menu">
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
              <ul className="playlistsPage__dropdown__menu">
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
              <ul className="playlistsPage__dropdown__menu">
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
          {/* <svg className="search__input__playlists__icon" width="26.12" height="18" viewBox="0 0 33 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.3458 0H6.79231C5.80574 0 4.99854 0.807208 4.99854 1.79377V20.3472C4.99854 21.3338 5.80574 22.141 6.79231 22.141H25.3458C26.3323 22.141 27.1395 21.3338 27.1395 20.3472V1.79377C27.1395 0.807208 26.3323 0 25.3458 0ZM25.9437 20.3535C25.9437 20.6824 25.6746 20.9515 25.3458 20.9515H6.79231C6.46345 20.9515 6.19438 20.6824 6.19438 20.3535V1.80009C6.19438 1.47123 6.46345 1.20216 6.79231 1.20216H25.3458C25.6746 1.20216 25.9437 1.47123 25.9437 1.80009V20.3535Z" fill="#F5F1E8"/>
            <path d="M18.7383 9.40565L15.061 7.57001C14.481 7.27703 13.7994 7.30692 13.2433 7.65372C12.6873 7.99453 12.3584 8.59245 12.3584 9.24418V12.9214C12.3584 13.5732 12.6873 14.1651 13.2433 14.5119C13.5423 14.6972 13.8831 14.7929 14.2239 14.7929C14.5109 14.7929 14.7979 14.7271 15.061 14.5956L18.7383 12.76C19.372 12.4431 19.7727 11.8033 19.7727 11.0917C19.7727 10.3802 19.3781 9.74045 18.7383 9.42352V9.40565ZM18.2061 11.6718L14.5289 13.5074C14.3136 13.6151 14.0804 13.6031 13.8771 13.4775C13.6739 13.352 13.5602 13.1427 13.5602 12.9035V9.22628C13.5602 8.98711 13.6739 8.77783 13.8771 8.65227C13.9848 8.5865 14.1103 8.55063 14.2299 8.55063C14.3316 8.55063 14.4332 8.57454 14.5289 8.62238L18.2061 10.458C18.4393 10.5716 18.5768 10.7988 18.5768 11.0559C18.5768 11.313 18.4393 11.5402 18.2061 11.6539L18.2061 11.6718Z" fill="#F5F1E8"/>
            <path d="M1.86552 2.78661H3.17499C3.50385 2.78661 3.77291 2.51754 3.77291 2.18868C3.77291 1.85982 3.50385 1.59076 3.17499 1.59076H1.86552C0.837094 1.59076 0 2.42785 0 3.45628V18.6855C0 19.7139 0.837094 20.551 1.86552 20.551H3.17499C3.50385 20.551 3.77291 20.2819 3.77291 19.9531C3.77291 19.6242 3.50385 19.3551 3.17499 19.3551H1.86552C1.49481 19.3551 1.19585 19.0562 1.19585 18.6855V3.45628C1.19585 3.08557 1.49481 2.78661 1.86552 2.78661Z" fill="#F5F1E8"/>
            <path d="M30.2663 1.59076H28.9568C28.628 1.59076 28.3589 1.85982 28.3589 2.18868C28.3589 2.51754 28.628 2.78661 28.9568 2.78661H30.2663C30.637 2.78661 30.936 3.08557 30.936 3.45628V18.6855C30.936 19.0562 30.637 19.3551 30.2663 19.3551H28.9568C28.628 19.3551 28.3589 19.6242 28.3589 19.9531C28.3589 20.2819 28.628 20.551 28.9568 20.551H30.2663C31.2947 20.551 32.1318 19.7139 32.1318 18.6855V3.45628C32.1318 2.42785 31.2947 1.59076 30.2663 1.59076Z" fill="#F5F1E8"/>
          </svg> */}
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
            <button className="playlistsPage__play-playlist" onClick={handlePlayPlaylist}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="var(--color-white)"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {/* Tracks list */}
      {hasActiveFilter && !isLoading && (
        <div className="playlistsPage__tracks">
          {tracks.length === 0 ? (
            <p>No tracks found</p>
          ) : (
            tracks.map(track => (
              <TrackItem
                key={track.id}
                track={track}
                onClick={() => handleTrackClick(track)}
                isPlaying={currentTrack?.id === track.id}
              />
            ))
          )}
        </div>
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