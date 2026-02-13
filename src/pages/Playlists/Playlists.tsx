"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./Playlists.scss";
import { FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchGenres, fetchMoods, fetchTracks, Genre, Mood, Track } from '../../services/api';
import TrackItem from '../../components/TrackItem/TrackItem';
import TrackModal from '../../components/TrackModal/TrackModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode, Mousewheel } from 'swiper/modules';
import { useAppContext } from '../../context/AppContext';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

const PlaylistsPage = () => {
  const { track: currentTrack, setPlayerTrackList, setTrack, setPlaylistName } = useAppContext();
  
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
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

  // Determinar si la playlist está completamente cargada
  const isPlaylistLoaded = !isLoading && tracks.length > 0 && (genreParam || moodParam);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Si hay filtro, cargar tracks filtrados
        if (genreParam || moodParam) {
          const params = new URLSearchParams();
          if (genreParam) params.append('genre', genreParam);
          if (moodParam) params.append('mood', moodParam);
          
          console.log(params.toString());
          const data = await fetchTracks(`?${params.toString()}`);
          console.log('Tracks loaded:', data.length);
          setTracks(data);
        } else {
          // Si no hay filtro, cargar géneros y moods
          const [genresData, moodsData] = await Promise.all([
            fetchGenres(),
            fetchMoods()
          ]);
          setGenres(genresData);
          setMoods(moodsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [genreParam, moodParam]);

  // Reset hasFetched cuando cambien los params
  useEffect(() => {
    hasFetched.current = false;
  }, [genreParam, moodParam]);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => navigate('/'), 1000);
  };

  const handleGenreClick = async (slug: string) => {
    try {
      // Precargar tracks antes de navegar
      setIsLoading(true);
      const data = await fetchTracks(`?genre=${slug}`);
      setTracks(data);
      
      // Navegar después de cargar
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
      // Precargar tracks antes de navegar
      setIsLoading(true);
      const data = await fetchTracks(`?mood=${slug}`);
      setTracks(data);
      
      // Navegar después de cargar
      navigate(`/playlists?mood=${slug}`);
    } catch (err) {
      console.error('Error loading mood tracks:', err);
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
    console.log(track);
    
    // Establecer el nombre de la playlist
    if (genreParam) {
      const genre = genres.find(g => g.slug === genreParam);
      setPlaylistName(genre?.name || null);
    } else if (moodParam) {
      const mood = moods.find(m => m.slug === moodParam);
      setPlaylistName(mood?.name || null);
    }
  
    // Actualizar la playlist primero
    setPlayerTrackList(tracks);
    
    // Esperar al siguiente tick para que React procese el cambio
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Ahora actualizar el track
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
      }
    }
  };

  const getPageTitle = useMemo(() => {
    if (genreParam) {
      const genrePrefixes = [
        'diving into',
      ];
      
      const genre = genres.find(g => g.slug === genreParam);
      console.log(genre);
      if (genre) {
        const randomPrefix = genrePrefixes[Math.floor(Math.random() * genrePrefixes.length)];
        return `${randomPrefix} <span>${genre.name}</span>`;
      }
      return 'genre journey';
    }
    
    if (moodParam) {
      const moodPrefixes = [
        'when you\'re feeling',
      ];
      
      const mood = moods.find(m => m.slug === moodParam);
      if (mood) {
        const randomPrefix = moodPrefixes[Math.floor(Math.random() * moodPrefixes.length)];
        return `${randomPrefix} <span>${mood.name}</span>`;
      }
      return 'mood journey';
    }
    
    return 'let the music find you';
  }, [genreParam, moodParam, genres, moods]);

  return (
    <section className={`playlistsPage main-content ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="main-content__close">
        <button className="main-content__close__button" onClick={handleClose}>
          <FiX size={24} />
        </button>
      </div>

      <div className="playlistsPage__header">
        <h1 className="playlistsPage__header__title" dangerouslySetInnerHTML={{ __html: getPageTitle }} />
        <div className="playlistsPage__header__actions">
          {/* Mostrar botones solo cuando la playlist está completamente cargada */}
          {isPlaylistLoaded && (
            <>
              <button 
                className="playlistsPage__play-playlist" 
                onClick={handlePlayPlaylist}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5.14286V18.8571L19 12L8 5.14286Z" fill="currentColor"/>
                </svg>
              </button>
              <button className="playlistsPage__clear-filter" onClick={handleClearFilter}>
                Clear filter
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {/* Carousels cuando no hay filtro */}
      {!genreParam && !moodParam && !isLoading && (
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
        </>
      )}

      {/* Mostrar tracks cuando hay filtro */}
      {(genreParam || moodParam) && !isLoading && (
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