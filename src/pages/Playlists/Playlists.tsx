"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./Playlists.scss";
import { FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGenres, fetchMoods, fetchTracks, Genre, Mood, Track, fetchYears, fetchCountries, Year, Country } from '../../services/api';
import TrackItem from '../../components/TrackItem/TrackItem';
import TrackModal from '../../components/TrackModal/TrackModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode, Mousewheel } from 'swiper/modules';
import { useAppContext } from '../../context/AppContext';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

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
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const genreParam = searchParams.get('genre');
  const moodParam = searchParams.get('mood');
  const yearParam = searchParams.get('year');
  const seasonParam = searchParams.get('season');
  const countryParam = searchParams.get('country');

  // Determinar si la playlist está completamente cargada
  const isPlaylistLoaded = !isLoading && tracks.length > 0 && 
    (genreParam || moodParam || yearParam || seasonParam || countryParam);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Si hay filtro, cargar tracks filtrados
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
          // Si no hay filtro, cargar géneros, moods, years y countries
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

  // Reset hasFetched cuando cambien los params
  useEffect(() => {
    hasFetched.current = false;
  }, [genreParam, moodParam, yearParam, seasonParam, countryParam]);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const handleGenreClick = async (slug: string) => {
    try {
      setIsLoading(true);
      const data = await fetchTracks(`?genre=${slug}`);
      setTracks(data);
      navigate(`/playlists?genre=${slug}`);
    } catch (err) {
      console.error('Error loading genre tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodClick = async (slug: string) => {
    try {
      setIsLoading(true);
      const data = await fetchTracks(`?mood=${slug}`);
      setTracks(data);
      navigate(`/playlists?mood=${slug}`);
    } catch (err) {
      console.error('Error loading mood tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearClick = async (year: number) => {
    try {
      setIsLoading(true);
      const data = await fetchTracks(`?year=${year}`);
      setTracks(data);
      navigate(`/playlists?year=${year}`);
    } catch (err) {
      console.error('Error loading year tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeasonClick = async (slug: string) => {
    try {
      setIsLoading(true);
      const data = await fetchTracks(`?season=${slug}`);
      setTracks(data);
      navigate(`/playlists?season=${slug}`);
    } catch (err) {
      console.error('Error loading season tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryClick = async (country: string) => {
    try {
      setIsLoading(true);
      const data = await fetchTracks(`?country=${country}`);
      setTracks(data);
      navigate(`/playlists?country=${encodeURIComponent(country)}`);
    } catch (err) {
      console.error('Error loading country tracks:', err);
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
    // Establecer el nombre de la playlist
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
      
      // Establecer el nombre de la playlist
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
      if (genre) {
        return `<span>${genre.name}</span>`;
      }
      return '';
    }
    
    if (moodParam) {
      const mood = moods.find(m => m.slug === moodParam);
      if (mood) {
        return `<span>${mood.name}</span>`;
      }
      return '';
    }

    if (yearParam) {
      return `<span>${yearParam}</span>`;
    }

    if (seasonParam) {
      const season = SEASONS.find(s => s.slug === seasonParam);
      if (season) {
        return `<span>${season.name}</span>`;
      }
      return '';
    }

    if (countryParam) {
      return `<span>${countryParam}</span>`;
    }
    
    return '';
  }, [genreParam, moodParam, yearParam, seasonParam, countryParam, genres, moods]);

  return (
    <section className={`playlistsPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>
      
      {/* Mostrar tracks cuando hay filtro */}
      {(genreParam || moodParam || yearParam || seasonParam || countryParam) && !isLoading && (
        <div className="playlistsPage__header">
          <div className="playlistsPage__header__left">
            <h1 className="playlistsPage__header__title" dangerouslySetInnerHTML={{ __html: getPageTitle }} />
              <button 
                className="playlistsPage__play-playlist" 
                onClick={handlePlayPlaylist}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="currentColor"/>
                </svg>
              </button>
          </div>
          
          <div className="playlistsPage__header__actions">
            {isPlaylistLoaded && (
              <>
                <button className="playlistsPage__clear-filter" onClick={handleClearFilter}>
                  Clear filter
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {/* Carousels cuando no hay filtro */}
      {!genreParam && !moodParam && !yearParam && !seasonParam && !countryParam && !isLoading && (
        <>
          <section className="playlistsPage__section">
            <h2>Genres</h2>
            <Swiper
              modules={[Navigation, FreeMode, Mousewheel]}
              spaceBetween={24}
              slidesPerView="auto"
              freeMode={true}
              navigation
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: true,
              }}
              className="playlistsPage__carousel"
            >
              {genres.map((genre, index) => (
                <SwiperSlide key={genre.id} className="playlistsPage__slide">
                  <div 
                    className={`card card--color-${(index % 12) + 1}`}
                    onClick={() => handleGenreClick(genre.slug)}
                  >
                    <div className="info">
                      <h3>{genre.name}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          <section className="playlistsPage__section">
            <h2>Moods</h2>
            <Swiper
              modules={[Navigation, FreeMode, Mousewheel]}
              spaceBetween={24}
              slidesPerView="auto"
              freeMode={true}
              navigation
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: true,
              }}
              className="playlistsPage__carousel"
            >
              {moods.map((mood, index) => (
                <SwiperSlide key={mood.id} className="playlistsPage__slide">
                  <div 
                    className={`card card--color-${(index % 12) + 1}`}
                    onClick={() => handleMoodClick(mood.slug)}
                  >
                    <div className="info">
                      <h3>{mood.name}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          <section className="playlistsPage__section">
            <h2>Countries</h2>
            <Swiper
              modules={[Navigation, FreeMode, Mousewheel]}
              spaceBetween={24}
              slidesPerView="auto"
              freeMode={true}
              navigation
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: true,
              }}
              className="playlistsPage__carousel"
            >
              {countries.map((countryObj, index) => (
                <SwiperSlide key={countryObj.country} className="playlistsPage__slide">
                  <div 
                    className={`card card--color-${(index % 12) + 1}`}
                    onClick={() => handleCountryClick(countryObj.country)}
                  >
                    <div className="info">
                      <h3>{countryObj.country}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          <section className="playlistsPage__section">
            <h2>Seasons</h2>
            <Swiper
              modules={[Navigation, FreeMode, Mousewheel]}
              spaceBetween={24}
              slidesPerView="auto"
              freeMode={true}
              navigation
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: true,
              }}
              className="playlistsPage__carousel"
            >
              {SEASONS.map((season, index) => (
                <SwiperSlide key={season.slug} className="playlistsPage__slide">
                  <div 
                    className={`card card--color-${(index % 4) + 1}`}
                    onClick={() => handleSeasonClick(season.slug)}
                  >
                    <div className="info">
                      <h3>{season.name}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>

          <section className="playlistsPage__section">
            <h2>Years</h2>
            <Swiper
              modules={[Navigation, FreeMode, Mousewheel]}
              spaceBetween={24}
              slidesPerView="auto"
              freeMode={true}
              navigation
              mousewheel={{
                forceToAxis: true,
                sensitivity: 1,
                releaseOnEdges: true,
              }}
              className="playlistsPage__carousel"
            >
              {years.map((yearObj, index) => (
                <SwiperSlide key={yearObj.year} className="playlistsPage__slide">
                  <div 
                    className={`card card--color-${(index % 12) + 1}`}
                    onClick={() => handleYearClick(yearObj.year)}
                  >
                    <div className="info">
                      <h3>{yearObj.year}</h3>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        </>
      )}

      {/* Mostrar tracks cuando hay filtro */}
      {(genreParam || moodParam || yearParam || seasonParam || countryParam) && !isLoading && (
        <div className="playlistsPage__tracks">
          {tracks.length === 0 ? (
            <p>No tracks found</p>
          ) : (
            tracks.map((track) => (
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

      <TrackModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        track={selectedTrack}
      />
    </section>
  );
};

export default PlaylistsPage;